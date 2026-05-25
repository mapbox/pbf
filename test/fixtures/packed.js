
export function readNotPacked(pbf, end = pbf.length) {
    const obj = {value: [], types: []};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3; pbf.type = tag & 7;
        if (field === 1) pbf.readPackedVarint(obj.value, true);
        else if (field === 2) pbf.readPackedVarint(obj.types, true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writeNotPacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

export function readFalsePacked(pbf, end = pbf.length) {
    const obj = {value: [], types: []};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3; pbf.type = tag & 7;
        if (field === 1) pbf.readPackedVarint(obj.value, true);
        else if (field === 2) pbf.readPackedVarint(obj.types, true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writeFalsePacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

export function readPacked(pbf, end = pbf.length) {
    const obj = {value: [], types: []};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3; pbf.type = tag & 7;
        if (field === 1) pbf.readPackedVarint(obj.value, true);
        else if (field === 2) pbf.readPackedVarint(obj.types, true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writePacked(obj, pbf) {
    if (obj.value) pbf.writePackedVarint(1, obj.value);
    if (obj.types) pbf.writePackedVarint(2, obj.types);
}
