
export const MessageType = {
    "UNKNOWN": 0,
    "GREETING": 1
};

export function readNotPacked(pbf, end = pbf.length) {
    const obj = {value: [], types: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) pbf.readPackedVarint(obj.value, true);
        else if (field === 2) pbf.readPackedVarint(obj.types);
        else pbf.skipField();
    }
    return obj;
}
export function writeNotPacked(obj, pbf) {
    if (obj.value) pbf.writePackedVarint(1, obj.value);
    if (obj.types) pbf.writePackedVarint(2, obj.types);
}

export function readFalsePacked(pbf, end = pbf.length) {
    const obj = {value: [], types: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) pbf.readPackedVarint(obj.value, true);
        else if (field === 2) pbf.readPackedVarint(obj.types);
        else pbf.skipField();
    }
    return obj;
}
export function writeFalsePacked(obj, pbf) {
    if (obj.value) for (const item of obj.value) pbf.writeVarintField(1, item);
    if (obj.types) for (const item of obj.types) pbf.writeVarintField(2, item);
}

export function readPacked(pbf, end = pbf.length) {
    const obj = {value: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 16) pbf.readPackedVarint(obj.value, true);
        else pbf.skipField();
    }
    return obj;
}
export function writePacked(obj, pbf) {
    if (obj.value) pbf.writePackedVarint(16, obj.value);
}

export function readPackedFixed(pbf, end = pbf.length) {
    const obj = {value: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) pbf.readPackedSFixed64(obj.value);
        else pbf.skipField();
    }
    return obj;
}
export function writePackedFixed(obj, pbf) {
    if (obj.value) pbf.writePackedSFixed64(1, obj.value);
}
