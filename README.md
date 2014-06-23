# pbf

[![build status](https://secure.travis-ci.org/mapbox/pbf.png)](http://travis-ci.org/mapbox/pbf) [![Coverage Status](https://coveralls.io/repos/mapbox/pbf/badge.png)](https://coveralls.io/r/mapbox/pbf)

A [protocol buffers](http://code.google.com/p/protobuf/) implementation in
JavaScript for node and browsers.

## install

    npm install pbf

## api

### `Protobuf(buf, pos)`

```js
var Pbf = require('pbf');
var protobuffer = new Pbf(buffer);
var varInt = protobuffer.readVarInt();
```

Reading

* readUInt32
* readUInt32LE
* readUInt64
* readUInt64LE
* readDouble
* readDoubleLE
* readVarint
* readSVarint
* readString
* readPacked
