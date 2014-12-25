var BufferShim = require('../buffer'),
    test = require('tape');

function toArray(buf) {
    var arr = [];
    for (var i = 0; i < buf.length; i++) {
        arr.push(buf[i]);
    }
    return arr;
}

test('writeUInt32LE', function (t) {
    var shim = new BufferShim(8);
    shim.writeUInt32LE(12562, 0);
    shim.writeUInt32LE(555, 4);

    t.same(toArray(shim.arr), [18,49,0,0,43,2,0,0]);
    t.end();
});

test('readUInt32LE', function (t) {
    var shim = new BufferShim(8);
    shim.writeUInt32LE(12562, 0);
    shim.writeUInt32LE(555, 4);

    t.same([shim.readUInt32LE(0), shim.readUInt32LE(4)], [12562, 555]);
    t.end();
});

var testStr = 'Привет ∞',
    testBytes = [208,159,209,128,208,184,208,178,208,181,209,130,32,226,136,158];

test('write', function (t) {
    var shim = new BufferShim(16);
    shim.write(testStr, 0);

    t.same(toArray(shim.arr), testBytes);
    t.end();
});

test('toString', function (t) {
    var shim = new BufferShim(16);
    shim.write(testStr, 0);

    t.same(shim.toString(), testStr);
    t.end();
});

test('wrap', function (t) {
    var arr = new Uint8Array(testBytes);
    var shim = BufferShim.wrap(arr);

    t.same(shim.toString(), testStr);
    t.end();
});

test('byteLength', function (t) {
    t.same(BufferShim.byteLength(testStr), 16);
    t.end();
});

test('copy', function (t) {
    var shim = BufferShim.wrap(new Uint8Array(testBytes));
    var shim2 = new BufferShim(16);

    shim.copy(shim2);

    t.same(toArray(shim.arr), toArray(shim2.arr));
    t.end();
});
