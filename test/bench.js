'use strict';

var Pbf = require('../'),
    Benchmark = require('benchmark'),
    fs = require('fs');

var protobuf = require('protocol-buffers'),
    messages = protobuf(fs.readFileSync('../vector-tile-js/proto/vector_tile.proto'));

var suite = new Benchmark.Suite(),
    data = fs.readFileSync(__dirname + '/fixtures/12665.vector.pbf');

var layersJSON = JSON.stringify(readData(data));

suite
.add('decode vector tile with pbf', function() {
    readData(data);
})
.add('decode vector tile with protocol-buffers', function() {
    messages.tile.decode(data);
})
.add('native JSON.parse of the same data', function() {
    JSON.parse(layersJSON);
})
.add('write varints', function () {
    var buf = new Pbf(new Buffer(16));
    for (var i = 1; i <= 30; i++) {
        buf.writeVarint(1 << i);
    }
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.run();

function readData(data) {
    return new Pbf(data).readFields(readTile, []);
}

function readTile(tag, layers, pbf) {
    if (tag === 3) layers.push(pbf.readMessage(readLayer, {features: [], keys: [], values: []}));
}

function readLayer(tag, layer, pbf) {
    if (tag === 15) layer.version = pbf.readVarint();
    else if (tag === 1) layer.name = pbf.readString();
    else if (tag === 2) layer.features.push(pbf.readMessage(readFeature, {}));
    else if (tag === 3) layer.keys.push(pbf.readString());
    else if (tag === 4) layer.values.push(pbf.readMessage(readValue, {}).value);
    else if (tag === 5) layer.extent = pbf.readVarint() || 4096;
}

function readFeature(tag, feature, pbf) {
    if (tag === 1) feature.id = pbf.readVarint();
    else if (tag === 2) feature.tags = pbf.readPacked('Varint');
    else if (tag === 3) feature.type = pbf.readVarint();
    else if (tag === 4) feature.geometry = pbf.readPacked('Varint');
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
