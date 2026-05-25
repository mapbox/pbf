
import {createHash} from 'crypto';
import {mkdirSync, existsSync, readFileSync, writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import protocolBuffers from 'protocol-buffers';
import protobufjs from 'protobufjs';
import {readTile, writeTile} from '../test/fixtures/vector_tile.js';
import {PbfReader, PbfWriter} from '../index.js';

const vtProtoUrl = new URL('../test/fixtures/vector_tile.proto', import.meta.url);
const ProtocolBuffersTile = protocolBuffers(readFileSync(vtProtoUrl)).Tile;
const ProtobufjsTile = protobufjs.loadSync(fileURLToPath(vtProtoUrl)).lookup('vector_tile.Tile');

const tilesetId = 'mapbox.mapbox-streets-v8';
const urlTemplate = `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.mvt?access_token={token}`;

const libs = {
    pbf: {
        decode: body => readTile(new PbfReader(body)),
        encode: (tile) => { const pbf = new PbfWriter(); writeTile(tile, pbf); return pbf.finish(); }
    },
    'protocol-buffers': {
        decode: body => ProtocolBuffersTile.decode(body),
        encode: tile => ProtocolBuffersTile.encode(tile)
    },
    'protobuf.js': {
        decode: body => ProtobufjsTile.decode(body),
        encode: tile => ProtobufjsTile.encode(tile).finish()
    },
    JSON: {
        decode: body => JSON.parse(body),
        encode: tile => JSON.stringify(tile)
    }
};

const stats = {};
for (const name of Object.keys(libs)) stats[name] = {read: 0, write: 0};
let size = 0;
let jsonSize = 0;
let numTiles = 0;

await runStats(urlTemplate, processTile, showStats, {
    width: 2880,
    height: 1800,
    minZoom: 0,
    maxZoom: 16,
    center: [-77.032751, 38.912792]
});

function processTile(body) {
    if (!body) return;
    size += body.length;
    numTiles++;

    // pre-decode once with pbf to get a tile object usable as input for encoders
    const tile = readTile(new PbfReader(body));
    const tileJSON = JSON.stringify(tile);
    jsonSize += tileJSON.length;
    const pbInput = ProtocolBuffersTile.decode(body);
    const pbjsInput = ProtobufjsTile.decode(body);

    const inputs = {
        pbf: body,
        'protocol-buffers': body,
        'protobuf.js': body,
        JSON: tileJSON
    };
    const encodeInputs = {
        pbf: tile,
        'protocol-buffers': pbInput,
        'protobuf.js': pbjsInput,
        JSON: tile
    };

    for (const name of Object.keys(libs)) {
        let now = clock();
        libs[name].decode(inputs[name]);
        stats[name].read += clock(now);

        now = clock();
        libs[name].encode(encodeInputs[name]);
        stats[name].write += clock(now);
    }
}

function showStats() {
    console.log('%d tiles, %d KB pbf / %d KB JSON', numTiles, Math.round(size / 1024), Math.round(jsonSize / 1024));
    for (const name of Object.keys(libs)) {
        const inSize = name === 'JSON' ? jsonSize : size;
        const s = stats[name];
        console.log('%s decode: %dms, %d MB/s   encode: %dms, %d MB/s',
            name.padEnd(18),
            Math.round(s.read), speed(s.read, inSize),
            Math.round(s.write), speed(s.write, inSize));
    }
}

function speed(time, size) {
    return Math.round((size / (1 << 20)) / (time / 1000));
}

function clock(start) {
    if (!start) return process.hrtime();
    const t = process.hrtime(start);
    return t[0] * 1e3 + t[1] * 1e-6;
}

async function runStats(urlTemplate, onTile, onDone, options) {
    const cacheRoot = join(dirname(fileURLToPath(import.meta.url)), 'tile-cache');
    const cacheKey = urlTemplate.replace(/access_token=[^&]*/, '');
    const cachePath = join(cacheRoot, createHash('sha1').update(cacheKey).digest('hex').slice(0, 8));
    mkdirSync(cachePath, {recursive: true});

    const tilePromises = [];

    for (let z = options.minZoom; z <= options.maxZoom; z++) {
        const p = pointToTileFraction(options.center[0], options.center[1], z);
        const z2 = 2 ** z;

        const minX = Math.max(Math.floor(p[0] - 0.5 * options.width / 512), 0);
        const minY = Math.max(Math.floor(p[1] - 0.5 * options.height / 512), 0);
        const maxX = Math.min(Math.floor(p[0] + 0.5 * options.width / 512), z2 - 1);
        const maxY = Math.min(Math.floor(p[1] + 0.5 * options.height / 512), z2 - 1);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                tilePromises.push(loadTile(z, x, y, urlTemplate, cachePath));
            }
        }
    }

    const tiles = await Promise.all(tilePromises);
    for (const tile of tiles) onTile(tile);

    process.stderr.write('\n');
    onDone();
}

async function loadTile(z, x, y, urlTemplate, cachePath) {
    const tilePath = join(cachePath, `${z}-${x}-${y}`);

    if (existsSync(tilePath)) {
        process.stderr.write('.');
        return readFileSync(tilePath);
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) throw new Error('Missing MAPBOX_ACCESS_TOKEN environment variable.');

    const tileUrl = urlTemplate
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', z)
        .replace('{token}', token);

    const response = await fetch(tileUrl);

    if (response.status === 200) {
        const data = Buffer.from(await response.arrayBuffer());
        writeFileSync(tilePath, data);
        process.stderr.write('+');
        return data;
    }
    if (response.status === 404) {
        process.stderr.write('_');
        return null;
    }

    throw new Error(`${response.status} ${tileUrl}`);
}

function pointToTileFraction(lon, lat, z) {
    const sin = Math.sin(lat * Math.PI / 180);
    const z2 = 2 ** z;
    let x = z2 * (lon / 360 + 0.5);
    const y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
    x = x % z2;
    if (x < 0) x += z2;
    return [x, y, z];
}
