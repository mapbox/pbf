var Pbf = require('../'),
    fs = require('fs'),
    test = require('tape').test;

test('initialization', function(t) {
    var buf = new Pbf(new Buffer([]));
    buf.destroy();
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
