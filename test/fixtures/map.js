/**
 * @typedef {import("../../index.js").default} Pbf
 */

/**
 * @typedef {object} Envelope
 * @property {Envelope_FieldEntry1} kv
 * @property {Envelope_FieldEntry2} kn
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Envelope}
 */
export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {kv: {}, kn: {}}, end);
}

/**
 * @param {number} tag
 * @param {Envelope} obj
 * @param {Pbf} pbf
 */
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) { const {key, value} = readEnvelope_FieldEntry1(pbf, pbf.readVarint() + pbf.pos); obj.kv[key] = value; }
    else if (tag === 2) { const {key, value} = readEnvelope_FieldEntry2(pbf, pbf.readVarint() + pbf.pos); obj.kn[key] = value; }
}

/**
 * @param {Envelope} obj
 * @param {Pbf} pbf
 */
export function writeEnvelope(obj, pbf) {
    if (obj.kv) for (const key of Object.keys(obj.kv)) pbf.writeMessage(1, writeEnvelope_FieldEntry1, {key, value: obj.kv[key]});
    if (obj.kn) for (const key of Object.keys(obj.kn)) pbf.writeMessage(2, writeEnvelope_FieldEntry2, {key, value: obj.kn[key]});
}

/**
 * @typedef {Record<string, string>} Envelope_FieldEntry1
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Envelope_FieldEntry1}
 */
export function readEnvelope_FieldEntry1(pbf, end) {
    return pbf.readFields(readEnvelope_FieldEntry1Field, {key: "", value: ""}, end);
}

/**
 * @param {number} tag
 * @param {{key: string; value: string}} obj
 * @param {Pbf} pbf
 */
function readEnvelope_FieldEntry1Field(tag, obj, pbf) {
    if (tag === 1) obj.key = pbf.readString();
    else if (tag === 2) obj.value = pbf.readString();
}

/**
 * @param {{key: string; value: string}} obj
 * @param {Pbf} pbf
 */
export function writeEnvelope_FieldEntry1(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeStringField(2, obj.value);
}

/**
 * @typedef {Record<string, number>} Envelope_FieldEntry2
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Envelope_FieldEntry2}
 */
export function readEnvelope_FieldEntry2(pbf, end) {
    return pbf.readFields(readEnvelope_FieldEntry2Field, {key: "", value: 0}, end);
}

/**
 * @param {number} tag
 * @param {{key: string; value: number}} obj
 * @param {Pbf} pbf
 */
function readEnvelope_FieldEntry2Field(tag, obj, pbf) {
    if (tag === 1) obj.key = pbf.readString();
    else if (tag === 2) obj.value = pbf.readVarint(true);
}

/**
 * @param {{key: string; value: number}} obj
 * @param {Pbf} pbf
 */
export function writeEnvelope_FieldEntry2(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeVarintField(2, obj.value);
}
