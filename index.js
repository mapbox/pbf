
const SHIFT_LEFT_32 = (1 << 16) * (1 << 16);
const SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;

// TextDecoder has a high fixed cost per call, so short strings are faster to decode in JS. But strings over
// 12 chars built in JS become memory-heavy V8 cons strings, so we use JS only below 12 bytes for strings
// starting with ASCII and below 32 bytes for others (fewer chars per byte, and a costlier TextDecoder call).
const TEXT_DECODER_MIN_LENGTH = 12;
const TEXT_DECODER_MIN_LENGTH_NON_ASCII = 32;
const utf8TextDecoder = new TextDecoder();

const PBF_VARINT  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
const PBF_FIXED64 = 1; // 64-bit: double, fixed64, sfixed64
const PBF_BYTES   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
const PBF_FIXED32 = 5; // 32-bit: float, fixed32, sfixed32

/**
 * The type of objects accepted by write functions in generated code: any subset of fields, recursively.
 * @template T
 * @typedef {T extends Uint8Array ? T : T extends (infer U)[] ? DeepPartial<U>[] :
 *     T extends object ? {[K in keyof T]?: DeepPartial<T[K]>} : T} DeepPartial
 */

export class PbfReader {
    /**
     * @param {Uint8Array | ArrayBuffer} buf
     */
    constructor(buf) {
        this.buf = ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf);
        this.dataView = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
        this.pos = 0;
        this.type = 0;
        this._valueStart = -1;
        this.length = this.buf.length;
    }

    /**
     * @template T
     * @param {(tag: number, result: T, pbf: PbfReader) => void} readField
     * @param {T} result
     * @param {number} [end]
     */
    readFields(readField, result, end = this.length) {
        let field;
        while ((field = this.nextField(end))) {
            readField(field, result, this);
        }
        return result;
    }

    /**
     * @template T
     * @param {(tag: number, result: T, pbf: PbfReader) => void} readField
     * @param {T} result
     */
    readMessage(readField, result) {
        return this.readFields(readField, result, this.readVarint() + this.pos);
    }

    readFixed32() {
        const val = this.dataView.getUint32(this.pos, true);
        this.pos += 4;
        return val;
    }

    readSFixed32() {
        const val = this.dataView.getInt32(this.pos, true);
        this.pos += 4;
        return val;
    }

    // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

    readFixed64() {
        const val = this.dataView.getUint32(this.pos, true) + this.dataView.getUint32(this.pos + 4, true) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    }

    readSFixed64() {
        const val = this.dataView.getUint32(this.pos, true) + this.dataView.getInt32(this.pos + 4, true) * SHIFT_LEFT_32;
        this.pos += 8;
        return val;
    }

    readFloat() {
        const val = this.dataView.getFloat32(this.pos, true);
        this.pos += 4;
        return val;
    }

    readDouble() {
        const val = this.dataView.getFloat64(this.pos, true);
        this.pos += 8;
        return val;
    }

    /**
     * @param {boolean} [isSigned]
     */
    readVarint(isSigned) {
        const buf = this.buf;
        const b0 = buf[this.pos++];
        if (b0 < 0x80) return b0;

        let val = b0 & 0x7f, b;
        b = buf[this.pos++]; val |= (b & 0x7f) << 7;  if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 14; if (b < 0x80) return val;
        b = buf[this.pos++]; val |= (b & 0x7f) << 21; if (b < 0x80) return val;
        b = buf[this.pos];   val |= (b & 0x0f) << 28;

        return readVarintRemainder(val, isSigned, this);
    }

    readSVarint() {
        const num = this.readVarint();
        return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
    }

    readBoolean() {
        return Boolean(this.readVarint());
    }

    readString() {
        const end = this.readVarint() + this.pos;
        const pos = this.pos;
        this.pos = end;

        const len = end - pos;
        if (len >= (this.buf[pos] < 0x80 ? TEXT_DECODER_MIN_LENGTH : TEXT_DECODER_MIN_LENGTH_NON_ASCII)) {
            // longer strings are fast with the built-in browser TextDecoder API
            return utf8TextDecoder.decode(this.buf.subarray(pos, end));
        }
        // short strings are fast with our custom implementation
        return readUtf8(this.buf, pos, end);
    }

    readBytes() {
        const end = this.readVarint() + this.pos,
            buffer = this.buf.subarray(this.pos, end);
        this.pos = end;
        return buffer;
    }

    // verbose for performance reasons; doesn't affect gzipped size

    /**
     * @param {number[]} [arr]
     * @param {boolean} [isSigned]
     */
    readPackedVarint(arr = [], isSigned) {
        const end = this.readPackedEnd();
        const buf = this.buf;
        let pos = this.pos;
        // 1–2 byte values dominate typical packed data (e.g. geometry deltas), so decode them inline
        while (pos < end) {
            const b0 = buf[pos];
            if (b0 < 0x80) { arr.push(b0); pos++; continue; }
            const b1 = buf[pos + 1];
            if (b1 < 0x80) { arr.push((b0 & 0x7f) | (b1 << 7)); pos += 2; continue; }
            this.pos = pos;
            arr.push(this.readVarint(isSigned));
            pos = this.pos;
        }
        this.pos = pos;
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedSVarint(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readSVarint());
        return arr;
    }
    /** @param {boolean[]} [arr] */
    readPackedBoolean(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readBoolean());
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedFloat(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readFloat());
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedDouble(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readDouble());
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedFixed32(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readFixed32());
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedSFixed32(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readSFixed32());
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedFixed64(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readFixed64());
        return arr;
    }
    /** @param {number[]} [arr] */
    readPackedSFixed64(arr = []) {
        const end = this.readPackedEnd();
        while (this.pos < end) arr.push(this.readSFixed64());
        return arr;
    }
    readPackedEnd() {
        return this.type === PBF_BYTES ? this.readVarint() + this.pos : this.pos + 1;
    }

    /**
     * Advance to the next field. Returns the field number, or 0 at end-of-message.
     * @param {number} [end]
     */
    nextField(end = this.length) {
        if (this.pos === this._valueStart) this.skip(this.type);
        if (this.pos >= end) return 0;
        const tag = this.readVarint();
        this.type = tag & 0x7;
        this._valueStart = this.pos;
        return tag >>> 3;
    }

    /** @param {number} val */
    skip(val) {
        const type = val & 0x7;
        if (type === PBF_VARINT) while (this.buf[this.pos++] > 0x7f) {}
        else if (type === PBF_BYTES) this.pos = this.readVarint() + this.pos;
        else if (type === PBF_FIXED32) this.pos += 4;
        else if (type === PBF_FIXED64) this.pos += 8;
        else throw new Error(`Unimplemented type: ${type}`);
    }
}

export class PbfWriter {
    /**
     * @param {Uint8Array | ArrayBuffer} [buf]
     */
    constructor(buf = new Uint8Array(16)) {
        this.buf = ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf);
        this.dataView = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength);
        this.pos = 0;
        this.length = this.buf.length;
    }

    /**
     * @param {number} tag
     * @param {number} type
     */
    writeTag(tag, type) {
        this.writeVarint((tag << 3) | type);
    }

    /** @param {number} min */
    realloc(min) {
        let length = this.length || 16;

        while (length < this.pos + min) length *= 2;

        if (length !== this.length) {
            const buf = new Uint8Array(length);
            buf.set(this.buf);
            this.buf = buf;
            this.dataView = new DataView(buf.buffer);
            this.length = length;
        }
    }

    finish() {
        this.length = this.pos;
        this.pos = 0;
        return this.buf.subarray(0, this.length);
    }

    /** @param {number} val */
    writeFixed32(val) {
        this.realloc(4);
        this.dataView.setInt32(this.pos, val, true);
        this.pos += 4;
    }

    /** @param {number} val */
    writeSFixed32(val) {
        this.realloc(4);
        this.dataView.setInt32(this.pos, val, true);
        this.pos += 4;
    }

    /** @param {number} val */
    writeFixed64(val) {
        this.realloc(8);
        this.dataView.setInt32(this.pos, val & -1, true);
        this.dataView.setInt32(this.pos + 4, Math.floor(val * SHIFT_RIGHT_32), true);
        this.pos += 8;
    }

    /** @param {number} val */
    writeSFixed64(val) {
        this.realloc(8);
        this.dataView.setInt32(this.pos, val & -1, true);
        this.dataView.setInt32(this.pos + 4, Math.floor(val * SHIFT_RIGHT_32), true);
        this.pos += 8;
    }

    /** @param {number} val */
    writeVarint(val) {
        val = +val || 0;

        if (val >= 0 && val < 0x80) {
            if (this.pos >= this.length) this.realloc(1);
            this.buf[this.pos++] = val;
            return;
        }

        if (val > 0xfffffff || val < 0) {
            writeBigVarint(val, this);
            return;
        }

        this.realloc(4);
        while (val > 0x7f) { this.buf[this.pos++] = val & 0x7f | 0x80; val >>>= 7; }
        this.buf[this.pos++] = val;
    }

    /** @param {number} val */
    writeSVarint(val) {
        this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
    }

    /** @param {boolean} val */
    writeBoolean(val) {
        this.writeVarint(+val);
    }

    /** @param {string} str */
    writeString(str) {
        str = String(str);
        this.realloc(str.length * 4);

        this.pos++; // reserve 1 byte for short string length

        const startPos = this.pos;
        // write the string directly to the buffer and see how much was written
        this.pos = writeUtf8(this.buf, str, this.pos);
        const len = this.pos - startPos;

        if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

        // finally, write the message length in the reserved place and restore the position
        this.pos = startPos - 1;
        this.writeVarint(len);
        this.pos += len;
    }

    /** @param {number} val */
    writeFloat(val) {
        this.realloc(4);
        this.dataView.setFloat32(this.pos, val, true);
        this.pos += 4;
    }

    /** @param {number} val */
    writeDouble(val) {
        this.realloc(8);
        this.dataView.setFloat64(this.pos, val, true);
        this.pos += 8;
    }

    /** @param {Uint8Array} buffer */
    writeBytes(buffer) {
        const len = buffer.length;
        this.writeVarint(len);
        this.realloc(len);
        this.buf.set(buffer, this.pos);
        this.pos += len;
    }

    /**
     * @template T
     * @param {(obj: T, pbf: PbfWriter) => void} fn
     * @param {T} obj
     */
    writeRawMessage(fn, obj) {
        this.pos++; // reserve 1 byte for short message length

        // write the message directly to the buffer and see how much was written
        const startPos = this.pos;
        fn(obj, this);
        const len = this.pos - startPos;

        if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

        // finally, write the message length in the reserved place and restore the position
        this.pos = startPos - 1;
        this.writeVarint(len);
        this.pos += len;
    }

    /**
     * @template T
     * @param {number} tag
     * @param {(obj: T, pbf: PbfWriter) => void} fn
     * @param {T} obj
     */
    writeMessage(tag, fn, obj) {
        this.writeTag(tag, PBF_BYTES);
        this.writeRawMessage(fn, obj);
    }

    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedVarint(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedVarint, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedSVarint(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedSVarint, arr);
    }
    /**
     * @param {number} tag
     * @param {boolean[]} arr
     */
    writePackedBoolean(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedBoolean, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedFloat(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedFloat, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedDouble(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedDouble, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedFixed32(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedFixed32, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedSFixed32(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedSFixed32, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedFixed64(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedFixed64, arr);
    }
    /**
     * @param {number} tag
     * @param {number[]} arr
     */
    writePackedSFixed64(tag, arr) {
        if (arr.length) this.writeMessage(tag, writePackedSFixed64, arr);
    }

    /**
     * @param {number} tag
     * @param {Uint8Array} buffer
     */
    writeBytesField(tag, buffer) {
        this.writeTag(tag, PBF_BYTES);
        this.writeBytes(buffer);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeFixed32Field(tag, val) {
        this.writeTag(tag, PBF_FIXED32);
        this.writeFixed32(val);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeSFixed32Field(tag, val) {
        this.writeTag(tag, PBF_FIXED32);
        this.writeSFixed32(val);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeFixed64Field(tag, val) {
        this.writeTag(tag, PBF_FIXED64);
        this.writeFixed64(val);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeSFixed64Field(tag, val) {
        this.writeTag(tag, PBF_FIXED64);
        this.writeSFixed64(val);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeVarintField(tag, val) {
        this.writeTag(tag, PBF_VARINT);
        this.writeVarint(val);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeSVarintField(tag, val) {
        this.writeTag(tag, PBF_VARINT);
        this.writeSVarint(val);
    }
    /**
     * @param {number} tag
     * @param {string} str
     */
    writeStringField(tag, str) {
        this.writeTag(tag, PBF_BYTES);
        this.writeString(str);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeFloatField(tag, val) {
        this.writeTag(tag, PBF_FIXED32);
        this.writeFloat(val);
    }
    /**
     * @param {number} tag
     * @param {number} val
     */
    writeDoubleField(tag, val) {
        this.writeTag(tag, PBF_FIXED64);
        this.writeDouble(val);
    }
    /**
     * @param {number} tag
     * @param {boolean} val
     */
    writeBooleanField(tag, val) {
        this.writeVarintField(tag, +val);
    }
}

/**
 * @param {number} l
 * @param {boolean | undefined} s
 * @param {PbfReader} p
 */
function readVarintRemainder(l, s, p) {
    const buf = p.buf;
    let h, b;

    b = buf[p.pos++]; h  = (b & 0x70) >> 4;  if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 3;  if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 10; if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 17; if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x7f) << 24; if (b < 0x80) return toNum(l, h, s);
    b = buf[p.pos++]; h |= (b & 0x01) << 31; if (b < 0x80) return toNum(l, h, s);

    throw new Error('Expected varint not more than 10 bytes');
}

/**
 * @param {number} low
 * @param {number} high
 * @param {boolean} [isSigned]
 */
function toNum(low, high, isSigned) {
    return isSigned ? high * 0x100000000 + (low >>> 0) : ((high >>> 0) * 0x100000000) + (low >>> 0);
}

/**
 * @param {number} val
 * @param {PbfWriter} pbf
 */
function writeBigVarint(val, pbf) {
    let low, high;

    if (val >= 0) {
        low  = (val % 0x100000000) | 0;
        high = (val / 0x100000000) | 0;
    } else {
        low  = ~(-val % 0x100000000);
        high = ~(-val / 0x100000000);

        if (low ^ 0xffffffff) {
            low = (low + 1) | 0;
        } else {
            low = 0;
            high = (high + 1) | 0;
        }
    }

    if (val >= 0x10000000000000000 || val < -0x10000000000000000) {
        throw new Error('Given varint doesn\'t fit into 10 bytes');
    }

    pbf.realloc(10);

    writeBigVarintLow(low, high, pbf);
    writeBigVarintHigh(high, pbf);
}

/**
 * @param {number} high
 * @param {number} low
 * @param {PbfWriter} pbf
 */
function writeBigVarintLow(low, high, pbf) {
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
    pbf.buf[pbf.pos]   = low & 0x7f;
}

/**
 * @param {number} high
 * @param {PbfWriter} pbf
 */
function writeBigVarintHigh(high, pbf) {
    const lsb = (high & 0x07) << 4;

    pbf.buf[pbf.pos++] |= lsb         | ((high >>>= 3) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
    pbf.buf[pbf.pos++]  = high & 0x7f;
}

/**
 * @param {number} startPos
 * @param {number} len
 * @param {PbfWriter} pbf
 */
function makeRoomForExtraLength(startPos, len, pbf) {
    const extraLen =
        len <= 0x3fff ? 1 :
        len <= 0x1fffff ? 2 :
        len <= 0xfffffff ? 3 : 4;

    // if 1 byte isn't enough for encoding message length, shift the data to the right
    pbf.realloc(extraLen);
    pbf.buf.copyWithin(startPos + extraLen, startPos, pbf.pos);
}

/**
 * Packed varints often dominate encode time, so write the bytes inline
 * through a local buffer pointer rather than calling writeVarint per element,
 * falling back to writeVarint only for negatives or near the buffer's end.
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedVarint(arr, pbf) {
    const n = arr.length;
    let buf = pbf.buf, pos = pbf.pos, limit = pbf.length;
    for (let i = 0; i < n; i++) {
        let val = arr[i];
        if (val < 0 || pos + 10 > limit) { // slow path: grows the buffer, handles 10-byte values
            pbf.pos = pos;
            pbf.writeVarint(val);
            buf = pbf.buf; pos = pbf.pos; limit = pbf.length;
            continue;
        }
        while (val > 0x7f) { buf[pos++] = (val % 0x80) | 0x80; val = Math.floor(val / 0x80); }
        buf[pos++] = val;
    }
    pbf.pos = pos;
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedSVarint(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedFloat(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedDouble(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);
}
/**
 * @param {boolean[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedBoolean(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedFixed32(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedSFixed32(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]);
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedFixed64(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);
}
/**
 * @param {number[]} arr
 * @param {PbfWriter} pbf
 */
function writePackedSFixed64(arr, pbf) {
    for (let i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]);
}

/**
 * Decodes valid 1–3 byte UTF-8 sequences, handing anything else (invalid bytes, 4-byte chars) to TextDecoder.
 * @param {Uint8Array} buf
 * @param {number} pos
 * @param {number} end
 */
function readUtf8(buf, pos, end) {
    let str = '';
    for (let i = pos; i < end; i++) {
        let c = buf[i];
        if (c > 0x7f) {
            const b1 = buf[i + 1] ^ 0x80;
            const b2 = buf[i + 2] ^ 0x80;
            if (c >= 0xc2 && c < 0xe0 && b1 < 0x40 && i + 1 < end) {
                c = (c & 0x1f) << 6 | b1;
                i++;
            } else if ((c & 0xf0) === 0xe0 && b1 < 0x40 && b2 < 0x40 && i + 2 < end &&
                (c = (c & 0xf) << 12 | b1 << 6 | b2) >= 0x800 && (c < 0xd800 || c > 0xdfff)) {
                i += 2;
            } else {
                return utf8TextDecoder.decode(buf.subarray(pos, end));
            }
        }
        str += String.fromCharCode(c);
    }
    return str;
}

/**
 * ASCII fast path, kept small so V8 inlines it into writeString; the general encoder takes over from
 * the first non-ASCII char.
 * @param {Uint8Array} buf
 * @param {string} str
 * @param {number} pos
 */
function writeUtf8(buf, str, pos) {
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c >= 0x80) return writeUtf8From(buf, str, pos, i);
        buf[pos++] = c;
    }
    return pos;
}

/**
 * @param {Uint8Array} buf
 * @param {string} str
 * @param {number} pos
 * @param {number} i
 */
function writeUtf8From(buf, str, pos, i) {
    let lead;
    for (let c; i < str.length; i++) {
        c = str.charCodeAt(i); // code point

        if (c > 0xD7FF && c < 0xE000) {
            if (lead) {
                if (c < 0xDC00) {
                    buf[pos++] = 0xEF;
                    buf[pos++] = 0xBF;
                    buf[pos++] = 0xBD;
                    lead = c;
                    continue;
                } else {
                    c = (lead - 0xD800 << 10 | c - 0xDC00) + 0x10000;
                    lead = null;
                }
            } else {
                if (c > 0xDBFF) {
                    buf[pos++] = 0xEF;
                    buf[pos++] = 0xBF;
                    buf[pos++] = 0xBD;
                } else {
                    lead = c;
                }
                continue;
            }
        } else if (lead) {
            buf[pos++] = 0xEF;
            buf[pos++] = 0xBF;
            buf[pos++] = 0xBD;
            lead = null;
        }

        if (c < 0x80) {
            buf[pos++] = c;
        } else {
            if (c < 0x800) {
                buf[pos++] = c >> 0x6 | 0xC0;
            } else {
                if (c < 0x10000) {
                    buf[pos++] = c >> 0xC | 0xE0;
                } else {
                    buf[pos++] = c >> 0x12 | 0xF0;
                    buf[pos++] = c >> 0xC & 0x3F | 0x80;
                }
                buf[pos++] = c >> 0x6 & 0x3F | 0x80;
            }
            buf[pos++] = c & 0x3F | 0x80;
        }
    }
    if (lead) {
        buf[pos++] = 0xEF;
        buf[pos++] = 0xBF;
        buf[pos++] = 0xBD;
    }
    return pos;
}
