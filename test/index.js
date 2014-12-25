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

var testNumbers = [1,0,0,4,14,23,40,86,141,113,925,258,1105,1291,6872,12545,65521,126522,133028,444205,846327,1883372,
    3716678,674158,15203102,27135056,42501689,110263473,6449928,65474499,943840723,1552431153,407193337,2193544970,
    8167778088,5502125480,14014009728,56371207648,9459068416,410595966336,673736830976,502662539776,2654996269056,
    5508583663616,6862782705664,34717688324096,1074895093760,95806297440256,130518477701120,197679237955584,
    301300890730496,1310140661760000,2883205519638528,2690669862715392,3319292539961344];

test('readVarint & writeVarint', function(t) {
    var buf = new Pbf(new Buffer(0));

    for (var i = 0; i < testNumbers.length; i++) {
        buf.writeVarint(testNumbers[i]);
    }
    var len = buf.finish().length;
    t.equal(len, 229);
    buf.pos = 0;

    i = 0;
    while (buf.pos < len) {
        t.equal(buf.readVarint(), testNumbers[i++]);
    }

    t.end();
});

var testSigned = [0,1,2,0,2,-1,11,18,-17,145,369,891,-1859,-798,2780,-13107,12589,-16433,21140,148023,221062,-985141,
    494812,-2121059,-2078871,82483,19219191,29094607,35779553,-215357075,-334572816,-991453240,-1677041436,-3781260558,
    -6633052788,1049995056,-22854591776,37921771616,-136983944384,187687841024,107420097536,1069000079360,1234936065024,
    -2861223108608,-492686688256,-6740322942976,-7061359607808,24638679941120,19583051038720,83969719009280,
    52578722775040,416482297118720,1981092523409408,-389256637841408];

test('readSVarint & writeSVarint', function(t) {
    var buf = new Pbf(new Buffer(0));

    for (var i = 0; i < testSigned.length; i++) {
        buf.writeSVarint(testSigned[i]);
    }
    var len = buf.finish().length;
    t.equal(len, 224);
    buf.pos = 0;

    i = 0;
    while (buf.pos < len) {
        t.equal(buf.readSVarint(), testSigned[i++]);
    }

    t.end();
});

test('writeVarint throws error on a number that is too big', function(t) {
    var buf = new Pbf(new Buffer(0));
    t.throws(function () {
        buf.writeVarint(29234322996241367000012);
    });
    t.end();
});

test('readDouble', function(t) {
    var buffer = new Buffer(8);
    buffer.writeDoubleLE(12345.6789012345, 0);
    var buf = new Pbf(buffer);
    t.equal(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
    t.end();
});

test('writeDouble', function(t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeDouble(12345.6789012345);
    buf.pos = 0;
    t.equal(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
    t.end();
});

test('readFloat', function(t) {
    var buffer = new Buffer(4);
    buffer.writeFloatLE(123.456, 0);
    var buf = new Pbf(buffer);
    t.equal(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
    t.end();
});

test('writeFloat', function(t) {
    var buf = new Pbf(new Buffer(4));
    buf.writeFloat(123.456);
    buf.pos = 0;
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

test('writeFixed32', function(t) {
    var buf = new Pbf(new Buffer(16));
    buf.writeFixed32(42);
    buf.writeFixed32(24);
    buf.pos = 0;
    t.equal(buf.readFixed32(), 42);
    t.equal(buf.readFixed32(), 24);
    t.end();
});

test('readFixed64', function (t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeFixed64(102451124123);
    buf.pos = 0;
    t.same(buf.readFixed64(), 102451124123);
    t.end();
});

test('writeFixed64', function (t) {
    var buf = new Pbf(new Buffer(8));
    buf.writeFixed64(102451124123);
    t.same(toArray(buf.buf), [155,23,144,218,23,0,0,0]);
    t.end();
});

test('writeString', function (t) {
    var buffer = new Buffer(32);
    var buf = new Pbf(buffer);
    buf.writeVarint(Buffer.byteLength('Привет'));
    buffer.write('Привет', buf.pos);
    buf.pos = 0;
    t.equal(buf.readString(), 'Привет');
    t.end();
});

test('readString', function (t) {
    var buf = new Pbf(new Buffer(0));
    buf.writeString('Привет');
    buf.pos = 0;
    t.equal(buf.readString(), 'Привет');
    t.end();
});

test('readFields', function (t) {
    var buf = new Pbf(fs.readFileSync(__dirname + '/fixtures/12665.vector.pbf')),
        layerOffsets = [];

    buf.readFields(function (tag) {
        if (tag == 3) layerOffsets.push(buf.pos);
    });

    t.ok(buf.pos >= buf.length);
    t.same(layerOffsets, [1,2490,2581,2819,47298,47626,55732,56022,56456,88178,112554]);

    t.end();
});

test('readMessage', function (t) {
    var buf = new Pbf(fs.readFileSync(__dirname + '/fixtures/12665.vector.pbf')),
        layerNames = [];

    buf.readFields(function (tag) {
        if (tag == 3) buf.readMessage(readLayer);
    });

    function readLayer(tag) {
        if (tag === 1) layerNames.push(buf.readString());
    }

    t.same(layerNames, ["landuse","water","barrier_line","building","tunnel","road",
        "place_label","water_label","poi_label","road_label","housenum_label"]);

    t.end();
});
