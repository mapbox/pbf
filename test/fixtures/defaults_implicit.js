/**
 * @typedef {import("../../index.js").default} Pbf
 */

/** @enum {number} */
export const MessageType = {
    "UNKNOWN": 0,
    "GREETING": 1
};

/**
 * @typedef {object} CustomType
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {CustomType}
 */
export function readCustomType(pbf, end) {
    return pbf.readFields(readCustomTypeField, {}, end);
}
function readCustomTypeField(tag, obj, pbf) {
}

/**
 * @param {CustomType} obj
 * @param {Pbf} pbf
 */
export function writeCustomType(obj, pbf) {
}

/**
 * @typedef {object} Envelope
 * @property {MessageType} [type]
 * @property {string} [name]
 * @property {boolean} [flag]
 * @property {number} [weight]
 * @property {number} [id]
 * @property {string} [tags]
 * @property {number} [numbers]
 * @property {bytes} [bytes]
 * @property {CustomType} [custom]
 * @property {MessageType} [types]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Envelope}
 */
export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {type: 0, name: "", flag: false, weight: 0, id: 0, tags: [], numbers: [], bytes: undefined, custom: undefined, types: []}, end);
}
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) obj.type = pbf.readVarint();
    else if (tag === 2) obj.name = pbf.readString();
    else if (tag === 3) obj.flag = pbf.readBoolean();
    else if (tag === 4) obj.weight = pbf.readFloat();
    else if (tag === 5) obj.id = pbf.readVarint(true);
    else if (tag === 6) obj.tags.push(pbf.readString());
    else if (tag === 7) pbf.readPackedVarint(obj.numbers, true);
    else if (tag === 8) obj.bytes = pbf.readBytes();
    else if (tag === 9) obj.custom = readCustomType(pbf, pbf.readVarint() + pbf.pos);
    else if (tag === 10) pbf.readPackedVarint(obj.types);
}

/**
 * @param {Envelope} obj
 * @param {Pbf} pbf
 */
export function writeEnvelope(obj, pbf) {
    if (obj.type) pbf.writeVarintField(1, obj.type);
    if (obj.name) pbf.writeStringField(2, obj.name);
    if (obj.flag) pbf.writeBooleanField(3, obj.flag);
    if (obj.weight) pbf.writeFloatField(4, obj.weight);
    if (obj.id) pbf.writeVarintField(5, obj.id);
    if (obj.tags) for (const item of obj.tags) pbf.writeStringField(6, item);
    if (obj.numbers) for (const item of obj.numbers) pbf.writeVarintField(7, item);
    if (obj.bytes != null) pbf.writeBytesField(8, obj.bytes);
    if (obj.custom) pbf.writeMessage(9, writeCustomType, obj.custom);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(10, item);
}
