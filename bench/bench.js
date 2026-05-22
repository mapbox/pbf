
import Benchmark from 'benchmark';
import fs from 'fs';
import {fileURLToPath} from 'node:url';
import protocolBuffers from 'protocol-buffers';
import protobufjs from 'protobufjs';

import {readTile, writeTile} from '../test/fixtures/vector_tile.js';
import {PbfReader, PbfWriter} from '../index.js';

const data = fs.readFileSync(new URL('../test/fixtures/12665.vector.pbf', import.meta.url)),
    suite = new Benchmark.Suite(),
    vtProtoUrl = new URL('../test/fixtures/vector_tile.proto', import.meta.url),
    ProtocolBuffersTile = protocolBuffers(fs.readFileSync(vtProtoUrl)).Tile,
    ProtobufjsTile = protobufjs.loadSync(fileURLToPath(vtProtoUrl)).lookup('vector_tile.Tile');

const pbfTile = readTile(new PbfReader(data)),
    tileJSON = JSON.stringify(pbfTile),
    protocolBuffersTile = ProtocolBuffersTile.decode(data),
    protobufjsTile = ProtobufjsTile.decode(data);

suite
    .add('decode vector tile with pbf', () => {
        readTile(new PbfReader(data));
    })
    .add('encode vector tile with pbf', () => {
        const pbf = new PbfWriter();
        writeTile(pbfTile, pbf);
        pbf.finish();
    })
    .add('decode vector tile with protocol-buffers', () => {
        ProtocolBuffersTile.decode(data);
    })
    .add('encode vector tile with protocol-buffers', () => {
        ProtocolBuffersTile.encode(protocolBuffersTile);
    })
    .add('decode vector tile with protobuf.js', () => {
        ProtobufjsTile.decode(data);
    })
    .add('encode vector tile with protobuf.js', () => {
        ProtobufjsTile.encode(protobufjsTile);
    })
    .add('JSON.parse vector tile', () => {
        JSON.parse(tileJSON);
    })
    .add('JSON.stringify vector tile', () => {
        JSON.stringify(pbfTile);
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .run();
