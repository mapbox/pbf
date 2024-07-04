
import Benchmark from 'benchmark';
import fs from 'fs';
import {fileURLToPath} from 'node:url';
import protocolBuffers from 'protocol-buffers';
import protobufjs from 'protobufjs';

import {readTile, writeTile} from './vector_tile.js';
import Pbf from '../index.js';

var data = fs.readFileSync(new URL('../test/fixtures/12665.vector.pbf', import.meta.url)),
    suite = new Benchmark.Suite(),
    vtProtoUrl = new URL('vector_tile.proto', import.meta.url),
    ProtocolBuffersTile = protocolBuffers(fs.readFileSync(vtProtoUrl)).Tile,
    ProtobufjsTile = protobufjs.loadSync(fileURLToPath(vtProtoUrl)).lookup('vector_tile.Tile');

var pbfTile = readTile(new Pbf(data)),
    tileJSON = JSON.stringify(pbfTile),
    protocolBuffersTile = ProtocolBuffersTile.decode(data),
    protobufjsTile = ProtobufjsTile.decode(data);

suite
    .add('decode vector tile with pbf', function() {
        readTile(new Pbf(data));
    })
    .add('encode vector tile with pbf', function() {
        var pbf = new Pbf();
        writeTile(pbfTile, pbf);
        pbf.finish();
    })
    .add('decode vector tile with protocol-buffers', function() {
        ProtocolBuffersTile.decode(data);
    })
    .add('encode vector tile with protocol-buffers', function() {
        ProtocolBuffersTile.encode(protocolBuffersTile);
    })
    .add('decode vector tile with protobuf.js', function() {
        ProtobufjsTile.decode(data);
    })
    .add('encode vector tile with protobuf.js', function() {
        ProtobufjsTile.encode(protobufjsTile);
    })
    .add('JSON.parse vector tile', function() {
        JSON.parse(tileJSON);
    })
    .add('JSON.stringify vector tile', function() {
        JSON.stringify(pbfTile);
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .run();
