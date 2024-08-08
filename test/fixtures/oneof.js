/**
 * @typedef {import("../../index.js").default} Pbf
 */

/**
 * @typedef {object} Envelope
 * @property {number} [id]
 * @property {number} [int]
 * @property {number} [float]
 * @property {string} [string]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Envelope}
 */
export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {id: 0, int: 0, value: undefined, float: 0, string: ""}, end);
}
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) obj.id = pbf.readVarint(true);
    else if (tag === 2) { obj.int = pbf.readVarint(true); obj.value = "int"; }
    else if (tag === 3) { obj.float = pbf.readFloat(); obj.value = "float"; }
    else if (tag === 4) { obj.string = pbf.readString(); obj.value = "string"; }
}

/**
 * @param {Envelope} obj
 * @param {Pbf} pbf
 */
export function writeEnvelope(obj, pbf) {
    if (obj.id) pbf.writeVarintField(1, obj.id);
    if (obj.int != null) pbf.writeVarintField(2, obj.int);
    if (obj.float != null) pbf.writeFloatField(3, obj.float);
    if (obj.string != null) pbf.writeStringField(4, obj.string);
}
