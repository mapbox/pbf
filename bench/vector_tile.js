'use strict';

// Tile ========================================

var Tile = exports.Tile = {};

Tile.read = function (pbf, end) {
    return pbf.readFields(Tile._readField, {layers: []}, end);
};
Tile._readField = function (tag, obj, pbf) {
    if (tag === 3) obj.layers.push(Tile.Layer.read(pbf, pbf.readVarint() + pbf.pos));
};
Tile.write = function (obj, pbf) {
    if (obj.layers !== undefined) for (var i = 0; i < obj.layers.length; i++) pbf.writeMessage(3, Tile.Layer.write, obj.layers[i]);
};

Tile.GeomType = {
    "UNKNOWN": 0,
    "POINT": 1,
    "LINESTRING": 2,
    "POLYGON": 3
};

// Tile.Value ========================================

Tile.Value = {};

Tile.Value.read = function (pbf, end) {
    return pbf.readFields(Tile.Value._readField, {}, end);
};
Tile.Value._readField = function (tag, obj, pbf) {
    if (tag === 1) obj.string_value = pbf.readString();
    else if (tag === 2) obj.float_value = pbf.readFloat();
    else if (tag === 3) obj.double_value = pbf.readDouble();
    else if (tag === 4) obj.int_value = pbf.readVarint();
    else if (tag === 5) obj.uint_value = pbf.readVarint();
    else if (tag === 6) obj.sint_value = pbf.readSVarint();
    else if (tag === 7) obj.bool_value = pbf.readBoolean();
};
Tile.Value.write = function (obj, pbf) {
    if (obj.string_value !== undefined) pbf.writeStringField(1, obj.string_value);
    if (obj.float_value !== undefined) pbf.writeFloatField(2, obj.float_value);
    if (obj.double_value !== undefined) pbf.writeDoubleField(3, obj.double_value);
    if (obj.int_value !== undefined) pbf.writeVarintField(4, obj.int_value);
    if (obj.uint_value !== undefined) pbf.writeVarintField(5, obj.uint_value);
    if (obj.sint_value !== undefined) pbf.writeSVarintField(6, obj.sint_value);
    if (obj.bool_value !== undefined) pbf.writeBooleanField(7, obj.bool_value);
};

// Tile.Feature ========================================

Tile.Feature = {};

Tile.Feature.read = function (pbf, end) {
    return pbf.readFields(Tile.Feature._readField, {type: "UNKNOWN"}, end);
};
Tile.Feature._readField = function (tag, obj, pbf) {
    if (tag === 1) obj.id = pbf.readVarint();
    else if (tag === 2) obj.tags = pbf.readPackedVarint();
    else if (tag === 3) obj.type = pbf.readVarint();
    else if (tag === 4) obj.geometry = pbf.readPackedVarint();
};
Tile.Feature.write = function (obj, pbf) {
    if (obj.id !== undefined) pbf.writeVarintField(1, obj.id);
    if (obj.tags !== undefined) pbf.writePackedVarint(2, obj.tags);
    if (obj.type !== undefined) pbf.writeVarintField(3, obj.type);
    if (obj.geometry !== undefined) pbf.writePackedVarint(4, obj.geometry);
};

// Tile.Layer ========================================

Tile.Layer = {};

Tile.Layer.read = function (pbf, end) {
    return pbf.readFields(Tile.Layer._readField, {features: [], keys: [], values: []}, end);
};
Tile.Layer._readField = function (tag, obj, pbf) {
    if (tag === 15) obj.version = pbf.readVarint();
    else if (tag === 1) obj.name = pbf.readString();
    else if (tag === 2) obj.features.push(Tile.Feature.read(pbf, pbf.readVarint() + pbf.pos));
    else if (tag === 3) obj.keys.push(pbf.readString());
    else if (tag === 4) obj.values.push(Tile.Value.read(pbf, pbf.readVarint() + pbf.pos));
    else if (tag === 5) obj.extent = pbf.readVarint();
};
Tile.Layer.write = function (obj, pbf) {
    if (obj.version !== undefined) pbf.writeVarintField(15, obj.version);
    if (obj.name !== undefined) pbf.writeStringField(1, obj.name);
    if (obj.features !== undefined) for (var i = 0; i < obj.features.length; i++) pbf.writeMessage(2, Tile.Feature.write, obj.features[i]);
    if (obj.keys !== undefined) for (i = 0; i < obj.keys.length; i++) pbf.writeStringField(3, obj.keys[i]);
    if (obj.values !== undefined) for (i = 0; i < obj.values.length; i++) pbf.writeMessage(4, Tile.Value.write, obj.values[i]);
    if (obj.extent !== undefined) pbf.writeVarintField(5, obj.extent);
};
