
export function readTypeString(pbf, end) {
    const obj = {int: "0", long: "0", boolVal: false, float: "0", default_implicit: "0", default_explicit: "42"};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.int = pbf.readVarint(true).toString();
        else if (field === 2) obj.long = pbf.readVarint(true).toString();
        else if (field === 3) obj.boolVal = pbf.readBoolean();
        else if (field === 4) obj.float = pbf.readFloat().toString();
        else if (field === 5) obj.default_implicit = pbf.readVarint(true).toString();
        else if (field === 6) obj.default_explicit = pbf.readVarint(true).toString();
        else pbf.skipField();
    }
    return obj;
}
export function writeTypeString(obj, pbf) {
    if (obj.int != null && obj.int !== "0") pbf.writeVarintField(1, parseInt(obj.int, 10));
    if (obj.long != null && obj.long !== "0") pbf.writeVarintField(2, parseInt(obj.long, 10));
    if (obj.boolVal) pbf.writeBooleanField(3, obj.boolVal);
    if (obj.float != null && obj.float !== "0") pbf.writeFloatField(4, parseFloat(obj.float));
    if (obj.default_implicit != null && obj.default_implicit !== "0") pbf.writeVarintField(5, parseInt(obj.default_implicit, 10));
    if (obj.default_explicit != null && obj.default_explicit !== "42") pbf.writeVarintField(6, parseInt(obj.default_explicit, 10));
}

export function readTypeNotString(pbf, end) {
    const obj = {int: 0, long: 0, boolVal: false, float: 0};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.int = pbf.readVarint(true);
        else if (field === 2) obj.long = pbf.readVarint(true);
        else if (field === 3) obj.boolVal = pbf.readBoolean();
        else if (field === 4) obj.float = pbf.readFloat();
        else pbf.skipField();
    }
    return obj;
}
export function writeTypeNotString(obj, pbf) {
    if (obj.int) pbf.writeVarintField(1, obj.int);
    if (obj.long) pbf.writeVarintField(2, obj.long);
    if (obj.boolVal) pbf.writeBooleanField(3, obj.boolVal);
    if (obj.float) pbf.writeFloatField(4, obj.float);
}
