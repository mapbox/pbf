
export function readEnvelope(pbf, end = pbf.length) {
    const obj = {int: 0, uint: 0, long: 0, ulong: 0};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.int = pbf.readVarint(true);
        else if (field === 2) obj.uint = pbf.readVarint();
        else if (field === 3) obj.long = pbf.readVarint(true);
        else if (field === 4) obj.ulong = pbf.readVarint();
        else pbf.skipField();
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.int) pbf.writeVarintField(1, obj.int);
    if (obj.uint) pbf.writeVarintField(2, obj.uint);
    if (obj.long) pbf.writeVarintField(3, obj.long);
    if (obj.ulong) pbf.writeVarintField(4, obj.ulong);
}
