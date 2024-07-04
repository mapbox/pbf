
export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {int: 0, uint: 0, long: 0, ulong: 0}, end);
}
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) obj.int = pbf.readVarint(true);
    else if (tag === 2) obj.uint = pbf.readVarint();
    else if (tag === 3) obj.long = pbf.readVarint(true);
    else if (tag === 4) obj.ulong = pbf.readVarint();
}
export function writeEnvelope(obj, pbf) {
    if (obj.int) pbf.writeVarintField(1, obj.int);
    if (obj.uint) pbf.writeVarintField(2, obj.uint);
    if (obj.long) pbf.writeVarintField(3, obj.long);
    if (obj.ulong) pbf.writeVarintField(4, obj.ulong);
}
