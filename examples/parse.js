'use strict';

var pbf = require('pbf');

var data = null /* ... */;

var buffer = new pbf(data);

var val, tag;
while (buffer.pos < buffer.length) {
    val = buffer.readVarint();
    tag = val >> 3;

    if (tag == 1) { // Matches the numbers assigned in the .proto file
        buffer.readVarint();
    } else if (tag == 2) {
        buffer.readPacked('Varint');
    } else if (tag == 3) {
        buffer.readString();
    } else {
        buffer.skip(val);
    }
}
