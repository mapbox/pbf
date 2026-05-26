
export function readEmbeddedType(pbf, end) {
    const obj = {value: "test", sub_field: undefined, sub_sub_field: undefined};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.value = pbf.readString();
        else if (field === 4) obj.sub_field = readEmbeddedTypeContainer(pbf, pbf.readVarint() + pbf.pos);
        else if (field === 5) obj.sub_sub_field = readEmbeddedTypeContainerInner(pbf, pbf.readVarint() + pbf.pos);
    }
    return obj;
}
export function writeEmbeddedType(obj, pbf) {
    if (obj.value != null && obj.value !== "test") pbf.writeStringField(1, obj.value);
    if (obj.sub_field) pbf.writeMessage(4, writeEmbeddedTypeContainer, obj.sub_field);
    if (obj.sub_sub_field) pbf.writeMessage(5, writeEmbeddedTypeContainerInner, obj.sub_sub_field);
}

export function readEmbeddedTypeContainer(pbf, end) {
    const obj = {values: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.values.push(readEmbeddedTypeContainerInner(pbf, pbf.readVarint() + pbf.pos));
    }
    return obj;
}
export function writeEmbeddedTypeContainer(obj, pbf) {
    if (obj.values) for (const item of obj.values) pbf.writeMessage(1, writeEmbeddedTypeContainerInner, item);
}

export function readEmbeddedTypeContainerInner(pbf, end) {
    const obj = {value: ""};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.value = pbf.readString();
    }
    return obj;
}
export function writeEmbeddedTypeContainerInner(obj, pbf) {
    if (obj.value) pbf.writeStringField(1, obj.value);
}
