'use strict';

// lightweight Buffer shim for pbf browser build
// based on code from github.com/feross/buffer (MIT-licensed)

module.exports = Buffer;

var ieee754 = require('ieee754');

function Buffer(length) {
    this.arr = new Uint8Array(length);
    this.length = length;
}

Buffer.prototype = {
    readUInt32LE: function(pos) {
        var arr = this.arr;
        return ((arr[pos]) |
            (arr[pos + 1] << 8) |
            (arr[pos + 2] << 16)) +
            (arr[pos + 3] * 0x1000000);
    },

    writeUInt32LE: function(val, pos) {
        var arr = this.arr;
        arr[pos] = val;
        arr[pos + 1] = (val >>> 8);
        arr[pos + 2] = (val >>> 16);
        arr[pos + 3] = (val >>> 24);
    },

    readInt32LE: function(pos) {
        var arr = this.arr;
        return ((arr[pos]) |
            (arr[pos + 1] << 8) |
            (arr[pos + 2] << 16)) +
            (arr[pos + 3] << 24);
    },

    readFloatLE:   function(pos) { return ieee754.read(this.arr, pos, true, 23, 4); },
    readDoubleLE:  function(pos) { return ieee754.read(this.arr, pos, true, 52, 8); },

    writeFloatLE:  function(val, pos) { return ieee754.write(this.arr, val, pos, true, 23, 4); },
    writeDoubleLE: function(val, pos) { return ieee754.write(this.arr, val, pos, true, 52, 8); },

    toString: function(encoding, start, end) {
        if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf8').decode(this.arr.subarray(start, end));

        var str = '',
            tmp = '';

        start = start || 0;
        end = Math.min(this.length, end || this.length);

        for (var i = start; i < end; i++) {
            var ch = this.arr[i];
            if (ch <= 0x7F) {
                str += decodeUtf8Str(tmp) + String.fromCharCode(ch)
                tmp = '';
            } else {
                tmp += '%' + ch.toString(16)
            }
        }

        return str + decodeUtf8Str(tmp);
    },

    write: function(str, pos) {
        var bytes = Buffer._lastStr === str ? Buffer._lastEncoded : encodeString(str);
        for (var i = 0; i < bytes.length; i++) {
            this.arr[pos + i] = bytes[i];
        }
    },

    slice: function(start, end) {
        return this.arr.subarray(start, end);
    },

    copy: function(buf, pos) {
        pos = pos || 0;
        for (var i = 0; i < this.length; i++) {
            buf.arr[pos + i] = this.arr[i];
        }
    }
};

Buffer.prototype.writeInt32LE = Buffer.prototype.writeUInt32LE;

Buffer.wrap = function(arr) {
    var buf = Object.create(Buffer.prototype);
    buf.arr = arr;
    buf.length = arr.length;
    return buf;
};

Buffer.byteLength = function(str) {
    Buffer._lastStr = str;
    var bytes = Buffer._lastEncoded = encodeString(str);
    return bytes.length;
};

function encodeString(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder('utf8').encode();

    var length = str.length,
        bytes = [];

    for (var i = 0, c, lead; i < length; i++) {
        c = str.charCodeAt(i); // code point

        if (c > 0xD7FF && c < 0xE000) {

            if (lead) {
                if (c < 0xDC00) {
                    bytes.push(0xEF, 0xBF, 0xBD);
                    lead = c;
                    continue;

                } else {
                  c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
                  lead = null;
                }

            } else {
                if (c > 0xDBFF || (i + 1 === length)) bytes.push(0xEF, 0xBF, 0xBD);
                else lead = c;

                continue;
            }

        } else if (lead) {
            bytes.push(0xEF, 0xBF, 0xBD);
            lead = null;
        }

        if (c < 0x80) {
            bytes.push(c);

        } else {
            if (c < 0x800) bytes.push(c >> 0x6 | 0xC0);
            else if (c < 0x10000) bytes.push(c >> 0xC | 0xE0, c >> 0x6 & 0x3F | 0x80);
            else bytes.push(c >> 0x12 | 0xF0, c >> 0xC & 0x3F | 0x80, c >> 0x6 & 0x3F | 0x80);

            bytes.push(c & 0x3F | 0x80);
        }
    }
    return bytes;
}

function decodeUtf8Str(str) {
    try {
        return decodeURIComponent(str);
    } catch (err) {
        return String.fromCharCode(0xFFFD); // UTF 8 invalid char
    }
}
