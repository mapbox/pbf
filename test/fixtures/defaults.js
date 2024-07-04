
export const MessageType = {
    "UNKNOWN": 0,
    "GREETING": 1
};

export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {type: 1, name: "test", flag: true, weight: 1.5, id: 1}, end);
}
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) obj.type = pbf.readVarint();
    else if (tag === 2) obj.name = pbf.readString();
    else if (tag === 3) obj.flag = pbf.readBoolean();
    else if (tag === 4) obj.weight = pbf.readFloat();
    else if (tag === 5) obj.id = pbf.readVarint(true);
}
export function writeEnvelope(obj, pbf) {
    if (obj.type != null && obj.type !== 1) pbf.writeVarintField(1, obj.type);
    if (obj.name != null && obj.name !== "test") pbf.writeStringField(2, obj.name);
    if (obj.flag != null && obj.flag !== true) pbf.writeBooleanField(3, obj.flag);
    if (obj.weight != null && obj.weight !== 1.5) pbf.writeFloatField(4, obj.weight);
    if (obj.id != null && obj.id !== 1) pbf.writeVarintField(5, obj.id);
}
