
import {createHash} from 'crypto';
import {mkdirSync, existsSync, readFileSync, writeFileSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import {readTile, writeTile} from '../test/fixtures/vector_tile.js';
import Pbf from '../index.js';

const token = process.env.ACCESS_TOKEN;
if (!token) throw new Error('Missing ACCESS_TOKEN environment variable (Mapbox access token).');

const tilesetId = 'mapbox.mapbox-streets-v8';
const url = `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.mvt?access_token=${token}`;

let readTime = 0;
let writeTime = 0;
let size = 0;
let numTiles = 0;

await runStats(url, processTile, showStats, {
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

    let now = clock();
    const tile = readTile(new Pbf(body));
    readTime += clock(now);

    now = clock();
    const pbf = new Pbf();
    writeTile(tile, pbf);
    const buf = pbf.finish();
    writeTime += clock(now);

    console.assert(buf);
}

function showStats() {
    console.log('%d tiles, %d KB total', numTiles, Math.round(size / 1024));
    console.log('read time: %dms, or %d MB/s', Math.round(readTime), speed(readTime, size));
    console.log('write time: %dms, or %d MB/s', Math.round(writeTime), speed(writeTime, size));
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
    const cachePath = join(cacheRoot, createHash('sha1').update(urlTemplate).digest('hex').slice(0, 8));
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

    const tileUrl = urlTemplate
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', z);

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
