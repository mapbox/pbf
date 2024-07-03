'use strict';

var fs = require('fs');
var path = require('path');
var test = require('node:test');
var assert = require('node:assert/strict');
var resolve = require('resolve-protobuf-schema').sync;

var Pbf = require('../');
var compile = require('../compile');

test('compiles vector tile proto', function() {
    var proto = resolve(path.join(__dirname, '../bench/vector_tile.proto'));
    var tileBuf = fs.readFileSync(path.join(__dirname, 'fixtures/12665.vector.pbf'));
    var Tile = compile(proto).Tile;

    var tile = Tile.read(new Pbf(tileBuf));
    assert.equal(tile.layers.length, 11);

    var pbf = new Pbf();
    Tile.write(tile, pbf);
    var buf = pbf.finish();
    assert.equal(buf.length, 124946);
});

test('compiles proto with embedded type reference', function() {
    var proto = resolve(path.join(__dirname, './fixtures/embedded_type.proto'));
    compile(proto);
});

test('compiles packed proto', function() {
    var proto = resolve(path.join(__dirname, './fixtures/packed.proto'));
    var NotPacked = compile(proto).NotPacked;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    NotPacked.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = FalsePacked.read(new Pbf(buf));
    assert.equal(buf.length, 17);
    assert.deepEqual(original, decompressed);
});

test('reads packed with unpacked field', function() {
    var proto = resolve(path.join(__dirname, './fixtures/packed.proto'));
    var Packed = compile(proto).Packed;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    Packed.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = FalsePacked.read(new Pbf(buf));
    assert.equal(buf.length, 14);
    assert.deepEqual(original, decompressed);
});

test('compiles packed proto3', function() {
    var proto = resolve(path.join(__dirname, './fixtures/packed_proto3.proto'));
    var NotPacked = compile(proto).NotPacked;
    var FalsePacked = compile(proto).FalsePacked;

    var original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    FalsePacked.write(original, pbf);
    var falsePackedBuf = pbf.finish();

    pbf = new Pbf();
    NotPacked.write(original, pbf);
    var notPackedBuf = pbf.finish();

    var decompressed = NotPacked.read(new Pbf(falsePackedBuf));
    assert.deepEqual(original, decompressed);
    assert.equal(notPackedBuf.length, 14);
    assert.ok(falsePackedBuf.length > notPackedBuf.length, 'Did not respect [packed=false]');
});

test('compiles packed with multi-byte tags', function() {
    var proto = resolve(path.join(__dirname, './fixtures/packed_proto3.proto'));
    var Packed = compile(proto).Packed;

    var original = {
        value: [300, 400, 500]
    };
    var pbf = new Pbf();
    Packed.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = Packed.read(new Pbf(buf));
    assert.equal(buf.length, 9);
    assert.deepEqual(original, decompressed);
});

test('compiles defaults', function() {
    var proto = resolve(path.join(__dirname, './fixtures/defaults.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    assert.equal(buf.length, 0);
    assert.deepEqual(data, {
        type: 1,
        name: 'test',
        flag: true,
        weight: 1.5,
        id: 1
    });
});

test('compiles proto3 ignoring defaults', function() {
    var proto = resolve(path.join(__dirname, './fixtures/defaults_proto3.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    assert.equal(buf.length, 0);

    assert.equal(data.type, 0);
    assert.equal(data.name, '');
    assert.equal(data.flag, false);
    assert.equal(data.weight, 0);
    assert.equal(data.id, 0);
});

test('compiles maps', function() {
    var proto = resolve(path.join(__dirname, './fixtures/map.proto'));
    var Envelope = compile(proto).Envelope;

    var original = {
        kv : {
            a: 'value a',
            b: 'value b'
        },
        kn : {
            a : 1,
            b : 2
        }
    };

    var pbf = new Pbf();
    Envelope.write(original, pbf);
    var buf = pbf.finish();

    var decompressed = Envelope.read(new Pbf(buf));

    assert.deepEqual(original, decompressed);
});

test('does not write undefined or null values', function() {
    var proto = resolve(path.join(__dirname, './fixtures/embedded_type.proto'));
    var EmbeddedType = compile(proto).EmbeddedType;
    var pbf = new Pbf();

    EmbeddedType.write({}, pbf);

    EmbeddedType.write({
        'sub_field': null
    }, pbf);

    EmbeddedType.write({
        value: null
    });
});

test('handles all implicit default values', function() {
    var proto = resolve(path.join(__dirname, './fixtures/defaults_implicit.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);
    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    assert.equal(buf.length, 0);

    assert.equal(data.type, 0);
    assert.equal(data.name, '');
    assert.equal(data.flag, false);
    assert.equal(data.weight, 0);
    assert.equal(data.id, 0);
    assert.deepEqual(data.tags, []);
    assert.deepEqual(data.numbers, []);
    assert.equal(data.bytes, undefined);
    assert.equal(data.custom, undefined);
    assert.deepEqual(data.types, []);
});

test('sets oneof field name', function() {
    var proto = resolve(path.join(__dirname, './fixtures/oneof.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({}, pbf);
    var data = Envelope.read(new Pbf(pbf.finish()));

    assert.equal(data.value, undefined);
    assert.equal(data.id, 0);

    pbf = new Pbf();
    Envelope.write({
        float: 1.5
    }, pbf);
    data = Envelope.read(new Pbf(pbf.finish()));

    assert.equal(data.value, 'float');
    assert.equal(data[data.value], 1.5);
});

test('handles jstype=JS_STRING', function() {
    var proto = resolve(path.join(__dirname, './fixtures/type_string.proto'));
    var TypeString = compile(proto).TypeString;
    var TypeNotString = compile(proto).TypeNotString;
    var pbf = new Pbf();

    TypeString.write({
        int: '-5',
        long: '10000',
        boolVal: true,
        float: '12',
    }, pbf);

    var buf = pbf.finish();
    var data = TypeString.read(new Pbf(buf));

    assert.equal(data.int, '-5');
    assert.equal(data.long, '10000');
    assert.equal(data.boolVal, true);
    assert.equal(data.float, '12');
    assert.equal(data.default_implicit, '0');
    assert.equal(data.default_explicit, '42');

    data = TypeNotString.read(new Pbf(buf));
    assert.equal(data.int, -5);
    assert.equal(data.long, 10000);
    assert.equal(data.boolVal, true);
    assert.equal(data.float, 12);
});

test('handles negative varint', function() {
    var proto = resolve(path.join(__dirname, './fixtures/varint.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({
        int: -5,
        long: -10
    }, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    assert.equal(data.int, -5);
    assert.equal(data.long, -10);
});

test('handles unsigned varint', function() {
    var proto = resolve(path.join(__dirname, './fixtures/varint.proto'));
    var Envelope = compile(proto).Envelope;
    var pbf = new Pbf();

    Envelope.write({
        uint: Math.pow(2, 31),
        ulong: Math.pow(2, 63)
    }, pbf);

    var buf = pbf.finish();
    var data = Envelope.read(new Pbf(buf));

    assert.equal(data.uint, Math.pow(2, 31));
    assert.equal(data.ulong, Math.pow(2, 63));
});
