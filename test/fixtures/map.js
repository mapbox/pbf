
export function readEnvelope(pbf, end = pbf.length) {
    const obj = {kv: {}, kn: {}};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) { const {key, value} = readEnvelope_FieldEntry1(pbf, pbf.readVarint() + pbf.pos); obj.kv[key] = value; }
        else if (field === 2) { const {key, value} = readEnvelope_FieldEntry2(pbf, pbf.readVarint() + pbf.pos); obj.kn[key] = value; }
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.kv) for (const key of Object.keys(obj.kv)) pbf.writeMessage(1, writeEnvelope_FieldEntry1, {key, value: obj.kv[key]});
    if (obj.kn) for (const key of Object.keys(obj.kn)) pbf.writeMessage(2, writeEnvelope_FieldEntry2, {key, value: obj.kn[key]});
}

export function readEnvelope_FieldEntry1(pbf, end = pbf.length) {
    const obj = {key: "", value: ""};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) obj.key = pbf.readString();
        else if (field === 2) obj.value = pbf.readString();
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelope_FieldEntry1(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeStringField(2, obj.value);
}

export function readEnvelope_FieldEntry2(pbf, end = pbf.length) {
    const obj = {key: "", value: 0};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) obj.key = pbf.readString();
        else if (field === 2) obj.value = pbf.readVarint(true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelope_FieldEntry2(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeVarintField(2, obj.value);
}
