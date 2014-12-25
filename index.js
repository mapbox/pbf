'use strict';

module.exports = Protobuf;

var Buffer = typeof window !== 'undefined' ? require('./buffer') : global.Buffer;

function Protobuf(buf) {
    this.buf = buf instanceof Uint8Array ? Buffer.wrap(buf) : buf;
    this.pos = 0;
}

Protobuf.prototype = {
    get length() { return this.buf.length; }
};

Protobuf.Varint = 0;
Protobuf.Int64 = 1;
Protobuf.Message = 2;
Protobuf.String = 2;
Protobuf.Packed = 2;
Protobuf.Int32 = 5;

Protobuf.prototype.destroy = function() {
    this.buf = null;
};

var SHIFT_LEFT_32 = (1 << 16) * (1 << 16),
    SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;

// === READING =================================================================

Protobuf.prototype.read = function(readField, end) {
    var buf = this.buf;
    end = end || buf.length;

    while (this.pos < end) {
        var val = this.readVarint(),
            tag = val >> 3,
            startPos = this.pos;
        readField(tag);
        if (this.pos === startPos) this.skip(val);
    }
};

Protobuf.prototype.readMessage = function(readField) {
    var bytes = this.readVarint();
    this.read(readField, this.pos + bytes);
};

Protobuf.prototype.readUInt32 = function() {
    var val = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return val;
};

Protobuf.prototype.readUInt64 = function() {
    var val = this.buf.readUInt32LE(this.pos) + this.buf.readUInt32LE(this.pos + 4) * SHIFT_LEFT_32;
    this.pos += 8;
    return val;
};

Protobuf.prototype.readFloat = function() {
    var val = this.buf.readFloatLE(this.pos);
    this.pos += 4;
    return val;
};

Protobuf.prototype.readDouble = function() {
    var val = this.buf.readDoubleLE(this.pos);
    this.pos += 8;
    return val;
};

Protobuf.prototype.readVarint = function() {
    // TODO: bounds checking
    var pos = this.pos,
        buf = this.buf;

    if (buf[pos] <= 0x7f) {
        this.pos++;
        return buf[pos];
    } else if (buf[pos + 1] <= 0x7f) {
        this.pos += 2;
        return (buf[pos] & 0x7f) | (buf[pos + 1] << 7);
    } else if (buf[pos + 2] <= 0x7f) {
        this.pos += 3;
        return (buf[pos] & 0x7f) | (buf[pos + 1] & 0x7f) << 7 | (buf[pos + 2]) << 14;
    } else if (buf[pos + 3] <= 0x7f) {
        this.pos += 4;
        return (buf[pos] & 0x7f) | (buf[pos + 1] & 0x7f) << 7 | (buf[pos + 2] & 0x7f) << 14 | (buf[pos + 3]) << 21;
    } else if (buf[pos + 4] <= 0x7f) {
        this.pos += 5;
        return ((buf[pos] & 0x7f) | (buf[pos + 1] & 0x7f) << 7 | (buf[pos + 2] & 0x7f) << 14 | (buf[pos + 3]) << 21) + (buf[pos + 4] * 268435456);
    } else {
        this.skip(Protobuf.Varint);
        return 0;
        // throw new Error("TODO: Handle 6+ byte varints");
    }
};

Protobuf.prototype.readSVarint = function() {
    var num = this.readVarint();
    if (num > 2147483647) throw new Error('TODO: Handle numbers >= 2^30');
    // zigzag encoding
    return ((num >> 1) ^ -(num & 1));
};

Protobuf.prototype.readBoolean = function() {
    return Boolean(this.readVarint());
};

Protobuf.prototype.readString = function() {
    var bytes = this.readVarint(),
        str = this.buf.toString('utf8', this.pos, this.pos + bytes);
    // TODO: bounds checking
    this.pos += bytes;
    return str;
};

Protobuf.prototype.readBuffer = function() {
    var bytes = this.readVarint();
    var buffer = this.buf.slice(this.pos, this.pos + bytes);
    this.pos += bytes;
    return buffer;
};

Protobuf.prototype.readPacked = function(type) {
    // TODO: bounds checking
    var bytes = this.readVarint();
    var end = this.pos + bytes;
    var array = [];
    var read = this['read' + type];
    while (this.pos < end) {
        array.push(read.call(this));
    }
    return array;
};

Protobuf.prototype.skip = function(val) {
    // TODO: bounds checking
    var type = val & 0x7;

    if (type === Protobuf.Varint) {
        var buf = this.buf;
        while (buf[this.pos++] > 0x7f);

    } else if (type === Protobuf.Message) {
        var bytes = this.readVarint();
        this.pos += bytes;

    } else if (type === Protobuf.Int32) this.pos += 4;
    else if (type === Protobuf.Int64) this.pos += 8;
    else throw new Error('Unimplemented type: ' + type);
};

// === WRITING =================================================================

Protobuf.prototype.writeTag = function(tag, type) {
    this.writeVarint((tag << 3) | type);
};

Protobuf.prototype.realloc = function(min) {
    var length = this.length || 1;

    while (length < this.pos + min) length *= 2;

    if (length != this.length) {
        var buf = new Buffer(length);
        this.buf.copy(buf);
        this.buf = buf;
    }
};

Protobuf.prototype.finish = function() {
    return this.buf.slice(0, this.pos);
};

Protobuf.prototype.writePacked = function(type, tag, items) {
    if (!items.length) return;

    var message = new Protobuf();
    var write = message['write' + type];
    for (var i = 0; i < items.length; i++) {
        write.call(this, items[i]);
    }
    var data = message.finish();

    this.writeTag(tag, Protobuf.Packed);
    this.writeBuffer(data);
};

Protobuf.prototype.writeUInt32 = function(val) {
    this.realloc(4);
    this.buf.writeUInt32LE(val, this.pos);
    this.pos += 4;
};

Protobuf.prototype.writeTaggedUInt32 = function(tag, val) {
    this.writeTag(tag, Protobuf.Int32);
    this.writeUInt32(val);
};

Protobuf.prototype.writeUInt64 = function(val) {
    this.realloc(8);
    this.buf.writeInt32LE(val & -1, this.pos);
    this.buf.writeUInt32LE(Math.floor(val * SHIFT_RIGHT_32), this.pos + 4);
    this.pos += 8;
};

Protobuf.prototype.writeTaggedUInt64 = function(tag, val) {
    this.writeTag(tag, Protobuf.Int64);
    this.writeUInt64(val);
};

Protobuf.prototype.writeVarint = function(val) {
    val = +val;
    if (isNaN(val)) val = 0;

    if (val <= 0x7f) {
        this.realloc(1);
        this.buf[this.pos++] = val;
    } else if (val <= 0x3fff) {
        this.realloc(2);
        this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
        this.buf[this.pos++] = 0x00 | ((val >>> 7) & 0x7f);
    } else if (val <= 0x1ffffff) {
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
        while (val > 0) {
            var b = val & 0x7f;
            val = Math.floor(val / 128);
            if (val > 0) b |= 0x80;
            this.realloc(1);
            this.buf[this.pos++] = b;
        }
    }
};

Protobuf.prototype.writeTaggedVarint = function(tag, val) {
    this.writeTag(tag, Protobuf.Varint);
    this.writeVarint(val);
};

Protobuf.prototype.writeSVarint = function(val) {
    if (val >= 0) {
        this.writeVarint(val * 2);
    } else {
        this.writeVarint(val * -2 - 1);
    }
};

Protobuf.prototype.writeTaggedSVarint = function(tag, val) {
    this.writeTag(tag, Protobuf.Varint);
    this.writeSVarint(val);
};

Protobuf.prototype.writeBoolean = function(val) {
    this.writeVarint(Boolean(val));
};

Protobuf.prototype.writeTaggedBoolean = function(tag, val) {
    this.writeTaggedVarint(tag, Boolean(val));
};

Protobuf.prototype.writeString = function(str) {
    str = String(str);
    var bytes = Buffer.byteLength(str);
    this.writeVarint(bytes);
    this.realloc(bytes);
    this.buf.write(str, this.pos);
    this.pos += bytes;
};

Protobuf.prototype.writeTaggedString = function(tag, str) {
    this.writeTag(tag, Protobuf.String);
    this.writeString(str);
};

Protobuf.prototype.writeFloat = function(val) {
    this.realloc(4);
    this.buf.writeFloatLE(val, this.pos);
    this.pos += 4;
};

Protobuf.prototype.writeTaggedFloat = function(tag, val) {
    this.writeTag(tag, Protobuf.Int32);
    this.writeFloat(val);
};

Protobuf.prototype.writeDouble = function(val) {
    this.realloc(8);
    this.buf.writeDoubleLE(val, this.pos);
    this.pos += 8;
};

Protobuf.prototype.writeTaggedDouble = function(tag, val) {
    this.writeTag(tag, Protobuf.Int64);
    this.writeDouble(val);
};

Protobuf.prototype.writeBuffer = function(buffer) {
    var bytes = buffer.length;
    this.writeVarint(bytes);
    this.realloc(bytes);
    buffer.copy(this.buf, this.pos);
    this.pos += bytes;
};

Protobuf.prototype.writeTaggedBuffer = function(tag, buffer) {
    this.writeTag(tag, Protobuf.String);
    this.writeBuffer(buffer);
};

Protobuf.prototype.writeMessage = function(tag, protobuf) {
    var buffer = protobuf.finish();
    this.writeTag(tag, Protobuf.Message);
    this.writeBuffer(buffer);
};
