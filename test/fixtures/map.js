
export function readEnvelope(pbf, end = pbf.length) {
    const obj = {kv: {}, kn: {}};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) { const {key, value} = readEnvelopeKvEntry(pbf, pbf.readVarint() + pbf.pos); obj.kv[key] = value; }
        else if (field === 2) { const {key, value} = readEnvelopeKnEntry(pbf, pbf.readVarint() + pbf.pos); obj.kn[key] = value; }
        else pbf.skipField();
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.kv) for (const key of Object.keys(obj.kv)) pbf.writeMessage(1, writeEnvelopeKvEntry, {key, value: obj.kv[key]});
    if (obj.kn) for (const key of Object.keys(obj.kn)) pbf.writeMessage(2, writeEnvelopeKnEntry, {key, value: obj.kn[key]});
}

export function readEnvelopeKvEntry(pbf, end = pbf.length) {
    const obj = {key: "", value: ""};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.key = pbf.readString();
        else if (field === 2) obj.value = pbf.readString();
        else pbf.skipField();
    }
    return obj;
}
export function writeEnvelopeKvEntry(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeStringField(2, obj.value);
}

export function readEnvelopeKnEntry(pbf, end = pbf.length) {
    const obj = {key: "", value: 0};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.key = pbf.readString();
        else if (field === 2) obj.value = pbf.readVarint(true);
        else pbf.skipField();
    }
    return obj;
}
export function writeEnvelopeKnEntry(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeVarintField(2, obj.value);
}
