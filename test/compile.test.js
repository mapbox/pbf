'use strict';

var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var resolve = require('resolve-protobuf-schema').sync;

var Pbf = require('../');
var compile = require('../compile');

test('compiles vector tile proto', function(t) {
    var proto = resolve(path.join(__dirname, '../bench/vector_tile.proto'));
    var tileBuf = fs.readFileSync(path.join(__dirname, 'fixtures/12665.vector.pbf'));
    var Tile = compile(proto).Tile;

    var tile = Tile.read(new Pbf(tileBuf));
    t.equal(tile.layers.length, 11);

    var pbf = new Pbf();
    Tile.write(tile, pbf);
    var buf = pbf.finish();
    t.equal(buf.length, 125023);

    t.end();
});

test('compiles proto with embedded type reference', function(t) {
    var proto = resolve(path.join(__dirname, './fixtures/embedded_type.proto'));
    compile(proto);

    t.end();
});

test('compiles packed proto', function(t) {
    var proto = resolve(path.join(__dirname, './fixtures/packed.proto'));
    var NotPacked = compile(proto).NotPacked;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    NotPacked.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = FalsePacked.read(new Pbf(buf));
    t.deepEqual(original, decompressed);

    t.end();
});
