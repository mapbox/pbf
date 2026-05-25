
export const MessageType = {
    "UNKNOWN": 0,
    "GREETING": 1
};

export function readEnvelope(pbf, end = pbf.length) {
    const obj = {type: 1, name: "test", flag: true, weight: 1.5, id: 1};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) obj.type = pbf.readVarint();
        else if (field === 2) obj.name = pbf.readString();
        else if (field === 3) obj.flag = pbf.readBoolean();
        else if (field === 4) obj.weight = pbf.readFloat();
        else if (field === 5) obj.id = pbf.readVarint(true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.type != null && obj.type !== 1) pbf.writeVarintField(1, obj.type);
    if (obj.name != null && obj.name !== "test") pbf.writeStringField(2, obj.name);
    if (obj.flag != null && obj.flag !== true) pbf.writeBooleanField(3, obj.flag);
    if (obj.weight != null && obj.weight !== 1.5) pbf.writeFloatField(4, obj.weight);
    if (obj.id != null && obj.id !== 1) pbf.writeVarintField(5, obj.id);
}
