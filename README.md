# pbf

[![build status](https://secure.travis-ci.org/mapbox/pbf.png)](http://travis-ci.org/mapbox/pbf) [![Coverage Status](https://coveralls.io/repos/mapbox/pbf/badge.png)](https://coveralls.io/r/mapbox/pbf)

A low-level, lightweight [protocol buffers](http://code.google.com/p/protobuf/) implementation in JavaScript for Node and browsers.

Designed to be a building block for writing a very customized, lazy decoder for a stable protobuf schema.
If you need an easy-to-use, all-purpose protobuf JS library,
use [protocol-buffers](https://github.com/mafintosh/protocol-buffers) instead.

## install

    npm install pbf

## example

```js
var Pbf = require('pbf');
var pbf = new Pbf(buffer);


while (pbf.pos < pbf.length) {
    var val = pbf.readVarint(),
        tag = val >> 3,
        name, version;

    if (tag === 1) name = pbf.readString();
    else if (tag === 2) version = pbf.readVarint();
    else pbf.skip(val);
}
```

## API

Create a buffer:

```js
var pbf = Protobuf(/*Buffer*/ buf);
```

Get buffer length:

```js
pbf.length;
```

#### Reading

Read values:

```js
var value = pbf.readVarint();
var packed = pbf.readPacked('UInt32');
```

Reading methods:

* readVarint()
* readSVarint()
* readUInt32()
* readUInt64()
* readDouble()
* readString()
* readBuffer()
* readPacked(type)
* skip(value)

#### Writing

Write values:

```js
pbf.writeVarint(123);
pbf.writeString("Hello world");
```

Writing methods:

* writeTaggedVarint(tag, val)
* writeTaggedSVarint(tag, val)
* writeTaggedUInt32(tag, val)
* writeTaggedUInt64(tag, val)
* writeTaggedBoolean(tag, val)
* writeTaggedFloat(tag, val)
* writeTaggedDouble(tag, val)
* writeTaggedString(tag, val)
* writeTaggedBuffer(tag, buffer)
* writePacked(type, tag, items)
* writeVarint(val)
* writeSVarint(val)
* writeUInt32(val)
* writeUInt64(val)
* writeFloat(val)
* writeDouble(val)
* writeString(val)
* writeBuffer(buffer)
* writeMessage(tag, pbf)

Misc methods:

* realloc(minBytes) - pad the underlying buffer size to accommodate the given number of bytes (at least)
* finish() - return the buffer slice with the exact data length

For an example of a real-world usage of the library, see [vector-tile-js](https://github.com/mapbox/vector-tile-js).
