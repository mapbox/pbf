
export function readEnvelope(pbf, end = pbf.length) {
    const obj = {kv: {}, kn: {}, sibling: undefined, flag: 0};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) { const {key, value} = readEnvelopeKvEntry$(pbf, pbf.readVarint() + pbf.pos); obj.kv[key] = value; }
        else if (field === 2) { const {key, value} = readEnvelopeKnEntry$(pbf, pbf.readVarint() + pbf.pos); obj.kn[key] = value; }
        else if (field === 3) obj.sibling = readEnvelopeKvEntry(pbf, pbf.readVarint() + pbf.pos);
        else if (field === 4) obj.flag = pbf.readVarint();
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.kv) for (const key of Object.keys(obj.kv)) pbf.writeMessage(1, writeEnvelopeKvEntry$, {key, value: obj.kv[key]});
    if (obj.kn) for (const key of Object.keys(obj.kn)) pbf.writeMessage(2, writeEnvelopeKnEntry$, {key, value: obj.kn[key]});
    if (obj.sibling) pbf.writeMessage(3, writeEnvelopeKvEntry, obj.sibling);
    if (obj.flag) pbf.writeVarintField(4, obj.flag);
}

export const EnvelopeKnEntry = {
    "ZERO": 0,
    "ONE": 1
};

export function readEnvelopeKvEntry(pbf, end = pbf.length) {
    const obj = {marker: 0};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) obj.marker = pbf.readVarint(true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelopeKvEntry(obj, pbf) {
    if (obj.marker) pbf.writeVarintField(1, obj.marker);
}

export function readEnvelopeKvEntry$(pbf, end = pbf.length) {
    const obj = {key: "", value: ""};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) obj.key = pbf.readString();
        else if (field === 2) obj.value = pbf.readString();
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelopeKvEntry$(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeStringField(2, obj.value);
}

export function readEnvelopeKnEntry$(pbf, end = pbf.length) {
    const obj = {key: "", value: 0};
    while (pbf.pos < end) {
        const tag = pbf.readVarint(), field = tag >>> 3;
        if (field === 1) obj.key = pbf.readString();
        else if (field === 2) obj.value = pbf.readVarint(true);
        else pbf.skip(tag);
    }
    return obj;
}
export function writeEnvelopeKnEntry$(obj, pbf) {
    if (obj.key) pbf.writeStringField(1, obj.key);
    if (obj.value) pbf.writeVarintField(2, obj.value);
}
