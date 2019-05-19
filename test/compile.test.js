import fs from 'fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {sync as resolve} from 'resolve-protobuf-schema';

import Pbf from '../index.js';
import {compile, compileRaw} from '../compile.js';

test('compiles all proto files to proper js', () => {
    const files = fs.readdirSync(new URL('fixtures', import.meta.url));

    for (const path of files) {
        if (!path.endsWith('.proto')) continue;
        const proto = resolve(new URL(`fixtures/${path}`, import.meta.url));
        const js = compileRaw(proto, {dev: true});

        // uncomment to update the fixtures
        // fs.writeFileSync(new URL(`fixtures/${path}`.replace('.proto', '.js'), import.meta.url), js);

        const expectedJS = fs.readFileSync(new URL(`fixtures/${path}`.replace('.proto', '.js'), import.meta.url), 'utf8');
        assert.equal(js, expectedJS);
    }
});

test('compiles vector tile proto', () => {
    const proto = resolve(new URL('fixtures/vector_tile.proto', import.meta.url));
    const tileBuf = fs.readFileSync(new URL('fixtures/12665.vector.pbf', import.meta.url));
    const {readTile, writeTile} = compile(proto);

    const tile = readTile(new Pbf(tileBuf));
    assert.equal(tile.layers.length, 11);

    const pbf = new Pbf();
    writeTile(tile, pbf);
    const buf = pbf.finish();
    assert.equal(buf.length, 124946);
});

test('compiles proto with embedded type reference', () => {
    const proto = resolve(new URL('fixtures/embedded_type.proto', import.meta.url));
    compile(proto);
});

test('compiles packed proto', () => {
    const proto = resolve(new URL('fixtures/packed.proto', import.meta.url));
    const {writeNotPacked, readFalsePacked} = compile(proto);

    const original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    const pbf = new Pbf();
    writeNotPacked(original, pbf);
    const buf = pbf.finish();

    const decompressed = readFalsePacked(new Pbf(buf));
    assert.equal(buf.length, 17);
    assert.deepEqual(original, decompressed);
});

test('reads packed with unpacked field', () => {
    const proto = resolve(new URL('fixtures/packed.proto', import.meta.url));
    const {writePacked, readFalsePacked} = compile(proto);

    const original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    const pbf = new Pbf();
    writePacked(original, pbf);
    const buf = pbf.finish();

    const decompressed = readFalsePacked(new Pbf(buf));
    assert.equal(buf.length, 14);
    assert.deepEqual(original, decompressed);
});

test('compiles packed proto3', () => {
    const proto = resolve(new URL('fixtures/packed_proto3.proto', import.meta.url));
    const {readNotPacked, writeNotPacked, writeFalsePacked} = compile(proto);

    const original = {
        types: [0, 1, 0, 1],
        value: [300, 400, 500]
    };
    let pbf = new Pbf();
    writeFalsePacked(original, pbf);
    const falsePackedBuf = pbf.finish();

    pbf = new Pbf();
    writeNotPacked(original, pbf);
    const notPackedBuf = pbf.finish();

    const decompressed = readNotPacked(new Pbf(falsePackedBuf));
    assert.deepEqual(original, decompressed);
    assert.equal(notPackedBuf.length, 14);
    assert.ok(falsePackedBuf.length > notPackedBuf.length, 'Did not respect [packed=false]');
});

test('compiles packed with multi-byte tags', () => {
    const proto = resolve(new URL('fixtures/packed_proto3.proto', import.meta.url));
    const {readPacked, writePacked} = compile(proto);

    const original = {
        value: [300, 400, 500]
    };
    const pbf = new Pbf();
    writePacked(original, pbf);
    const buf = pbf.finish();

    const decompressed = readPacked(new Pbf(buf));
    assert.equal(buf.length, 9);
    assert.deepEqual(original, decompressed);
});

test('compiles defaults', () => {
    const proto = resolve(new URL('fixtures/defaults.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);
    const pbf = new Pbf();

    writeEnvelope({}, pbf);

    const buf = pbf.finish();
    const data = readEnvelope(new Pbf(buf));

    assert.equal(buf.length, 0);
    assert.deepEqual(data, {
        type: 1,
        name: 'test',
        flag: true,
        weight: 1.5,
        id: 1
    });
});

test('compiles proto3 ignoring defaults', () => {
    const proto = resolve(new URL('fixtures/defaults_proto3.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);
    const pbf = new Pbf();

    writeEnvelope({}, pbf);

    const buf = pbf.finish();
    const data = readEnvelope(new Pbf(buf));

    assert.equal(buf.length, 0);

    assert.equal(data.type, 0);
    assert.equal(data.name, '');
    assert.equal(data.flag, false);
    assert.equal(data.weight, 0);
    assert.equal(data.id, 0);
});

test('compiles maps', () => {
    const proto = resolve(new URL('fixtures/map.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);

    const original = {
        kv: {
            a: 'value a',
            b: 'value b'
        },
        kn: {
            a: 1,
            b: 2
        }
    };

    const pbf = new Pbf();
    writeEnvelope(original, pbf);
    const buf = pbf.finish();

    const decompressed = readEnvelope(new Pbf(buf));

    assert.deepEqual(original, decompressed);
});

test('does not write undefined or null values', () => {
    const proto = resolve(new URL('fixtures/embedded_type.proto', import.meta.url));
    const {writeEmbeddedType} = compile(proto);
    const pbf = new Pbf();

    writeEmbeddedType({}, pbf);

    writeEmbeddedType({
        'sub_field': null
    }, pbf);

    writeEmbeddedType({
        value: null
    });
});

test('handles all implicit default values', () => {
    const proto = resolve(new URL('fixtures/defaults_implicit.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);
    const pbf = new Pbf();

    writeEnvelope({}, pbf);
    const buf = pbf.finish();
    const data = readEnvelope(new Pbf(buf));

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

test('sets oneof field name', () => {
    const proto = resolve(new URL('fixtures/oneof.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);
    let pbf = new Pbf();

    writeEnvelope({}, pbf);
    let data = readEnvelope(new Pbf(pbf.finish()));

    assert.equal(data.value, undefined);
    assert.equal(data.id, 0);

    pbf = new Pbf();
    writeEnvelope({
        float: 1.5
    }, pbf);
    data = readEnvelope(new Pbf(pbf.finish()));

    assert.equal(data.value, 'float');
    assert.equal(data[data.value], 1.5);

    pbf = new Pbf();
    writeEnvelope({
        float: 0
    }, pbf);
    data = readEnvelope(new Pbf(pbf.finish()));

    assert.equal(data.value, 'float');
    assert.equal(data[data.value], 0);
});

test('handles jstype=JS_STRING', () => {
    const proto = resolve(new URL('fixtures/type_string.proto', import.meta.url));
    const {readTypeString, writeTypeString, readTypeNotString} = compile(proto);
    const pbf = new Pbf();

    writeTypeString({
        int: '-5',
        long: '10000',
        boolVal: true,
        float: '12',
    }, pbf);

    const buf = pbf.finish();
    let data = readTypeString(new Pbf(buf));

    assert.equal(data.int, '-5');
    assert.equal(data.long, '10000');
    assert.equal(data.boolVal, true);
    assert.equal(data.float, '12');
    assert.equal(data.default_implicit, '0');
    assert.equal(data.default_explicit, '42');

    data = readTypeNotString(new Pbf(buf));
    assert.equal(data.int, -5);
    assert.equal(data.long, 10000);
    assert.equal(data.boolVal, true);
    assert.equal(data.float, 12);
});

test('handles negative varint', () => {
    const proto = resolve(new URL('fixtures/varint.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);
    const pbf = new Pbf();

    writeEnvelope({
        int: -5,
        long: -10
    }, pbf);

    const buf = pbf.finish();
    const data = readEnvelope(new Pbf(buf));

    assert.equal(data.int, -5);
    assert.equal(data.long, -10);
});

test('handles unsigned varint', () => {
    const proto = resolve(new URL('fixtures/varint.proto', import.meta.url));
    const {readEnvelope, writeEnvelope} = compile(proto);
    const pbf = new Pbf();

    writeEnvelope({
        uint: Math.pow(2, 31),
        ulong: Math.pow(2, 63)
    }, pbf);

    const buf = pbf.finish();
    const data = readEnvelope(new Pbf(buf));

    assert.equal(data.uint, Math.pow(2, 31));
    assert.equal(data.ulong, Math.pow(2, 63));
});
