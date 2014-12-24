'use strict';

// lightweight Buffer shim for pbf browser build
// based on code from https://github.com/feross/buffer (MIT-licensed)

module.exports = Buffer;

var ieee754 = require('ieee754');

var bufferMethods = {
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

    readUInt64LE: function(pos) {
        return ((buf[pos]) |
            (buf[pos + 1] << 8) |
            (buf[pos + 2] << 16)) +
            (buf[pos + 3] * 0x1000000) +
            (buf[pos + 4] * 0x100000000) +
            (buf[pos + 5] * 0x10000000000) +
            (buf[pos + 6] * 0x1000000000000) +
            (buf[pos + 7] * 0x100000000000000);
    },

    writeUInt64LE: function(val, pos) {
        this[pos] = val;
        this[pos + 1] = (val >>> 8);
        this[pos + 2] = (val >>> 16);
        this[pos + 3] = (val >>> 24);
        this[pos + 4] = (val / 0x100000000) >>> 0 & 0xFF;
        this[pos + 5] = (val / 0x10000000000) >>> 0 & 0xFF;
        this[pos + 6] = (val / 0x1000000000000) >>> 0 & 0xFF;
        this[pos + 7] = (val / 0x100000000000000) >>> 0 & 0xFF;
    },

    readFloatLE: function(pos) {
        return ieee754.read(this, pos, true, 23, 4);
    },

    readDoubleLE: function(pos) {
        return ieee754.read(this, pos, true, 52, 8);
    },

    writeFloatLE: function(val, pos) {
        return ieee754.read(this, val, pos, true, 23, 4);
    },

    writeDoubleLE: function(val, pos) {
        return ieee754.read(this, val, pos, true, 52, 8);
    },

    write: function(str, pos) {
        var bytes = utf8ToBytes(str);
        for (var i = 0; i < bytes.length; i++) {
            this[pos + i] = bytes[i];
        }
    },

    toString: function(encoding, start, end) {
        if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf8').decode(this.subarray(start, end));

        var str = '',
            tmp = '';

        end = Math.min(this.length, end)

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

    slice: function(start, end) {
        return extend(Uint8Array.prototype.subarray.call(this, start, end), bufferMethods);
    }
};

function Buffer(length) {
    Uint8Array.call(this, length);
}

Buffer._augment = function(arr) {
    return extend(arr, bufferMethods);
};

Buffer.prototype = Object.create(Uint8Array);
extend(Buffer.prototype, bufferMethods);

function extend(src, dst) {
    for (var i in src) {
        dst[i] = src[i];
    }
    return dst;
}

function utf8ToBytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder('utf8').encode();

    var length = str.length,
        bytes = [],
        codePoint, lead;

    for (var i = 0; i < length; i++) {
        codePoint = str.charCodeAt(i);

        if (codePoint > 0xD7FF && codePoint < 0xE000) {

            if (lead) {
                if (codePoint < 0xDC00) {
                    bytes.push(0xEF, 0xBF, 0xBD);
                    lead = codePoint;
                    continue;

                } else {
                  codePoint = lead - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000;
                  lead = null;
                }

            } else {
                if (codePoint > 0xDBFF) {
                    bytes.push(0xEF, 0xBF, 0xBD);
                    continue;

                } else if (i + 1 === length) {
                    bytes.push(0xEF, 0xBF, 0xBD);
                    continue;

                } else {
                    lead = codePoint;
                    continue;
                }
            }

        } else if (lead) {
            bytes.push(0xEF, 0xBF, 0xBD);
            lead = null;
        }

        if (codePoint < 0x80) {
            bytes.push(codePoint);

        } else if (codePoint < 0x800) {
            bytes.push(
                codePoint >> 0x6 | 0xC0,
                codePoint & 0x3F | 0x80
            );

        } else if (codePoint < 0x10000) {
            bytes.push(
                codePoint >> 0xC | 0xE0,
                codePoint >> 0x6 & 0x3F | 0x80,
                codePoint & 0x3F | 0x80
            );

        } else if (codePoint < 0x200000) {
            bytes.push(
                codePoint >> 0x12 | 0xF0,
                codePoint >> 0xC & 0x3F | 0x80,
                codePoint >> 0x6 & 0x3F | 0x80,
                codePoint & 0x3F | 0x80
            );

        } else {
            throw new Error('Invalid code point');
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
