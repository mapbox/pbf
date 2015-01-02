'use strict';

// lightweight Buffer shim for pbf browser build
// based on code from github.com/feross/buffer (MIT-licensed)

module.exports = Buffer;

var ieee754 = require('ieee754');

function Buffer(length) {
    var arr;
    if (length && length.length) {
        arr = length;
        length = arr.length;
    }
    var buf = new Uint8Array(length || 0);
    if (arr) buf.set(arr);

    for (var i in Buffer.Methods) {
        buf[i] = Buffer.Methods[i];
    }
    buf._isBuffer = true;
    return buf;
}

Buffer.Methods = {
    readUInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] * 0x1000000);
    },

    readInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] << 24);
    },

    readFloatLE:  function(pos) { return ieee754.read(this, pos, true, 23, 4); },
    readDoubleLE: function(pos) { return ieee754.read(this, pos, true, 52, 8); },

    toString: function(encoding, start, end) {
        if (global.TextDecoder) return new global.TextDecoder('utf8').decode(this.subarray(start, end));

        var str = '',
            tmp = '';

        start = start || 0;
        end = Math.min(this.length, end || this.length);

        for (var i = start; i < end; i++) {
            var ch = this[i];
            if (ch <= 0x7F) {
                str += decodeUtf8Str(tmp) + String.fromCharCode(ch);
                tmp = '';
            } else {
                tmp += '%' + ch.toString(16);
            }
        }

        return str + decodeUtf8Str(tmp);
    },

    slice: function(start, end) {
        return this.subarray(start, end);
    }
};

Buffer.isBuffer = function(buf) {
    return !!(buf && buf._isBuffer);
};

function decodeUtf8Str(str) {
    try {
        return decodeURIComponent(str);
    } catch (err) {
        return String.fromCharCode(0xFFFD); // UTF 8 invalid char
    }
}
