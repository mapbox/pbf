'use strict';

var Benchmark = require('benchmark'),
    fs = require('fs'),
    path = require('path'),
    protocolBuffers = require('protocol-buffers'),
    protobufjs = require('protobufjs'),
    vt = require('./vector_tile'),
    Pbf = require('../');

var pbfReadTile = vt.Tile.read,
    pbfWriteTile = vt.Tile.write,
    data = fs.readFileSync(path.resolve(__dirname, '../test/fixtures/12665.vector.pbf')),
    suite = new Benchmark.Suite(),
    ProtocolBuffersTile = protocolBuffers(fs.readFileSync(path.resolve(__dirname, 'vector_tile.proto'))).Tile,
    ProtobufjsTile = protobufjs.loadSync(path.resolve(__dirname, 'vector_tile.proto'))
        .lookup('vector_tile.Tile');

var pbfTile = pbfReadTile(new Pbf(data)),
    tileJSON = JSON.stringify(pbfTile),
    protocolBuffersTile = ProtocolBuffersTile.decode(data),
    protobufjsTile = ProtobufjsTile.decode(data);

suite
    .add('decode vector tile with pbf', function() {
        pbfReadTile(new Pbf(data));
    })
    .add('encode vector tile with pbf', function() {
        var pbf = new Pbf();
        pbfWriteTile(pbfTile, pbf);
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
