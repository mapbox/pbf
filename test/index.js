var Pbf = require('../'),
    fs = require('fs'),
    test = require('tape').test;

require('./buffer.test');

function toArray(buf) {
    var arr = [];
    for (var i = 0; i < buf.length; i++) {
        arr.push(buf[i]);
    }
    return arr;
}

test('initialization', function(t) {
    var buf = new Pbf(new Buffer([]));
    buf.destroy();
    t.end();
});

test('realloc', function(t) {
    var buf = new Pbf(new Buffer([]));
    buf.realloc(5);
    t.equal(buf.length, 8);
    t.end();
});

test('readVarInt', function(t) {
    var buf = new Pbf(fs.readFileSync(__dirname + '/fixtures/3165.vector.pbf'));
    t.equal(buf.length, 28056);
    t.equal(buf.readVarint(), 120);
    t.equal(buf.readVarint(), 14876);
    t.equal(buf.readVarint(), 125);
    t.equal(buf.readVarint(), 9);
    buf.destroy();
    t.end();
});

test('readDouble', function(t) {
    var buffer = new Buffer(8);
    buffer.writeDoubleLE(42, 0);
    var buf = new Pbf(buffer);
    t.equal(buf.readDouble(), 42);
    t.end();
});

test('readUInt32', function(t) {
    var buffer = new Buffer(16);
    buffer.writeUInt32LE(42, 0);
    buffer.writeUInt32LE(24, 4);
    var buf = new Pbf(buffer);
    t.equal(buf.readUInt32(), 42);
    t.equal(buf.readUInt32(), 24);
    t.end();
});

test('writeUInt64LE', function (t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeUInt64(102451124123);
    t.same(toArray(buf.buf), [155,23,144,218,23,0,0,0]);
    t.end();
});

test('readUInt64LE', function (t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeUInt64(102451124123);
    buf.pos = 0;
    t.same(buf.readUInt64(), 102451124123);
    t.end();
});

test('read', function (t) {
    var buf = new Pbf(fs.readFileSync(__dirname + '/fixtures/12665.vector.pbf')),
        layerOffsets = [];

    buf.read(function (tag) {
        if (tag == 3) layerOffsets.push(buf.pos);
    });

    t.ok(buf.pos >= buf.length);
    t.same(layerOffsets, [1,2490,2581,2819,47298,47626,55732,56022,56456,88178,112554]);

    t.end();
});

test('readMessage', function (t) {
    var buf = new Pbf(fs.readFileSync(__dirname + '/fixtures/12665.vector.pbf')),
        layerNames = [];

    buf.read(function (tag) {
        if (tag == 3) buf.readMessage(readLayer);
    });

    function readLayer(tag) {
        if (tag === 1) layerNames.push(buf.readString());
    }

    t.same(layerNames, ["landuse","water","barrier_line","building","tunnel","road",
        "place_label","water_label","poi_label","road_label","housenum_label"]);

    t.end();
});
