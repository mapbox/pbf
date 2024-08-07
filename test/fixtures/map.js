
export function readEnvelope(pbf, end) {
    return pbf.readFields(readEnvelopeField, {kv: {}, kn: {}}, end);
}
function readEnvelopeField(tag, obj, pbf) {
    if (tag === 1) { const {key, value} = readEnvelope_FieldEntry1(pbf, pbf.readVarint() + pbf.pos); obj.kv[key] = value; }
    else if (tag === 2) { const {key, value} = readEnvelope_FieldEntry2(pbf, pbf.readVarint() + pbf.pos); obj.kn[key] = value; }
}
export function writeEnvelope(obj, pbf) {
    if (obj.kv) for (const key of Object.keys(obj.kv)) pbf.writeMessage(1, writeEnvelope_FieldEntry1, {key, value: obj.kv[key]});
    if (obj.kn) for (const key of Object.keys(obj.kn)) pbf.writeMessage(2, writeEnvelope_FieldEntry2, {key, value: obj.kn[key]});
}

export function readEnvelope_FieldEntry1(pbf, end) {
    return pbf.readFields(readEnvelope_FieldEntry1Field, {key: "", value: ""}, end);
}
function readEnvelope_FieldEntry1Field(tag, obj, pbf) {
    if (tag === 1) obj.key = pbf.readString();
    else if (tag === 2) obj.value = pbf.readString();
}
export function writeEnvelope_FieldEntry1(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeStringField(2, obj.value);
}

export function readEnvelope_FieldEntry2(pbf, end) {
    return pbf.readFields(readEnvelope_FieldEntry2Field, {key: "", value: 0}, end);
}
function readEnvelope_FieldEntry2Field(tag, obj, pbf) {
    if (tag === 1) obj.key = pbf.readString();
    else if (tag === 2) obj.value = pbf.readVarint(true);
}
export function writeEnvelope_FieldEntry2(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeVarintField(2, obj.value);
}
