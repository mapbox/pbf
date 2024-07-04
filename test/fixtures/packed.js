
export function readNotPacked(pbf, end) {
    return pbf.readFields(readNotPackedField, {value: [], types: []}, end);
}
function readNotPackedField(tag, obj, pbf) {
    if (tag === 1) pbf.readPackedVarint(obj.value, true);
    else if (tag === 2) pbf.readPackedVarint(obj.types, true);
}
export function writeNotPacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

export function readFalsePacked(pbf, end) {
    return pbf.readFields(readFalsePackedField, {value: [], types: []}, end);
}
function readFalsePackedField(tag, obj, pbf) {
    if (tag === 1) pbf.readPackedVarint(obj.value, true);
    else if (tag === 2) pbf.readPackedVarint(obj.types, true);
}
export function writeFalsePacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

export function readPacked(pbf, end) {
    return pbf.readFields(readPackedField, {value: [], types: []}, end);
}
function readPackedField(tag, obj, pbf) {
    if (tag === 1) pbf.readPackedVarint(obj.value, true);
    else if (tag === 2) pbf.readPackedVarint(obj.types, true);
}
export function writePacked(obj, pbf) {
    if (obj.value) pbf.writePackedVarint(1, obj.value);
    if (obj.types) pbf.writePackedVarint(2, obj.types);
}
