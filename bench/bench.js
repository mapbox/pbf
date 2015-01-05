'use strict';

var Pbf = require('../'),
    Benchmark = require('benchmark'),
    fs = require('fs'),
    protobuf = require('protocol-buffers');

var messages = protobuf(fs.readFileSync(__dirname + '/vector_tile.proto')),
    data = fs.readFileSync(__dirname + '/../test/fixtures/12665.vector.pbf'),
    suite = new Benchmark.Suite();

var layers = readLayers(data),
    layersJSON = JSON.stringify(layers);

// var layers2 = messages.Tile.decode(data);

suite
.add('decode vector tile with pbf', function() {
    readLayers(data);
})
.add('decode vector tile with protocol-buffers', function() {
    messages.Tile.decode(data);
})
.add('native JSON.parse of the same data', function() {
    JSON.parse(layersJSON);
})
.add('encode vector tile with pbf', function() {
    encodeLayers(layers);
})
// .add('encode vector tile with protocol-buffers', function() {
//     messages.Tile.encode(layers2);
// })
.add('native JSON.stringify', function() {
    JSON.stringify(layers);
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.run();


// decoding vector tile

function readLayers(data) {
    return new Pbf(data).readFields(readTile, []);
}
function readTile(tag, layers, pbf) {
    if (tag === 3) layers.push(pbf.readMessage(readLayer, {features: [], keys: [], values: []}));
}
function readLayer(tag, layer, pbf) {
    if (tag === 1) layer.name = pbf.readString();
    else if (tag === 2) layer.features.push(pbf.readMessage(readFeature, {}));
    else if (tag === 3) layer.keys.push(pbf.readString());
    else if (tag === 4) layer.values.push(pbf.readMessage(readValue, {}).value);
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
    if (tag === 1) value.value = pbf.readString();
    else if (tag === 2) value.value = pbf.readFloat();
    else if (tag === 3) value.value = pbf.readDouble();
    else if (tag === 4) value.value = pbf.readVarint();
    else if (tag === 5) value.value = pbf.readVarint();
    else if (tag === 6) value.value = pbf.readSVarint();
    else if (tag === 7) value.value = pbf.readBoolean();
}

// encoding vector tile

function encodeLayers(layers) {
    var pbf = new Pbf();
    for (var i = 0; i < layers.length; i++) {
        pbf.writeMessage(3, encodeLayer, layers[i]);
    }
    return pbf.finish();
}
function encodeLayer(layer, pbf) {
    pbf.writeStringField(1, layer.name);

    for (var i = 0; i < layer.features.length; i++) {
        pbf.writeMessage(2, encodeFeature, layer.features[i]);
    }
    for (i = 0; i < layer.keys.length; i++) {
        pbf.writeStringField(3, layer.keys[i]);
    }
    for (i = 0; i < layer.values.length; i++) {
        pbf.writeMessage(4, encodeValue, layer.values[i]);
    }
    pbf.writeVarintField(5, layer.extent);
    pbf.writeVarintField(15, layer.version);
}
function encodeFeature(feature, pbf) {
    pbf.writeVarintField(1, feature.id);
    pbf.writePackedVarint(2, feature.tags);
    pbf.writeVarintField(3, feature.type);
    pbf.writePackedVarint(4, feature.geometry);
}
function encodeValue(value, pbf) {
    if (typeof value === 'string') pbf.writeStringField(1, value);
    else if (typeof value === 'number') {
        if (value % 1 === 0) { // integer
            if (value >= 0) pbf.writeVarintField(4, value);
            else pbf.writeSVarintField(6, value);
        } else pbf.writeDoubleField(3, value);
    } else if (typeof value === 'boolean') pbf.writeBooleanField(7, value);
}
