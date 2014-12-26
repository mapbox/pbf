'use strict';

// lightweight Buffer shim for pbf browser build
// based on code from github.com/feross/buffer (MIT-licensed)

module.exports = Buffer;

var ieee754 = require('ieee754');

function Buffer(length) {
    var buf = new Uint8Array(length);
    for (var i in BufferMethods) {
        buf[i] = BufferMethods[i];
    }
    return buf;
}

var BufferMethods = {
    readUInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] * 0x1000000);
    },

    writeUInt32LE: function(val, pos) {
        this[pos] = val;
        this[pos + 1] = (val >>> 8);
        this[pos + 2] = (val >>> 16);
        this[pos + 3] = (val >>> 24);
    },

    readInt32LE: function(pos) {
        return ((this[pos]) |
            (this[pos + 1] << 8) |
            (this[pos + 2] << 16)) +
            (this[pos + 3] << 24);
    },

    readFloatLE:   function(pos) { return ieee754.read(this, pos, true, 23, 4); },
    readDoubleLE:  function(pos) { return ieee754.read(this, pos, true, 52, 8); },

    writeFloatLE:  function(val, pos) { return ieee754.write(this, val, pos, true, 23, 4); },
    writeDoubleLE: function(val, pos) { return ieee754.write(this, val, pos, true, 52, 8); },

    toString: function(encoding, start, end) {
        if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf8').decode(this.subarray(start, end));

        var str = '',
            tmp = '';

        start = start || 0;
        end = Math.min(this.length, end || this.length);

        for (var i = start; i < end; i++) {
            var ch = this[i];
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
            this[pos + i] = bytes[i];
        }
    },

    slice: function(start, end) {
        return this.subarray(start, end);
    },

    copy: function(buf, pos) {
        pos = pos || 0;
        for (var i = 0; i < this.length; i++) {
            buf[pos + i] = this[i];
        }
    }
};

BufferMethods.writeInt32LE = BufferMethods.writeUInt32LE;

Buffer.wrap = function(arr) {
    var buf = Buffer(arr.length);
    buf.set(arr);
    return buf;
};

Buffer.byteLength = function(str) {
    Buffer._lastStr = str;
    var bytes = Buffer._lastEncoded = encodeString(str);
    return bytes.length;
};

function encodeString(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder('utf8').encode(str);

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
