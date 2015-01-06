'use strict';

if (typeof exports !== 'undefined') {
    exports.readTile = readTile;
    exports.writeTile = writeTile;
}

// decoding vector tile

function readTile(pbf) {
    return pbf.readFields(readTileField, {layers: []});
}
function readTileField(tag, tile, pbf) {
    if (tag === 3) tile.layers.push(pbf.readMessage(readLayerField, {features: [], keys: [], values: []}));
}
function readLayerField(tag, layer, pbf) {
    if (tag === 1) layer.name = pbf.readString();
    else if (tag === 2) layer.features.push(pbf.readMessage(readFeatureField, {}));
    else if (tag === 3) layer.keys.push(pbf.readString());
    else if (tag === 4) layer.values.push(pbf.readMessage(readValueField, {}));
    else if (tag === 5) layer.extent = pbf.readVarint();
    else if (tag === 15) layer.version = pbf.readVarint();
}
function readFeatureField(tag, feature, pbf) {
    if (tag === 1) feature.id = pbf.readVarint();
    else if (tag === 2) feature.tags = pbf.readPackedVarint();
    else if (tag === 3) feature.type = pbf.readVarint();
    else if (tag === 4) feature.geometry = pbf.readPackedVarint();
}
function readValueField(tag, value, pbf) {
    if (tag === 1) value.string_value = pbf.readString();
    else if (tag === 2) value.float_value = pbf.readFloat();
    else if (tag === 3) value.double_value = pbf.readDouble();
    else if (tag === 4) value.int_value = pbf.readVarint();
    else if (tag === 5) value.uint_value = pbf.readVarint();
    else if (tag === 6) value.sint_value = pbf.readSVarint();
    else if (tag === 7) value.bool_value = pbf.readBoolean();
}

// encoding vector tile

function writeTile(tile, pbf) {
    if (tile.layers !== undefined) for (var i = 0; i < tile.layers.length; i++) pbf.writeMessage(3, writeLayer, tile.layers[i]);
}
function writeLayer(layer, pbf) {
    if (layer.name !== undefined) pbf.writeStringField(1, layer.name);
    var i;
    if (layer.features !== undefined) for (i = 0; i < layer.features.length; i++) pbf.writeMessage(2, writeFeature, layer.features[i]);
    if (layer.keys !== undefined) for (i = 0; i < layer.keys.length; i++) pbf.writeStringField(3, layer.keys[i]);
    if (layer.values !== undefined) for (i = 0; i < layer.values.length; i++) pbf.writeMessage(4, writeValue, layer.values[i]);
    if (layer.extent !== undefined) pbf.writeVarintField(5, layer.extent);
    if (layer.version !== undefined) pbf.writeVarintField(15, layer.version);
}
function writeFeature(feature, pbf) {
    if (feature.id !== undefined) pbf.writeVarintField(1, feature.id);
    if (feature.tags !== undefined) pbf.writePackedVarint(2, feature.tags);
    if (feature.type !== undefined) pbf.writeVarintField(3, feature.type);
    if (feature.geometry !== undefined) pbf.writePackedVarint(4, feature.geometry);
}
function writeValue(value, pbf) {
    if (value.string_value !== undefined) pbf.writeStringField(1, value.string_value);
    if (value.float_value !== undefined) pbf.writeFloatField(2, value.float_value);
    if (value.double_value !== undefined) pbf.writeDoubleField(3, value.double_value);
    if (value.int_value !== undefined) pbf.writeVarintField(4, value.int_value);
    if (value.uint_value !== undefined) pbf.writeVarintField(5, value.uint_value);
    if (value.sint_value !== undefined) pbf.writeSVarintField(6, value.sint_value);
    if (value.bool_value !== undefined) pbf.writeBooleanField(7, value.bool_value);
}
