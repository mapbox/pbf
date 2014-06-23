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
