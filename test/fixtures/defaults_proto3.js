/**
 * @typedef {import("../../index.js").default} Pbf
 */

/** @enum {number} */
export const MessageType = {
    "UNKNOWN": 0,
    "GREETING": 1
};

/**
 * @typedef {object} Envelope
 * @property {MessageType} [type]
 * @property {string} [name]
 * @property {boolean} [flag]
 * @property {number} [weight]
 * @property {number} [id]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Envelope}
 */
export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {type: 0, name: "", flag: false, weight: 0, id: 0}, end);
}
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) obj.type = pbf.readVarint();
    else if (tag === 2) obj.name = pbf.readString();
    else if (tag === 3) obj.flag = pbf.readBoolean();
    else if (tag === 4) obj.weight = pbf.readFloat();
    else if (tag === 5) obj.id = pbf.readVarint(true);
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
}
