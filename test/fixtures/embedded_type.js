/**
 * @typedef {import("../../index.js").default} Pbf
 */

/**
 * @typedef {object} EmbeddedType
 * @property {string} [value]
 * @property {Container} [sub_field]
 * @property {Container.Inner} [sub_sub_field]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {EmbeddedType}
 */
export function readEmbeddedType(pbf, end) {
    return pbf.readFields(readEmbeddedTypeField, {value: "test", sub_field: undefined, sub_sub_field: undefined}, end);
}
function readEmbeddedTypeField(tag, obj, pbf) {
    if (tag === 1) obj.value = pbf.readString();
    else if (tag === 4) obj.sub_field = readEmbeddedTypeContainer(pbf, pbf.readVarint() + pbf.pos);
    else if (tag === 5) obj.sub_sub_field = readEmbeddedTypeContainerInner(pbf, pbf.readVarint() + pbf.pos);
}

/**
 * @param {EmbeddedType} obj
 * @param {Pbf} pbf
 */
export function writeEmbeddedType(obj, pbf) {
    if (obj.value != null && obj.value !== "test") pbf.writeStringField(1, obj.value);
    if (obj.sub_field) pbf.writeMessage(4, writeEmbeddedTypeContainer, obj.sub_field);
    if (obj.sub_sub_field) pbf.writeMessage(5, writeEmbeddedTypeContainerInner, obj.sub_sub_field);
}

/**
 * @typedef {object} EmbeddedTypeContainer
 * @property {Inner} [values]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {EmbeddedTypeContainer}
 */
export function readEmbeddedTypeContainer(pbf, end) {
    return pbf.readFields(readEmbeddedTypeContainerField, {values: []}, end);
}
function readEmbeddedTypeContainerField(tag, obj, pbf) {
    if (tag === 1) obj.values.push(readEmbeddedTypeContainerInner(pbf, pbf.readVarint() + pbf.pos));
}

/**
 * @param {EmbeddedTypeContainer} obj
 * @param {Pbf} pbf
 */
export function writeEmbeddedTypeContainer(obj, pbf) {
    if (obj.values) for (const item of obj.values) pbf.writeMessage(1, writeEmbeddedTypeContainerInner, item);
}

/**
 * @typedef {object} EmbeddedTypeContainerInner
 * @property {string} [value]
 */

/**
 * @param {Pbf} pbf
 * @param {number} [end]
 * @returns {EmbeddedTypeContainerInner}
 */
export function readEmbeddedTypeContainerInner(pbf, end) {
    return pbf.readFields(readEmbeddedTypeContainerInnerField, {value: ""}, end);
}
function readEmbeddedTypeContainerInnerField(tag, obj, pbf) {
    if (tag === 1) obj.value = pbf.readString();
}

/**
 * @param {EmbeddedTypeContainerInner} obj
 * @param {Pbf} pbf
 */
export function writeEmbeddedTypeContainerInner(obj, pbf) {
    if (obj.value) pbf.writeStringField(1, obj.value);
}
