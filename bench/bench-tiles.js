import {createHash} from 'crypto';
import {mkdirSync, existsSync, readFileSync, writeFileSync} from 'fs';
import {execFileSync} from 'child_process';
import {fileURLToPath} from 'url';
import protocolBuffers from 'protocol-buffers';
import protobufjs from 'protobufjs';
import {readTile, writeTile} from '../test/fixtures/vector_tile.js';
import {PbfReader, PbfWriter} from '../index.js';

// Run without arguments for the full table, or as `node bench/bench-tiles.js <lib> <decode|encode>` (lib being
// a key of `libs` below) to measure a single row in one process, printing its {first, median} times as JSON.

// Each library × operation runs in fresh processes so JIT state and GC pressure don't leak between them.
// Within a process, the median pass after warmup is stable, but V8 heuristics can still land a whole process
// in a slower mode (e.g. ~7% for protobuf.js decode in a quarter of runs), so we take the best of a few.
const RUNS = 1;
const WARMUP = 3;
const PASSES = 5;

const vtProtoPath = fileURLToPath(new URL('../test/fixtures/vector_tile.proto', import.meta.url));
const urlTemplate = 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token={token}';
const view = {width: 2880, height: 1800, minZoom: 0, maxZoom: 16, center: [-77.032751, 38.912792]};

/** @type {Record<string, () => {decode: (input: any) => any, encode: (tile: any) => any}>} */
const libs = {
    pbf() {
        return {
            decode: buf => readTile(new PbfReader(buf)),
            encode(tile) {
                const pbf = new PbfWriter();
                writeTile(tile, pbf);
                return pbf.finish();
            }
        };
    },
    'protocol-buffers'() {
        const Tile = protocolBuffers(readFileSync(vtProtoPath)).Tile;
        return {decode: buf => Tile.decode(buf), encode: tile => Tile.encode(tile)};
    },
    'protobuf.js'() {
        const Tile = protobufjs.loadSync(vtProtoPath).lookup('vector_tile.Tile');
        return {decode: buf => Tile.decode(buf), encode: tile => Tile.encode(tile).finish()};
    },
    JSON() {
        return {decode: str => JSON.parse(str), encode: tile => JSON.stringify(tile)};
    }
};

const tiles = await loadTiles();

if (process.argv.length > 2) {
    console.log(JSON.stringify(measure(process.argv[2], process.argv[3])));

} else {
    const size = tiles.reduce((sum, buf) => sum + buf.length, 0);
    const jsonSize = tiles.reduce((sum, buf) => sum + Buffer.byteLength(JSON.stringify(readTile(new PbfReader(buf)))), 0);
    console.log(`${tiles.length} tiles, ${mb(size)} MB pbf / ${mb(jsonSize)} MB JSON, Node ${process.version}`);
    console.log(`best of ${RUNS} processes × median of ${PASSES} passes after ${WARMUP} warmup ones; first (cold) pass in parentheses\n`);

    const script = fileURLToPath(import.meta.url);
    const ops = ['decode', 'encode'];
    /** @type {Record<string, {first: number, median: number}>} */
    const best = {};
    for (let run = 0; run < RUNS; run++) { // interleaved so that any slow drift in the machine affects all equally
        for (const name of Object.keys(libs)) {
            for (const op of ops) {
                const {first, median} = JSON.parse(execFileSync(process.execPath, [script, name, op], {encoding: 'utf8'}));
                const b = best[`${name} ${op}`] ??= {first, median};
                b.first = Math.min(b.first, first);
                b.median = Math.min(b.median, median);
            }
        }
    }
    for (const name of Object.keys(libs)) {
        const inSize = name === 'JSON' ? jsonSize : size;
        const [decode, encode] = ops.map((op) => {
            const {first, median} = best[`${name} ${op}`];
            return `${Math.round(median)}ms, ${speed(median, inSize)} MB/s (${Math.round(first)}ms)`;
        });
        console.log(`${name.padEnd(17)} decode: ${decode.padEnd(30)} encode: ${encode}`);
    }
}

/**
 * @param {string} name
 * @param {string} op
 */
function measure(name, op) {
    const lib = libs[name]();
    const fn = lib[/** @type {'decode' | 'encode'} */ (op)];
    const decodePbf = (/** @type {Uint8Array} */ buf) => readTile(new PbfReader(buf));

    // Encode inputs are decoded right before each (timed) encode call rather than all upfront: keeping
    // every decoded tile alive makes a ~400MB heap, and full GCs marking it would dominate the timings.
    const inputs = name === 'JSON' && op === 'decode' ? tiles.map(buf => JSON.stringify(decodePbf(buf))) : tiles;
    const prepare = op === 'decode' ? (/** @type {any} */ input) => input : name === 'JSON' ? decodePbf : lib.decode;

    const pass = () => {
        let time = 0;
        for (const input of inputs) {
            const value = prepare(input);
            const start = performance.now();
            fn(value);
            time += performance.now() - start;
        }
        return time;
    };
    const first = pass();
    for (let i = 0; i < WARMUP - 1; i++) pass();
    const times = Array.from({length: PASSES}, pass).sort((a, b) => a - b);
    return {first, median: times[PASSES >> 1]};
}

/** @param {number} bytes */
function mb(bytes) {
    return (bytes / (1 << 20)).toFixed(1);
}

/**
 * @param {number} ms
 * @param {number} bytes
 */
function speed(ms, bytes) {
    return Math.round(Number(mb(bytes)) / (ms / 1000));
}

async function loadTiles() {
    const cacheKey = urlTemplate.replace(/access_token=[^&]*/, '');
    const cacheDir = new URL(`tile-cache/${createHash('sha1').update(cacheKey).digest('hex').slice(0, 8)}/`, import.meta.url);
    mkdirSync(cacheDir, {recursive: true});

    const tilePromises = [];
    for (let z = view.minZoom; z <= view.maxZoom; z++) {
        const [px, py] = pointToTileFraction(view.center[0], view.center[1], z);
        const z2 = 2 ** z;
        const minX = Math.max(Math.floor(px - 0.5 * view.width / 512), 0);
        const minY = Math.max(Math.floor(py - 0.5 * view.height / 512), 0);
        const maxX = Math.min(Math.floor(px + 0.5 * view.width / 512), z2 - 1);
        const maxY = Math.min(Math.floor(py + 0.5 * view.height / 512), z2 - 1);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) tilePromises.push(loadTile(z, x, y, new URL(`${z}-${x}-${y}`, cacheDir)));
        }
    }
    return (await Promise.all(tilePromises)).filter(tile => tile !== null);
}

/**
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {URL} tilePath
 */
async function loadTile(z, x, y, tilePath) {
    if (existsSync(tilePath)) return readFileSync(tilePath);

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) throw new Error('Missing MAPBOX_ACCESS_TOKEN environment variable.');

    const tileUrl = urlTemplate
        .replace('{x}', String(x))
        .replace('{y}', String(y))
        .replace('{z}', String(z))
        .replace('{token}', token);

    const response = await fetch(tileUrl);
    if (response.status === 200) {
        const data = Buffer.from(await response.arrayBuffer());
        writeFileSync(tilePath, data);
        return data;
    }
    if (response.status === 404) return null;

    throw new Error(`${response.status} ${tileUrl}`);
}

/**
 * @param {number} lon
 * @param {number} lat
 * @param {number} z
 */
function pointToTileFraction(lon, lat, z) {
    const sin = Math.sin(lat * Math.PI / 180);
    const z2 = 2 ** z;
    let x = z2 * (lon / 360 + 0.5);
    const y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    x = x % z2;
    if (x < 0) x += z2;
    return [x, y];
}
