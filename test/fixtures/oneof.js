
export function readEnvelope(pbf, end) {
    const obj = {id: 0, int: 0, value: undefined, float: 0, string: ""};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.id = pbf.readVarint(true);
        else if (field === 2) { obj.int = pbf.readVarint(true); obj.value = "int"; }
        else if (field === 3) { obj.float = pbf.readFloat(); obj.value = "float"; }
        else if (field === 4) { obj.string = pbf.readString(); obj.value = "string"; }
        else pbf.skipField();
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.id) pbf.writeVarintField(1, obj.id);
    if (obj.int != null) pbf.writeVarintField(2, obj.int);
    if (obj.float != null) pbf.writeFloatField(3, obj.float);
    if (obj.string != null) pbf.writeStringField(4, obj.string);
}
