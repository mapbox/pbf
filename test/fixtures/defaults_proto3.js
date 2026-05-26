
export const MessageType = {
    "UNKNOWN": 0,
    "GREETING": 1
};

export function readEnvelope(pbf, end = pbf.length) {
    const obj = {type: 0, name: "", flag: false, weight: 0, id: 0};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.type = pbf.readVarint();
        else if (field === 2) obj.name = pbf.readString();
        else if (field === 3) obj.flag = pbf.readBoolean();
        else if (field === 4) obj.weight = pbf.readFloat();
        else if (field === 5) obj.id = pbf.readVarint(true);
        else pbf.skipField();
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.type) pbf.writeVarintField(1, obj.type);
    if (obj.name) pbf.writeStringField(2, obj.name);
    if (obj.flag) pbf.writeBooleanField(3, obj.flag);
    if (obj.weight) pbf.writeFloatField(4, obj.weight);
    if (obj.id) pbf.writeVarintField(5, obj.id);
}
