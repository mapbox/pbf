var Pbf = require('../'),
    test = require('tape').test;


test('initialization', function(t) {
    t.plan(1);

    t.doesNotThrow(function() {
        var buf = new Pbf(new Buffer([]));
        buf.destroy();
    }, 'Basic initialization');
});
