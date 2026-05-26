
import {PbfReader, PbfWriter} from '../index.js';
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
    assert.doesNotThrow(() => new PbfReader(Buffer.alloc(0)));
    assert.doesNotThrow(() => new PbfWriter());
});

test('realloc', () => {
    const buf = new PbfWriter();
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
    const writer = new PbfWriter();

    for (let i = 0; i < testNumbers.length; i++) {
        writer.writeVarint(testNumbers[i]);
        if (testNumbers[i]) writer.writeVarint(-testNumbers[i]);
    }
    const buf = writer.finish();
    assert.equal(buf.length, 839);

    const reader = new PbfReader(buf);
    let i = 0;
    while (reader.pos < buf.length) {
        assert.equal(reader.readVarint(), testNumbers[i]);
        if (testNumbers[i]) assert.equal(reader.readVarint(true), -testNumbers[i]);
        i++;
    }
});

test('writeVarint writes 0 for NaN', () => {
    const buf = Buffer.alloc(16);
    const writer = new PbfWriter(buf);

    // Initialize buffer to ensure consistent tests
    buf.write('0123456789abcdef', 0);

    writer.writeVarint('not a number');
    writer.writeVarint(NaN);
    writer.writeVarint(50);

    const reader = new PbfReader(writer.finish());
    assert.equal(reader.readVarint(), 0);
    assert.equal(reader.readVarint(), 0);
    assert.equal(reader.readVarint(), 50);
});

test('readVarint signed', () => {
    let bytes = [0xc8, 0xe8, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01];
    let buf = new PbfReader(Buffer.from(bytes));
    assert.equal(buf.readVarint(true), -3000);

    bytes = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01];
    buf = new PbfReader(Buffer.from(bytes));
    assert.equal(buf.readVarint(true), -1);

    bytes = [0xc8, 0x01];
    buf = new PbfReader(Buffer.from(bytes));
    assert.equal(buf.readVarint(true), 200);
});

test('readVarint & writeVarint handle really big numbers', () => {
    const writer = new PbfWriter();
    const bigNum1 = Math.pow(2, 60);
    const bigNum2 = Math.pow(2, 63);
    writer.writeVarint(bigNum1);
    writer.writeVarint(bigNum2);
    const reader = new PbfReader(writer.finish());
    assert.equal(reader.readVarint(), bigNum1);
    assert.equal(reader.readVarint(), bigNum2);
});

const testSigned = [0, 1, 2, 0, 2, -1, 11, 18, -17, 145, 369, 891, -1859, -798, 2780, -13107, 12589, -16433, 21140, 148023,
    221062, -985141, 494812, -2121059, -2078871, 82483, 19219191, 29094607, 35779553, -215357075, -334572816, -991453240,
    -1677041436, -3781260558, -6633052788, 1049995056, -22854591776, 37921771616, -136983944384, 187687841024, 107420097536,
    1069000079360, 1234936065024, -2861223108608, -492686688256, -6740322942976, -7061359607808, 24638679941120,
    19583051038720, 83969719009280, 52578722775040, 416482297118720, 1981092523409408, -389256637841408];

test('readSVarint & writeSVarint', () => {
    const writer = new PbfWriter();

    for (let i = 0; i < testSigned.length; i++) {
        writer.writeSVarint(testSigned[i]);
    }
    const buf = writer.finish();
    assert.equal(buf.length, 224);

    const reader = new PbfReader(buf);
    let i = 0;
    while (reader.pos < buf.length) {
        assert.equal(reader.readSVarint(), testSigned[i++]);
    }
});

test('writeVarint throws error on a number that is too big', () => {
    const buf = new PbfWriter();

    assert.throws(() => {
        buf.writeVarint(29234322996241367000012); // eslint-disable-line
    });

    assert.throws(() => {
        buf.writeVarint(-29234322996241367000012);  // eslint-disable-line
    });
});

test('readVarint throws error on a number that is longer than 10 bytes', () => {
    const buf = new PbfReader(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]));
    assert.throws(() => {
        buf.readVarint();
    });
});

test('readBoolean & writeBoolean', () => {
    const writer = new PbfWriter();
    writer.writeBoolean(true);
    writer.writeBoolean(false);
    const reader = new PbfReader(writer.finish());
    assert.equal(reader.readBoolean(), true);
    assert.equal(reader.readBoolean(), false);
});

test('readBytes', () => {
    const buf = new PbfReader(new Uint8Array([8, 1, 2, 3, 4, 5, 6, 7, 8]));
    assert.deepEqual(toArray(buf.readBytes()), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('writeBytes', () => {
    const writer = new PbfWriter();
    writer.writeBytes(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    const bytes = writer.finish();
    assert.deepEqual(toArray(bytes), [8, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('readDouble', () => {
    const buffer = Buffer.alloc(8);
    buffer.writeDoubleLE(12345.6789012345, 0);
    const buf = new PbfReader(buffer);
    assert.equal(Math.round(buf.readDouble() * 1e10) / 1e10, 12345.6789012345);
});

test('readPacked and writePacked', () => {
    const testNumbers2 = testNumbers.slice(0, 10);

    function testPacked(type) {
        const writer = new PbfWriter();
        writer[`writePacked${type}`](1, testNumbers2);
        const reader = new PbfReader(writer.finish());
        reader.readFields((tag) => {
            const arr = [];
            reader[`readPacked${type}`](arr);
            if (tag === 1) assert.deepEqual(arr, testNumbers2, `packed ${type}`);
            else assert.fail(`wrong tag encountered: ${tag}`);
        });
    }

    function testUnpacked(type) {
        const writer = new PbfWriter();
        const arr = [];

        testNumbers2.forEach((n) => {
            writer[`write${type}Field`](1, n);
        });

        const reader = new PbfReader(writer.finish());
        reader.readFields(() => {
            reader[`readPacked${type}`](arr);
        });

        assert.deepEqual(arr, testNumbers2, `packed ${type}`);
    }

    ['Varint', 'SVarint', 'Float', 'Double', 'Fixed32', 'SFixed32', 'Fixed64', 'SFixed64'].forEach((type) => {
        testPacked(type);
        testUnpacked(type);
    });

    const writer = new PbfWriter();
    writer.writePackedBoolean(1, testNumbers2);
    const reader = new PbfReader(writer.finish());
    reader.readFields((tag) => {
        const arr = [];
        reader.readPackedBoolean(arr);
        if (tag === 1) assert.deepEqual(arr,
            [true, false, false, true, true, true, true, true, true, true], 'packed Boolean');
        else assert.fail(`wrong tag encountered: ${tag}`);
    });
});

test('writePacked skips empty arrays', () => {
    const pbf = new PbfWriter();
    pbf.writePackedBoolean(1, []);
    const buf = pbf.finish();
    assert.equal(buf.length, 0);
});

test('writeDouble', () => {
    const writer = new PbfWriter(Buffer.alloc(8));
    writer.writeDouble(12345.6789012345);
    const reader = new PbfReader(writer.finish());
    assert.equal(Math.round(reader.readDouble() * 1e10) / 1e10, 12345.6789012345);
});

test('readFloat', () => {
    const buffer = Buffer.alloc(4);
    buffer.writeFloatLE(123.456, 0);
    const buf = new PbfReader(buffer);
    assert.equal(Math.round(1000 * buf.readFloat()) / 1000, 123.456);
});

test('writeFloat', () => {
    const writer = new PbfWriter(Buffer.alloc(4));
    writer.writeFloat(123.456);
    const reader = new PbfReader(writer.finish());
    assert.equal(Math.round(1000 * reader.readFloat()) / 1000, 123.456);
});

test('readFixed32', () => {
    const buffer = Buffer.alloc(16);
    buffer.writeUInt32LE(42, 0);
    buffer.writeUInt32LE(24, 4);
    const buf = new PbfReader(buffer);
    assert.equal(buf.readFixed32(), 42);
    assert.equal(buf.readFixed32(), 24);
});

test('writeFixed32', () => {
    const writer = new PbfWriter(Buffer.alloc(16));
    writer.writeFixed32(42);
    writer.writeFixed32(24);
    const reader = new PbfReader(writer.finish());
    assert.equal(reader.readFixed32(), 42);
    assert.equal(reader.readFixed32(), 24);
});

test('readFixed64', () => {
    const writer = new PbfWriter(Buffer.alloc(8));
    writer.writeFixed64(102451124123);
    const reader = new PbfReader(writer.finish());
    assert.deepEqual(reader.readFixed64(), 102451124123);
});

test('writeFixed64', () => {
    const buf = new PbfWriter(Buffer.alloc(8));
    buf.writeFixed64(102451124123);
    assert.deepEqual(toArray(buf.buf), [155, 23, 144, 218, 23, 0, 0, 0]);
});

test('readSFixed32', () => {
    const buffer = Buffer.alloc(16);
    buffer.writeInt32LE(4223, 0);
    buffer.writeInt32LE(-1231, 4);
    const buf = new PbfReader(buffer);
    assert.equal(buf.readSFixed32(), 4223);
    assert.equal(buf.readSFixed32(), -1231);
});

test('writeSFixed32', () => {
    const writer = new PbfWriter(Buffer.alloc(16));
    writer.writeSFixed32(4223);
    writer.writeSFixed32(-1231);
    const reader = new PbfReader(writer.finish());
    assert.equal(reader.readSFixed32(), 4223);
    assert.equal(reader.readSFixed32(), -1231);
});

test('readSFixed64', () => {
    const writer = new PbfWriter(Buffer.alloc(8));
    writer.writeSFixed64(-102451124123);
    const reader = new PbfReader(writer.finish());
    assert.deepEqual(reader.readSFixed64(), -102451124123);
});

test('writeSFixed64', () => {
    const buf = new PbfWriter(Buffer.alloc(8));
    buf.writeSFixed64(-102451124123);
    assert.deepEqual(toArray(buf.buf), [101, 232, 111, 37, 232, 255, 255, 255]);
});

test('writeString & readString', () => {
    const writer = new PbfWriter();
    writer.writeString('Привет 李小龙');
    const bytes = writer.finish();
    assert.deepEqual(bytes, new Uint8Array([22, 208, 159, 209, 128, 208, 184, 208, 178, 208, 181, 209, 130, 32, 230, 157, 142, 229, 176, 143, 233, 190, 153]));
    assert.equal(new PbfReader(bytes).readString(), 'Привет 李小龙');
});

test('writeString & readString longer', () => {
    const str = '{"Feature":"http://example.com/vocab#Feature","datetime":{"@id":"http://www.w3.org/2006/time#inXSDDateTime","@type":"http://www.w3.org/2001/XMLSchema#dateTime"},"when":"http://example.com/vocab#when"}';
    const writer = new PbfWriter();
    writer.writeString(str);
    assert.equal(new PbfReader(writer.finish()).readString(), str);
});

test('more complicated utf8', () => {
    const writer = new PbfWriter();
    // crazy test from github.com/mathiasbynens/utf8.js
    const str = '\uDC00\uDC00\uDC00\uDC00A\uDC00𝌆\uDC00\uDEEE\uDFFF𐀀\uD800\uD800\uD800\uD800A' +
        '\uD800𝌆';
    writer.writeString(str);
    const str2 = new PbfReader(writer.finish()).readString();
    assert.deepEqual(new Uint8Array(str2), new Uint8Array(str));
});

test('readFields', () => {
    const buf = new PbfReader(fs.readFileSync(new URL('fixtures/12665.vector.pbf', import.meta.url)));
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
    const buf = new PbfReader(fs.readFileSync(new URL('fixtures/12665.vector.pbf', import.meta.url))),
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
    const writer = new PbfWriter();
    writer.writeFixed32Field(1, 100);
    writer.writeFixed64Field(2, 200);
    writer.writeVarintField(3, 1234);
    writer.writeSVarintField(4, -599);
    writer.writeStringField(5, 'Hello world');
    writer.writeFloatField(6, 123);
    writer.writeDoubleField(7, 123);
    writer.writeBooleanField(8, true);
    writer.writeBytesField(9, new Uint8Array([1, 2, 3]));
    writer.writeMessage(10, () => {
        writer.writeBooleanField(1, true);
        writer.writePackedVarint(2, testNumbers);
    });

    writer.writeSFixed32Field(11, -123);
    writer.writeSFixed64Field(12, -256);

    const reader = new PbfReader(writer.finish());

    reader.readFields((tag) => {
        if (tag === 1) reader.readFixed32();
        else if (tag === 2) reader.readFixed64();
        else if (tag === 3) reader.readVarint();
        else if (tag === 4) reader.readSVarint();
        else if (tag === 5) reader.readString();
        else if (tag === 6) reader.readFloat();
        else if (tag === 7) reader.readDouble();
        else if (tag === 8) reader.readBoolean();
        else if (tag === 9) reader.readBytes();
        else if (tag === 10) reader.readMessage(() => { /* skip */ });
        else if (tag === 11) reader.readSFixed32();
        else if (tag === 12) reader.readSFixed64();
        else assert.fail('unknown tag');
    });
});

test('skip', () => {
    const writer = new PbfWriter();
    writer.writeFixed32Field(1, 100);
    writer.writeFixed64Field(2, 200);
    writer.writeVarintField(3, 1234);
    writer.writeStringField(4, 'Hello world');

    const reader = new PbfReader(writer.finish());
    reader.readFields(() => { /* skip */ });

    assert.equal(reader.pos, reader.length);

    assert.throws(() => {
        reader.skip(6);
    });
});

test('write a raw message > 0x10000000', () => {
    const buf = new PbfWriter();
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

test('nextField implicitly skips unread fields', () => {
    // Encode three fields: varint #1 = 42, string #2 = "hi", varint #3 = 7.
    const w = new PbfWriter();
    w.writeVarintField(1, 42);
    w.writeStringField(2, 'hi');
    w.writeVarintField(3, 7);
    const buf = w.finish();

    // Reader that only knows field 1 and field 3 — field 2 is skipped implicitly.
    const pbf = new PbfReader(buf);
    const seen = {};
    let field;
    while ((field = pbf.nextField())) {
        if (field === 1) seen.a = pbf.readVarint();
        else if (field === 3) seen.b = pbf.readVarint();
    }
    assert.deepEqual(seen, {a: 42, b: 7});
    assert.equal(pbf.pos, buf.length);

    // nextField returns 0 at end-of-message.
    assert.equal(pbf.nextField(), 0);
});

test('nextField sets pbf.type for packed reads', () => {
    // A packed varint field encodes as wire-type 2 (BYTES). readPackedVarint relies on
    // pbf.type to distinguish packed vs unpacked encodings; nextField must set it.
    const w = new PbfWriter();
    w.writePackedVarint(1, [1, 2, 3]);
    const buf = w.finish();

    const pbf = new PbfReader(buf);
    const field = pbf.nextField();
    assert.equal(field, 1);
    assert.equal(pbf.type, 2); // PBF_BYTES
    assert.deepEqual(pbf.readPackedVarint(), [1, 2, 3]);
});
