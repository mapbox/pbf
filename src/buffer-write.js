'use strict';

var Buffer = require('./buffer'),
    ieee754 = require('ieee754');

Buffer.byteLength = function(str) {
    Buffer._lastStr = str;
    var bytes = Buffer._lastEncoded = encodeString(str);
    return bytes.length;
};

var Methods = {

    writeUInt32LE: function(val, pos) {
        this[pos] = val;
        this[pos + 1] = (val >>> 8);
        this[pos + 2] = (val >>> 16);
        this[pos + 3] = (val >>> 24);
    },

    writeFloatLE:  function(val, pos) { return ieee754.write(this, val, pos, true, 23, 4); },
    writeDoubleLE: function(val, pos) { return ieee754.write(this, val, pos, true, 52, 8); },

    write: function(str, pos) {
        var bytes = Buffer._lastStr === str ? Buffer._lastEncoded : encodeString(str);
        for (var i = 0; i < bytes.length; i++) {
            this[pos + i] = bytes[i];
        }
    },

    copy: function(buf, pos) {
        pos = pos || 0;
        for (var i = 0; i < this.length; i++) {
            buf[pos + i] = this[i];
        }
    }
};

Methods.writeInt32LE = Methods.writeUInt32LE;

for (var i in Methods) {
    Buffer.Methods[i] = Methods[i];
}

function encodeString(str) {
    if (global.TextEncoder) return new global.TextEncoder('utf8').encode(str);

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
