
export function readTile(pbf, end) {
    const obj = {layers: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 3) obj.layers.push(readTileLayer(pbf, pbf.readVarint() + pbf.pos));
    }
    return obj;
}
export function writeTile(obj, pbf) {
    if (obj.layers) for (const item of obj.layers) pbf.writeMessage(3, writeTileLayer, item);
}

export const TileGeomType = {
    "UNKNOWN": 0,
    "POINT": 1,
    "LINESTRING": 2,
    "POLYGON": 3
};

export function readTileValue(pbf, end) {
    const obj = {string_value: "", float_value: 0, double_value: 0, int_value: 0, uint_value: 0, sint_value: 0, bool_value: false};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.string_value = pbf.readString();
        else if (field === 2) obj.float_value = pbf.readFloat();
        else if (field === 3) obj.double_value = pbf.readDouble();
        else if (field === 4) obj.int_value = pbf.readVarint(true);
        else if (field === 5) obj.uint_value = pbf.readVarint();
        else if (field === 6) obj.sint_value = pbf.readSVarint();
        else if (field === 7) obj.bool_value = pbf.readBoolean();
    }
    return obj;
}
export function writeTileValue(obj, pbf) {
    if (obj.string_value) pbf.writeStringField(1, obj.string_value);
    if (obj.float_value) pbf.writeFloatField(2, obj.float_value);
    if (obj.double_value) pbf.writeDoubleField(3, obj.double_value);
    if (obj.int_value) pbf.writeVarintField(4, obj.int_value);
    if (obj.uint_value) pbf.writeVarintField(5, obj.uint_value);
    if (obj.sint_value) pbf.writeSVarintField(6, obj.sint_value);
    if (obj.bool_value) pbf.writeBooleanField(7, obj.bool_value);
}

export function readTileFeature(pbf, end) {
    const obj = {id: 0, tags: [], type: 0, geometry: []};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) obj.id = pbf.readVarint();
        else if (field === 2) pbf.readPackedVarint(obj.tags);
        else if (field === 3) obj.type = pbf.readVarint();
        else if (field === 4) pbf.readPackedVarint(obj.geometry);
    }
    return obj;
}
export function writeTileFeature(obj, pbf) {
    if (obj.id) pbf.writeVarintField(1, obj.id);
    if (obj.tags) pbf.writePackedVarint(2, obj.tags);
    if (obj.type) pbf.writeVarintField(3, obj.type);
    if (obj.geometry) pbf.writePackedVarint(4, obj.geometry);
}

export function readTileLayer(pbf, end) {
    const obj = {version: 1, name: "", features: [], keys: [], values: [], extent: 4096};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 15) obj.version = pbf.readVarint();
        else if (field === 1) obj.name = pbf.readString();
        else if (field === 2) obj.features.push(readTileFeature(pbf, pbf.readVarint() + pbf.pos));
        else if (field === 3) obj.keys.push(pbf.readString());
        else if (field === 4) obj.values.push(readTileValue(pbf, pbf.readVarint() + pbf.pos));
        else if (field === 5) obj.extent = pbf.readVarint();
    }
    return obj;
}
export function writeTileLayer(obj, pbf) {
    if (obj.version != null && obj.version !== 1) pbf.writeVarintField(15, obj.version);
    if (obj.name) pbf.writeStringField(1, obj.name);
    if (obj.features) for (const item of obj.features) pbf.writeMessage(2, writeTileFeature, item);
    if (obj.keys) for (const item of obj.keys) pbf.writeStringField(3, item);
    if (obj.values) for (const item of obj.values) pbf.writeMessage(4, writeTileValue, item);
    if (obj.extent != null && obj.extent !== 4096) pbf.writeVarintField(5, obj.extent);
}
