# pbf

[![build status](https://secure.travis-ci.org/mapbox/pbf.png)](http://travis-ci.org/mapbox/pbf) [![Coverage Status](https://coveralls.io/repos/mapbox/pbf/badge.png)](https://coveralls.io/r/mapbox/pbf)

A low-level, lightweight [protocol buffers](http://code.google.com/p/protobuf/) implementation in JavaScript for Node and browsers.

Designed to be a building block for writing a very customized, lazy decoder for a stable protobuf schema.
If you need an easy-to-use, all-purpose protobuf JS library,
use [protocol-buffers](https://github.com/mafintosh/protocol-buffers) instead.

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
