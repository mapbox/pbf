var Pbf = require('../'),
    VectorTile = require('vector-tile').VectorTile,
    Benchmark = require('benchmark'),
    fs = require('fs');

var suite = new Benchmark.Suite(),
    data = fs.readFileSync(__dirname + '/fixtures/12665.vector.pbf');

readTile(); // output any errors before running the suite
readTile(false, true);

suite
.add('read tile with geometries', function() {
    readTile(true);
})
.add('read tile without geometries', function() {
    readTile();
})
.add('read tile with packed geometries load', function() {
    readTile(false, true);
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


function readTile(loadGeom, loadPacked) {
    var buf = new Pbf(data),
        vt = new VectorTile(buf);

    for (var id in vt.layers) {
        var layer = vt.layers[id];
        for (var i = 0; i < layer.length; i++) {
            var feature = layer.feature(i);
            if (loadGeom) feature.loadGeometry();
            if (loadPacked) {
                buf.pos = feature._geometry;
                buf.readPacked('SVarint');
            }
        }
    }
}
