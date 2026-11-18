
export function readEnvelope(pbf, end) {
    const obj = {payload: undefined, absolute_payload: undefined, inner: undefined};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.payload = readAny(pbf, pbf.readVarint() + pbf.pos);
        else if (field === 2) obj.absolute_payload = readAny(pbf, pbf.readVarint() + pbf.pos);
        else if (field === 3) obj.inner = readEnvelopeInner(pbf, pbf.readVarint() + pbf.pos);
    }
    return obj;
}
export function writeEnvelope(obj, pbf) {
    if (obj.payload) pbf.writeMessage(1, writeAny, obj.payload);
    if (obj.absolute_payload) pbf.writeMessage(2, writeAny, obj.absolute_payload);
    if (obj.inner) pbf.writeMessage(3, writeEnvelopeInner, obj.inner);
}

export function readEnvelopeInner(pbf, end) {
    const obj = {value: ""};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.value = pbf.readString();
    }
    return obj;
}
export function writeEnvelopeInner(obj, pbf) {
    if (obj.value) pbf.writeStringField(1, obj.value);
}

export function readAny(pbf, end) {
    const obj = {type_url: "", value: undefined};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.type_url = pbf.readString();
        else if (field === 2) obj.value = pbf.readBytes();
    }
    return obj;
}
export function writeAny(obj, pbf) {
    if (obj.type_url) pbf.writeStringField(1, obj.type_url);
    if (obj.value != null) pbf.writeBytesField(2, obj.value);
}
