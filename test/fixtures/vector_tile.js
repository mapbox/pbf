
export function readTile(pbf, end) {
    return pbf.readFields(readTileField, {layers: []}, end);
}
function readTileField(tag, obj, pbf) {
    if (tag === 3) obj.layers.push(readTileLayer(pbf, pbf.readVarint() + pbf.pos));
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
    return pbf.readFields(readTileValueField, {string_value: "", float_value: 0, double_value: 0, int_value: 0, uint_value: 0, sint_value: 0, bool_value: false}, end);
}
function readTileValueField(tag, obj, pbf) {
    if (tag === 1) obj.string_value = pbf.readString();
    else if (tag === 2) obj.float_value = pbf.readFloat();
    else if (tag === 3) obj.double_value = pbf.readDouble();
    else if (tag === 4) obj.int_value = pbf.readVarint(true);
    else if (tag === 5) obj.uint_value = pbf.readVarint();
    else if (tag === 6) obj.sint_value = pbf.readSVarint();
    else if (tag === 7) obj.bool_value = pbf.readBoolean();
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
    return pbf.readFields(readTileFeatureField, {id: 0, tags: [], type: 0, geometry: []}, end);
}
function readTileFeatureField(tag, obj, pbf) {
    if (tag === 1) obj.id = pbf.readVarint();
    else if (tag === 2) pbf.readPackedVarint(obj.tags);
    else if (tag === 3) obj.type = pbf.readVarint();
    else if (tag === 4) pbf.readPackedVarint(obj.geometry);
}
export function writeTileFeature(obj, pbf) {
    if (obj.id) pbf.writeVarintField(1, obj.id);
    if (obj.tags) pbf.writePackedVarint(2, obj.tags);
    if (obj.type) pbf.writeVarintField(3, obj.type);
    if (obj.geometry) pbf.writePackedVarint(4, obj.geometry);
}

export function readTileLayer(pbf, end) {
    return pbf.readFields(readTileLayerField, {version: 1, name: "", features: [], keys: [], values: [], extent: 4096}, end);
}
function readTileLayerField(tag, obj, pbf) {
    if (tag === 15) obj.version = pbf.readVarint();
    else if (tag === 1) obj.name = pbf.readString();
    else if (tag === 2) obj.features.push(readTileFeature(pbf, pbf.readVarint() + pbf.pos));
    else if (tag === 3) obj.keys.push(pbf.readString());
    else if (tag === 4) obj.values.push(readTileValue(pbf, pbf.readVarint() + pbf.pos));
    else if (tag === 5) obj.extent = pbf.readVarint();
}
export function writeTileLayer(obj, pbf) {
    if (obj.version != null && obj.version !== 1) pbf.writeVarintField(15, obj.version);
    if (obj.name) pbf.writeStringField(1, obj.name);
    if (obj.features) for (const item of obj.features) pbf.writeMessage(2, writeTileFeature, item);
    if (obj.keys) for (const item of obj.keys) pbf.writeStringField(3, item);
    if (obj.values) for (const item of obj.values) pbf.writeMessage(4, writeTileValue, item);
    if (obj.extent != null && obj.extent !== 4096) pbf.writeVarintField(5, obj.extent);
}
