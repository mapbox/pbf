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

test('readVarint basic', function(t) {
    var buf = new Pbf(fs.readFileSync(__dirname + '/fixtures/3165.vector.pbf'));
    t.equal(buf.length, 28056);
    t.equal(buf.readVarint(), 120);
    t.equal(buf.readVarint(), 14876);
    t.equal(buf.readVarint(), 125);
    t.equal(buf.readVarint(), 9);
    buf.destroy();
    t.end();
});

var testNumbers = [1,0,0,4,14,23,40,86,141,113,925,258,1105,1291,6872,12545,65521,126522,133028,444205,846327,1883372,
    3716678,674158,15203102,27135056,42501689,110263473,6449928,65474499,943840723,1552431153,407193337,2193544970,
    8167778088,5502125480,14014009728,56371207648,9459068416,410595966336,673736830976,502662539776,2654996269056,
    5508583663616,6862782705664,34717688324096,1074895093760,95806297440256,130518477701120,197679237955584,
    301300890730496,1310140661760000,2883205519638528,2690669862715392,3319292539961344,16685777991761920,
    34440040683667456,18753483997970430,191469931697537020,210965926957285380,553117314065629200,1672805111207821300,
    915631351846142000,7104934249802760000,15151949892148003000,7535796501977498000,64051481720637100000,
    15941438144704938000,292343229962413670000];

test('readVarint & writeVarint', function(t) {
    var buf = new Pbf(new Buffer(0));

    for (var i = 0; i < testNumbers.length; i++) {
        buf.writeVarint(testNumbers[i]);
    }
    var len = buf.finish().length;
    t.equal(len, 356);
    buf.pos = 0;

    i = 0;
    while (buf.pos < len) {
        t.equal(buf.readVarint(), testNumbers[i++]);
    }

    t.end();
});

test('readDouble', function(t) {
    var buffer = new Buffer(8);
    buffer.writeDoubleLE(42, 0);
    var buf = new Pbf(buffer);
    t.equal(buf.readDouble(), 42);
    t.end();
});

test('readFloat', function(t) {
    var buffer = new Buffer(4);
    buffer.writeFloatLE(123.456, 0);
    var buf = new Pbf(buffer);
    t.equal(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
    t.end();
});

test('readFixed32', function(t) {
    var buffer = new Buffer(16);
    buffer.writeUInt32LE(42, 0);
    buffer.writeUInt32LE(24, 4);
    var buf = new Pbf(buffer);
    t.equal(buf.readFixed32(), 42);
    t.equal(buf.readFixed32(), 24);
    t.end();
});

test('writeFixed64', function (t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeFixed64(102451124123);
    t.same(toArray(buf.buf), [155,23,144,218,23,0,0,0]);
    t.end();
});

test('readFixed64', function (t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeFixed64(102451124123);
    buf.pos = 0;
    t.same(buf.readFixed64(), 102451124123);
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
