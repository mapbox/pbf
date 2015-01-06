'use strict';

var Pbf = require('../'),
    Benchmark = require('benchmark'),
    fs = require('fs'),
    protobuf = require('protocol-buffers');

var Tile = protobuf(fs.readFileSync(__dirname + '/vector_tile.proto')).Tile,
    data = fs.readFileSync(__dirname + '/../test/fixtures/12665.vector.pbf'),
    suite = new Benchmark.Suite();

var layers = read(data),
    layersJSON = JSON.stringify(layers),
    layers2 = Tile.decode(data);

suite
.add('decode vector tile with pbf', function() {
    read(data);
})
.add('encode vector tile with pbf', function() {
    write(layers);
})
.add('decode vector tile with protocol-buffers', function() {
    Tile.decode(data);
})
.add('encode vector tile with protocol-buffers', function() {
    Tile.encode(layers2);
})
.add('JSON.parse vector tile', function() {
    JSON.parse(layersJSON);
})
.add('JSON.stringify vector tile', function() {
    JSON.stringify(layers);
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.run();


// decoding vector tile

function read(data) {
    return new Pbf(data).readFields(readTile, []);
}
function readTile(tag, layers, pbf) {
    if (tag === 3) layers.push(pbf.readMessage(readLayer, {features: [], keys: [], values: []}));
}
function readLayer(tag, layer, pbf) {
    if (tag === 1) layer.name = pbf.readString();
    else if (tag === 2) layer.features.push(pbf.readMessage(readFeature, {}));
    else if (tag === 3) layer.keys.push(pbf.readString());
    else if (tag === 4) layer.values.push(pbf.readMessage(readValue, {}));
    else if (tag === 5) layer.extent = pbf.readVarint();
    else if (tag === 15) layer.version = pbf.readVarint();
}
function readFeature(tag, feature, pbf) {
    if (tag === 1) feature.id = pbf.readVarint();
    else if (tag === 2) feature.tags = pbf.readPackedVarint();
    else if (tag === 3) feature.type = pbf.readVarint();
    else if (tag === 4) feature.geometry = pbf.readPackedVarint();
}
function readValue(tag, value, pbf) {
    if (tag === 1) value.string_value = pbf.readString();
    else if (tag === 2) value.float_value = pbf.readFloat();
    else if (tag === 3) value.double_value = pbf.readDouble();
    else if (tag === 4) value.int_value = pbf.readVarint();
    else if (tag === 5) value.uint_value = pbf.readVarint();
    else if (tag === 6) value.sint_value = pbf.readSVarint();
    else if (tag === 7) value.bool_value = pbf.readBoolean();
}

// encoding vector tile

function write(layers) {
    var pbf = new Pbf();
    for (var i = 0; i < layers.length; i++) pbf.writeMessage(3, writeLayer, layers[i]);
    return pbf.finish();
}
function writeLayer(layer, pbf) {
    pbf.writeStringField(1, layer.name);
    var i;
    for (i = 0; i < layer.features.length; i++) pbf.writeMessage(2, writeFeature, layer.features[i]);
    for (i = 0; i < layer.keys.length; i++) pbf.writeStringField(3, layer.keys[i]);
    for (i = 0; i < layer.values.length; i++) pbf.writeMessage(4, writeValue, layer.values[i]);
    pbf.writeVarintField(5, layer.extent);
    pbf.writeVarintField(15, layer.version);
}
function writeFeature(feature, pbf) {
    pbf.writeVarintField(1, feature.id);
    pbf.writePackedVarint(2, feature.tags);
    pbf.writeVarintField(3, feature.type);
    pbf.writePackedVarint(4, feature.geometry);
}
function writeValue(value, pbf) {
    if (value.string_value !== undefined) pbf.writeString(value.string_value);
    else if (value.float_value !== undefined) pbf.writeFloat(value.float_value);
    else if (value.double_value !== undefined) pbf.writeDouble(value.double_value);
    else if (value.int_value !== undefined) pbf.writeVarint(value.int_value);
    else if (value.uint_value !== undefined) pbf.writeVarint(value.uint_value);
    else if (value.sint_value !== undefined) pbf.writeSVarint(value.sint_value);
    else if (value.bool_value !== undefined) pbf.writeBoolean(value.bool_value);
}
