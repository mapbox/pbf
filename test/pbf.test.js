
import Pbf from '../index.js';
import fs from 'fs';
import test from 'node:test';
import assert from 'node:assert/strict';

function toArray(buf) {
    const arr = [];
    for (let i = 0; i < buf.length; i++) {
        arr.push(buf[i]);
    }
    return arr;
}

test('initialization', () => {
    assert.doesNotThrow(() => new Pbf(Buffer.alloc(0)));
});

test('realloc', () => {
    const buf = new Pbf(Buffer.alloc(0));
    buf.realloc(5);
    assert.ok(buf.length >= 5);
    buf.realloc(25);
    assert.ok(buf.length >= 30);
});

const testNumbers = [1, 0, 0, 4, 14, 23, 40, 86, 127, 141, 113, 925, 258, 1105, 1291, 6872, 12545, 16256, 65521, 126522,
    133028, 444205,  846327, 1883372,  2080768,  266338304,  34091302912,  17179869184,  3716678, 674158, 15203102,
    27135056, 42501689, 110263473, 6449928, 65474499, 943840723, 1552431153, 407193337, 2193544970,  8167778088,
    5502125480, 14014009728, 56371207648, 9459068416, 410595966336, 673736830976, 502662539776, 2654996269056,
    5508583663616, 6862782705664, 34717688324096, 1074895093760, 95806297440256, 130518477701120, 197679237955584,
    301300890730496, 1310140661760000, 2883205519638528, 2690669862715392, 3319292539961344];

test('readVarint & writeVarint', () => {
    const buf = new Pbf(Buffer.alloc(0));

    for (let i = 0; i < testNumbers.length; i++) {
        buf.writeVarint(testNumbers[i]);
        if (testNumbers[i]) buf.writeVarint(-testNumbers[i]);
    }
    const len = buf.finish().length;
    assert.equal(len, 839);
    buf.finish();

    let i = 0;
    while (buf.pos < len) {
        assert.equal(buf.readVarint(), testNumbers[i]);
        if (testNumbers[i]) assert.equal(buf.readVarint(true), -testNumbers[i]);
        i++;
    }
});

test('writeVarint writes 0 for NaN', () => {
    const buf = Buffer.alloc(16);
    const pbf = new Pbf(buf);

    // Initialize buffer to ensure consistent tests
    buf.write('0123456789abcdef', 0);

    pbf.writeVarint('not a number');
    pbf.writeVarint(NaN);
    pbf.writeVarint(50);
    pbf.finish();

    assert.equal(pbf.readVarint(), 0);
    assert.equal(pbf.readVarint(), 0);
    assert.equal(pbf.readVarint(), 50);
});

test('readVarint signed', () => {
    let bytes = [0xc8, 0xe8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01];
    let buf = new Pbf(Buffer.from(bytes));
    assert.equal(buf.readVarint(true), -3000);

    bytes = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01];
    buf = new Pbf(Buffer.from(bytes));
    assert.equal(buf.readVarint(true), -1);

    bytes = [0xc8, 0x01];
    buf = new Pbf(Buffer.from(bytes));
    assert.equal(buf.readVarint(true), 200);
});

test('readVarint64 (compatibility)', () => {
    const bytes = [0xc8, 0xe8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01];
    const buf = new Pbf(Buffer.from(bytes));
    assert.equal(buf.readVarint64(), -3000);
});

test('readVarint & writeVarint handle really big numbers', () => {
    const buf = new Pbf();
    const bigNum1 = Math.pow(2, 60);
    const bigNum2 = Math.pow(2, 63);
    buf.writeVarint(bigNum1);
    buf.writeVarint(bigNum2);
    buf.finish();
    assert.equal(buf.readVarint(), bigNum1);
    assert.equal(buf.readVarint(), bigNum2);
});

const testSigned = [0, 1, 2, 0, 2, -1, 11, 18, -17, 145, 369, 891, -1859, -798, 2780, -13107, 12589, -16433, 21140, 148023,
    221062, -985141, 494812, -2121059, -2078871, 82483, 19219191, 29094607, 35779553, -215357075, -334572816, -991453240,
    -1677041436, -3781260558, -6633052788, 1049995056, -22854591776, 37921771616, -136983944384, 187687841024, 107420097536,
    1069000079360, 1234936065024, -2861223108608, -492686688256, -6740322942976, -7061359607808, 24638679941120,
    19583051038720, 83969719009280, 52578722775040, 416482297118720, 1981092523409408, -389256637841408];

test('readSVarint & writeSVarint', () => {
    const buf = new Pbf(Buffer.alloc(0));

    for (let i = 0; i < testSigned.length; i++) {
        buf.writeSVarint(testSigned[i]);
    }
    const len = buf.finish().length;
    assert.equal(len, 224);
    buf.finish();

    let i = 0;
    while (buf.pos < len) {
        assert.equal(buf.readSVarint(), testSigned[i++]);
    }
});

test('writeVarint throws error on a number that is too big', () => {
    const buf = new Pbf(Buffer.alloc(0));

    assert.throws(() => {
        buf.writeVarint(29234322996241367000012); // eslint-disable-line
    });

    assert.throws(() => {
        buf.writeVarint(-29234322996241367000012);  // eslint-disable-line
    });
});

test('readVarint throws error on a number that is longer than 10 bytes', () => {
    const buf = new Pbf(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
    assert.throws(() => {
        buf.readVarint();
    });
});

test('readBoolean & writeBoolean', () => {
    const buf = new Pbf();
    buf.writeBoolean(true);
    buf.writeBoolean(false);
    buf.finish();
    assert.equal(buf.readBoolean(), true);
    assert.equal(buf.readBoolean(), false);
});

test('readBytes', () => {
    const buf = new Pbf([8, 1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(toArray(buf.readBytes()), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('writeBytes', () => {
    const buf = new Pbf();
    buf.writeBytes([1, 2, 3, 4, 5, 6, 7, 8]);
    const bytes = buf.finish();
    assert.deepEqual(toArray(bytes), [8, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('readDouble', () => {
    const buffer = Buffer.alloc(8);
    buffer.writeDoubleLE(12345.6789012345, 0);
    const buf = new Pbf(buffer);
    assert.equal(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
});

test('readPacked and writePacked', () => {
    const testNumbers2 = testNumbers.slice(0, 10);

    function testPacked(type) {
        const buf = new Pbf();
        buf[`writePacked${type}`](1, testNumbers2);
        buf.finish();
        buf.readFields((tag) => {
            const arr = [];
            buf[`readPacked${type}`](arr);
            if (tag === 1) assert.deepEqual(arr, testNumbers2, `packed ${type}`);
            else assert.fail(`wrong tag encountered: ${tag}`);
        });
    }

    function testUnpacked(type) {
        const buf = new Pbf();
        const arr = [];

        testNumbers2.forEach((n) => {
            buf[`write${type}Field`](1, n);
        });

        buf.finish();
        buf.readFields(() => {
            buf[`readPacked${type}`](arr);
        });

        assert.deepEqual(arr, testNumbers2, `packed ${type}`);
    }

    ['Varint', 'SVarint', 'Float', 'Double', 'Fixed32', 'SFixed32', 'Fixed64', 'SFixed64'].forEach((type) => {
        testPacked(type);
        testUnpacked(type);
    });

    const buf = new Pbf();
    buf.writePackedBoolean(1, testNumbers2);
    buf.finish();
    buf.readFields((tag) => {
        const arr = [];
        buf.readPackedBoolean(arr);
        if (tag === 1) assert.deepEqual(arr,
            [true, false, false, true, true, true, true, true, true, true], 'packed Boolean');
        else assert.fail(`wrong tag encountered: ${tag}`);
    });
});

test('writePacked skips empty arrays', () => {
    const pbf = new Pbf();
    pbf.writePackedBoolean(1, []);
    const buf = pbf.finish();
    assert.equal(buf.length, 0);
});

test('writeDouble', () => {
    const buf = new Pbf(Buffer.alloc(8));
    buf.writeDouble(12345.6789012345);
    buf.finish();
    assert.equal(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
});

test('readFloat', () => {
    const buffer = Buffer.alloc(4);
    buffer.writeFloatLE(123.456, 0);
    const buf = new Pbf(buffer);
    assert.equal(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
});

test('writeFloat', () => {
    const buf = new Pbf(Buffer.alloc(4));
    buf.writeFloat(123.456);
    buf.finish();
    assert.equal(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
});

test('readFixed32', () => {
    const buffer = Buffer.alloc(16);
    buffer.writeUInt32LE(42, 0);
    buffer.writeUInt32LE(24, 4);
    const buf = new Pbf(buffer);
    assert.equal(buf.readFixed32(), 42);
    assert.equal(buf.readFixed32(), 24);
});

test('writeFixed32', () => {
    const buf = new Pbf(Buffer.alloc(16));
    buf.writeFixed32(42);
    buf.writeFixed32(24);
    buf.finish();
    assert.equal(buf.readFixed32(), 42);
    assert.equal(buf.readFixed32(), 24);
});

test('readFixed64', () => {
    const buf = new Pbf(Buffer.alloc(8));
    buf.writeFixed64(102451124123);
    buf.finish();
    assert.deepEqual(buf.readFixed64(), 102451124123);
});

test('writeFixed64', () => {
    const buf = new Pbf(Buffer.alloc(8));
    buf.writeFixed64(102451124123);
    assert.deepEqual(toArray(buf.buf), [155, 23, 144, 218, 23, 0, 0, 0]);
});

test('readSFixed32', () => {
    const buffer = Buffer.alloc(16);
    buffer.writeInt32LE(4223, 0);
    buffer.writeInt32LE(-1231, 4);
    const buf = new Pbf(buffer);
    assert.equal(buf.readSFixed32(), 4223);
    assert.equal(buf.readSFixed32(), -1231);
});

test('writeSFixed32', () => {
    const buf = new Pbf(Buffer.alloc(16));
    buf.writeSFixed32(4223);
    buf.writeSFixed32(-1231);
    buf.finish();
    assert.equal(buf.readSFixed32(), 4223);
    assert.equal(buf.readSFixed32(), -1231);
});

test('readSFixed64', () => {
    const buf = new Pbf(Buffer.alloc(8));
    buf.writeSFixed64(-102451124123);
    buf.finish();
    assert.deepEqual(buf.readSFixed64(), -102451124123);
});

test('writeSFixed64', () => {
    const buf = new Pbf(Buffer.alloc(8));
    buf.writeSFixed64(-102451124123);
    assert.deepEqual(toArray(buf.buf), [101, 232, 111, 37, 232, 255, 255, 255]);
});

test('writeString & readString', () => {
    const buf = new Pbf();
    buf.writeString('Привет 李小龙');
    const bytes = buf.finish();
    assert.deepEqual(bytes, new Uint8Array([22, 208, 159, 209, 128, 208, 184, 208, 178, 208, 181, 209, 130, 32, 230, 157, 142, 229, 176, 143, 233, 190, 153]));
    assert.equal(buf.readString(), 'Привет 李小龙');
});

test('writeString & readString longer', () => {
    const str = '{"Feature":"http://example.com/vocab#Feature","datetime":{"@id":"http://www.w3.org/2006/time#inXSDDateTime","@type":"http://www.w3.org/2001/XMLSchema#dateTime"},"when":"http://example.com/vocab#when"}';
    const buf = new Pbf();
    buf.writeString(str);
    buf.finish();
    assert.equal(buf.readString(), str);
});

test('more complicated utf8', () => {
    const buf = new Pbf();
    // crazy test from github.com/mathiasbynens/utf8.js
    const str = '\uDC00\uDC00\uDC00\uDC00A\uDC00\uD834\uDF06\uDC00\uDEEE\uDFFF\uD800\uDC00\uD800\uD800\uD800\uD800A' +
        '\uD800\uD834\uDF06';
    buf.writeString(str);
    buf.finish();
    const str2 = buf.readString();
    assert.deepEqual(new Uint8Array(str2), new Uint8Array(str));
});

test('readFields', () => {
    const buf = new Pbf(fs.readFileSync(new URL('fixtures/12665.vector.pbf', import.meta.url)));
    const layerOffsets = [];
    const foo = {};
    let res, buf2;

    const res2 = buf.readFields((tag, result, buf) => {
        if (tag === 3) layerOffsets.push(buf.pos);
        res = result;
        buf2 = buf;
    }, foo);

    assert.equal(res, foo);
    assert.equal(res2, foo);
    assert.equal(buf2, buf);

    assert.ok(buf.pos >= buf.length);
    assert.deepEqual(layerOffsets, [1, 2490, 2581, 2819, 47298, 47626, 55732, 56022, 56456, 88178, 112554]);
});

test('readMessage', () => {
    const buf = new Pbf(fs.readFileSync(new URL('fixtures/12665.vector.pbf', import.meta.url))),
        layerNames = [],
        foo = {};

    buf.readFields((tag) => {
        if (tag === 3) buf.readMessage(readLayer, foo);
    }, foo);

    function readLayer(tag) {
        if (tag === 1) layerNames.push(buf.readString());
    }

    assert.deepEqual(layerNames, [
        'landuse', 'water', 'barrier_line', 'building', 'tunnel', 'road',
        'place_label', 'water_label', 'poi_label', 'road_label', 'housenum_label'
    ]);
});

test('field writing methods', () => {
    const buf = new Pbf();
    buf.writeFixed32Field(1, 100);
    buf.writeFixed64Field(2, 200);
    buf.writeVarintField(3, 1234);
    buf.writeSVarintField(4, -599);
    buf.writeStringField(5, 'Hello world');
    buf.writeFloatField(6, 123);
    buf.writeDoubleField(7, 123);
    buf.writeBooleanField(8, true);
    buf.writeBytesField(9, [1, 2, 3]);
    buf.writeMessage(10, () => {
        buf.writeBooleanField(1, true);
        buf.writePackedVarint(2, testNumbers);
    });

    buf.writeSFixed32Field(11, -123);
    buf.writeSFixed64Field(12, -256);

    buf.finish();

    buf.readFields((tag) => {
        if (tag === 1) buf.readFixed32();
        else if (tag === 2) buf.readFixed64();
        else if (tag === 3) buf.readVarint();
        else if (tag === 4) buf.readSVarint();
        else if (tag === 5) buf.readString();
        else if (tag === 6) buf.readFloat();
        else if (tag === 7) buf.readDouble();
        else if (tag === 8) buf.readBoolean();
        else if (tag === 9) buf.readBytes();
        else if (tag === 10) buf.readMessage(() => { /* skip */ });
        else if (tag === 11) buf.readSFixed32();
        else if (tag === 12) buf.readSFixed64();
        else assert.fail('unknown tag');
    });
});

test('skip', () => {
    const buf = new Pbf();
    buf.writeFixed32Field(1, 100);
    buf.writeFixed64Field(2, 200);
    buf.writeVarintField(3, 1234);
    buf.writeStringField(4, 'Hello world');
    buf.finish();

    buf.readFields(() => { /* skip */ });

    assert.equal(buf.pos, buf.length);

    assert.throws(() => {
        buf.skip(6);
    });
});

test('write a raw message > 0x10000000', () => {
    const buf = new Pbf();
    const marker = 0xdeadbeef;
    const encodedMarker = new Uint8Array([0xef, 0xbe, 0xad, 0xde]);
    const markerSize = encodedMarker.length;
    const rawMessageSize = 0x10000004;
    const encodedSize = new Uint8Array([0x84, 0x80, 0x80, 0x80, 0x01]);

    buf.writeRawMessage((_obj, pbf) => {
        // Repeatedly fill with the marker until it reaches the size target.
        const n = rawMessageSize / markerSize;
        for (let i = 0; i < n; i++) {
            pbf.writeFixed32(marker);
        }
    }, null);

    const bytes = buf.finish();
    assert.equal(bytes.length, rawMessageSize + encodedSize.length);

    // The encoded size in varint should go first
    assert.deepEqual(bytes.subarray(0, encodedSize.length), encodedSize);

    // Then the message itself. Verify that the first few bytes match the marker.
    assert.deepEqual(bytes.subarray(encodedSize.length, encodedSize.length + markerSize), encodedMarker);
});
