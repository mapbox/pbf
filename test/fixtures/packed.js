/**
 * @typedef {import("../../index.js").default} Pbf
 */

/**
 * @typedef {object} NotPacked
 * @property {number} [value]
 * @property {number} [types]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {NotPacked}
 */
export function readNotPacked(pbf, end) {
    return pbf.readFields(readNotPackedField, {value: [], types: []}, end);
}
function readNotPackedField(tag, obj, pbf) {
    if (tag === 1) pbf.readPackedVarint(obj.value, true);
    else if (tag === 2) pbf.readPackedVarint(obj.types, true);
}

/**
 * @param {NotPacked} obj
 * @param {Pbf} pbf
 */
export function writeNotPacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

/**
 * @typedef {object} FalsePacked
 * @property {number} [value]
 * @property {number} [types]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {FalsePacked}
 */
export function readFalsePacked(pbf, end) {
    return pbf.readFields(readFalsePackedField, {value: [], types: []}, end);
}
function readFalsePackedField(tag, obj, pbf) {
    if (tag === 1) pbf.readPackedVarint(obj.value, true);
    else if (tag === 2) pbf.readPackedVarint(obj.types, true);
}

/**
 * @param {FalsePacked} obj
 * @param {Pbf} pbf
 */
export function writeFalsePacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

/**
 * @typedef {object} Packed
 * @property {number} [value]
 * @property {number} [types]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {Packed}
 */
export function readPacked(pbf, end) {
    return pbf.readFields(readPackedField, {value: [], types: []}, end);
}
function readPackedField(tag, obj, pbf) {
    if (tag === 1) pbf.readPackedVarint(obj.value, true);
    else if (tag === 2) pbf.readPackedVarint(obj.types, true);
}

/**
 * @param {Packed} obj
 * @param {Pbf} pbf
 */
export function writePacked(obj, pbf) {
    if (obj.value) pbf.writePackedVarint(1, obj.value);
    if (obj.types) pbf.writePackedVarint(2, obj.types);
}
