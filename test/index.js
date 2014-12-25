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

