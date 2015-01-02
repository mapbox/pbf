
var Pbf = require('./pbf'),
    Buffer = global.Buffer || require('./buffer-write');

var SHIFT_RIGHT_32 = 1 / ((1 << 16) * (1 << 16));

var Methods = {
    writeTag: function(tag, type) {
        this.writeVarint((tag << 3) | type);
    },

    realloc: function(min) {
        var length = this.length || 1;

        while (length < this.pos + min) length *= 2;

        if (length != this.length) {
            var buf = new Buffer(length);
            this.buf.copy(buf);
            this.buf = buf;
            this.length = length;
        }
    },

    finish: function() {
        this.length = this.pos;
        this.pos = 0;
        return this.buf.slice(0, this.length);
    },

    writePacked: function(tag, type, items) {
        if (!items.length) return;

        var message = new Pbf(),
            len = items.length,
            i = 0;

        if (type === 'Varint')        for (; i < len; i++) message.writeVarint(items[i]);
        else if (type === 'SVarint')  for (; i < len; i++) message.writeSVarint(items[i]);
        else if (type === 'Float')    for (; i < len; i++) message.writeFloat(items[i]);
        else if (type === 'Double')   for (; i < len; i++) message.writeDouble(items[i]);
        else if (type === 'Fixed32')  for (; i < len; i++) message.writeFixed32(items[i]);
        else if (type === 'SFixed32') for (; i < len; i++) message.writeSFixed32(items[i]);
        else if (type === 'Fixed64')  for (; i < len; i++) message.writeFixed64(items[i]);
        else if (type === 'SFixed64') for (; i < len; i++) message.writeSFixed64(items[i]);

        this.writeMessage(tag, message);
    },

    writeFixed32: function(val) {
        this.realloc(4);
        this.buf.writeUInt32LE(val, this.pos);
        this.pos += 4;
    },

    writeSFixed32: function(val) {
        this.realloc(4);
        this.buf.writeInt32LE(val, this.pos);
        this.pos += 4;
    },

    writeFixed64: function(val) {
        this.realloc(8);
        this.buf.writeInt32LE(val & -1, this.pos);
        this.buf.writeUInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeSFixed64: function(val) {
        this.realloc(8);
        this.buf.writeInt32LE(val & -1, this.pos);
        this.buf.writeInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
        this.pos += 8;
    },

    writeVarint: function(val) {
        val = +val;

        if (val <= 0x7f) {
            this.realloc(1);
            this.buf[this.pos++] = val;
        } else if (val <= 0x3fff) {
            this.realloc(2);
            this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
            this.buf[this.pos++] = 0x00 | ((val >>> 7) & 0x7f);
        } else if (val <= 0x1fffff) {
            this.realloc(3);
            this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
            this.buf[this.pos++] = 0x80 | ((val >>> 7) & 0x7f);
            this.buf[this.pos++] = 0x00 | ((val >>> 14) & 0x7f);
        } else if (val <= 0xfffffff) {
            this.realloc(4);
            this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
            this.buf[this.pos++] = 0x80 | ((val >>> 7) & 0x7f);
            this.buf[this.pos++] = 0x80 | ((val >>> 14) & 0x7f);
            this.buf[this.pos++] = 0x00 | ((val >>> 21) & 0x7f);
        } else {
            var pos = this.pos;
            while (val >= 0x80) {
                this.realloc(1);
                this.buf[this.pos++] = (val & 0xff) | 0x80;
                val /= 0x80;
            }
            this.realloc(1);
            this.buf[this.pos++] = val | 0;
            if (this.pos - pos > 10) throw new Error("Given varint doesn't fit into 10 bytes");
        }
    },

    writeSVarint: function(val) {
        this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
    },

    writeBoolean: function(val) {
        this.writeVarint(Boolean(val));
    },

    writeString: function(str) {
        str = String(str);
        var bytes = Buffer.byteLength(str);
        this.writeVarint(bytes);
        this.realloc(bytes);
        this.buf.write(str, this.pos);
        this.pos += bytes;
    },

    writeFloat: function(val) {
        this.realloc(4);
        this.buf.writeFloatLE(val, this.pos);
        this.pos += 4;
    },

    writeDouble: function(val) {
        this.realloc(8);
        this.buf.writeDoubleLE(val, this.pos);
        this.pos += 8;
    },

    writeBytes: function(buffer) {
        var len = buffer.length;
        this.writeVarint(len);
        this.realloc(len);
        for (var i = 0; i < len; i++) {
            this.buf[this.pos + i] = buffer[i];
        }
        this.pos += len;
    },

    writeMessage: function(tag, protobuf) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeBytes(protobuf.finish());
    },

    writeBytesField: function(tag, buffer) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeBytes(buffer);
    },

    writeFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFixed32(val);
    },

    writeSFixed32Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeSFixed32(val);
    },

    writeFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeFixed64(val);
    },

    writeSFixed64Field: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeSFixed64(val);
    },

    writeVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeVarint(val);
    },

    writeSVarintField: function(tag, val) {
        this.writeTag(tag, Pbf.Varint);
        this.writeSVarint(val);
    },

    writeStringField: function(tag, str) {
        this.writeTag(tag, Pbf.Bytes);
        this.writeString(str);
    },

    writeFloatField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed32);
        this.writeFloat(val);
    },

    writeDoubleField: function(tag, val) {
        this.writeTag(tag, Pbf.Fixed64);
        this.writeDouble(val);
    },

    writeBooleanField: function(tag, val) {
        this.writeVarintField(tag, Boolean(val));
    }
};

for (var i in Methods) {
    Pbf.prototype[i] = Methods[i];
}
