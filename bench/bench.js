import fs from 'fs';
import {fileURLToPath} from 'node:url';
import protocolBuffers from 'protocol-buffers';
import protobufjs from 'protobufjs';

import {readTile, writeTile} from '../test/fixtures/vector_tile.js';
import {PbfReader, PbfWriter} from '../index.js';

const data = fs.readFileSync(new URL('../test/fixtures/12665.vector.pbf', import.meta.url)),
    vtProtoUrl = new URL('../test/fixtures/vector_tile.proto', import.meta.url),
    ProtocolBuffersTile = protocolBuffers(fs.readFileSync(vtProtoUrl)).Tile,
    ProtobufjsTile = protobufjs.loadSync(fileURLToPath(vtProtoUrl)).lookup('vector_tile.Tile');

const pbfTile = readTile(new PbfReader(data)),
    tileJSON = JSON.stringify(pbfTile),
    protocolBuffersTile = ProtocolBuffersTile.decode(data),
    protobufjsTile = ProtobufjsTile.decode(data);

bench('decode vector tile with pbf', () => readTile(new PbfReader(data)));
bench('encode vector tile with pbf', () => {
    const pbf = new PbfWriter();
    writeTile(pbfTile, pbf);
    pbf.finish();
});
bench('decode vector tile with protocol-buffers', () => ProtocolBuffersTile.decode(data));
bench('encode vector tile with protocol-buffers', () => ProtocolBuffersTile.encode(protocolBuffersTile));
bench('decode vector tile with protobuf.js', () => ProtobufjsTile.decode(data));
bench('encode vector tile with protobuf.js', () => ProtobufjsTile.encode(protobufjsTile).finish());
bench('JSON.parse vector tile', () => JSON.parse(tileJSON));
bench('JSON.stringify vector tile', () => JSON.stringify(pbfTile));

/**
 * Times fn in batches of at least 20ms (so timer overhead is negligible) for about a second after a warmup,
 * then reports the median time per call and the 10th–90th percentile spread, which shrugs off GC spikes.
 * @param {string} name
 * @param {() => void} fn
 */
function bench(name, fn, ms = 1000) {
    for (const t = performance.now(); performance.now() - t < ms / 4;) fn();
    const samples = [];
    for (const start = performance.now(); performance.now() - start < ms;) {
        const t = performance.now();
        let n = 0;
        do { fn(); n++; } while (performance.now() - t < 20);
        samples.push((performance.now() - t) / n);
    }
    samples.sort((a, b) => a - b);
    const q = (/** @type {number} */ p) => samples[Math.floor((samples.length - 1) * p)];
    const med = q(0.5);
    const spread = (q(0.9) - q(0.1)) / med * 100;
    console.log(`${name}: ${(1000 / med).toFixed(0)} ops/sec, ${med.toFixed(3)}ms ±${spread.toFixed(1)}% (${samples.length} samples)`);
}
