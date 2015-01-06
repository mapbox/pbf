'use strict';

var Benchmark = require('benchmark'),
    fs = require('fs'),
    protobuf = require('protocol-buffers'),
    vt = require('./vector_tile'),
    read = vt.read,
    write = vt.write;

var Tile = protobuf(fs.readFileSync(__dirname + '/vector_tile.proto')).Tile,
    data = fs.readFileSync(__dirname + '/../test/fixtures/12665.vector.pbf'),
    suite = new Benchmark.Suite();

var tile = read(data),
    tileJSON = JSON.stringify(tile),
    tile2 = Tile.decode(data);

write(tile);

suite
.add('decode vector tile with pbf', function() {
    read(data);
})
.add('encode vector tile with pbf', function() {
    write(tile);
})
.add('decode vector tile with protocol-buffers', function() {
    Tile.decode(data);
})
.add('encode vector tile with protocol-buffers', function() {
    Tile.encode(tile2);
})
.add('JSON.parse vector tile', function() {
    JSON.parse(tileJSON);
})
.add('JSON.stringify vector tile', function() {
    JSON.stringify(tile);
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.run();
