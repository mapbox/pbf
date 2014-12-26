# pbf

[![build status](https://secure.travis-ci.org/mapbox/pbf.png)](http://travis-ci.org/mapbox/pbf) [![Coverage Status](https://coveralls.io/repos/mapbox/pbf/badge.png)](https://coveralls.io/r/mapbox/pbf)

A low-level, ultra-lightweight (2.9KB gzipped) [protocol buffers](https://developers.google.com/protocol-buffers) implementation in JavaScript for browsers and Node.

Designed to be a building block for writing a customized, lazy decoder for a stable protobuf schema.
If you need an all-purpose protobuf JS library that does most of the work for you,
take a look at [protocol-buffers](https://github.com/mafintosh/protocol-buffers).

## Install

Node and Browserify:

```bash
npm install pbf
```

Making a browser build:

```bash
npm install
npm run build-dev # pbf-dev.js (development build)
npm run build-min # pbf.js (minified production build)
```

## Example

#### Reading

```js
var pbf = new Pbf(buffer),
    name, version, layerName;

pbf.readFields(function(tag) {
    if (tag === 1) name = pbf.readString();
    else if (tag === 2) version = pbf.readVarint();
    else if (tag === 3) {
        pbf.readMessage(function(tag) {
            if (tag === 1) layerName = pbf.readString();
        });
    }
    return result;
});
```

#### Writing

```js
var pbf = new Pbf();

pbf.writeStringField(1, 'Hello world');
pbf.writeVarintField(2, 300);

var layer = new Pbf();
layer.writeStringField(1, 'foobar');

pbf.writeMessage(3, layer);

var buffer = pbf.finish();
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

Read a sequence of fields:

```js
pbf.readFields(function (tag) {
    if (tag === 1) pbf.readVarint();
    else if (tag === 2) pbf.readString();
    else ...
});
```

To read an embedded message, use `pbf.readMessage(fn)` (in the same way as `read`).

Read values:

```js
var value = pbf.readVarint();
var packed = pbf.readPacked('UInt32');
```

Basic reading methods:

* `readVarint()`
* `readSVarint()`
* `readFixed32()`
* `readFixed64()`
* `readSFixed32()`
* `readSFixed64()`
* `readBoolean()`
* `readFloat()`
* `readDouble()`
* `readString()`
* `readBytes()`
* `readPacked(type)`
* `skip(value)`

#### Writing

Write values:

```js
pbf.writeVarint(123);
pbf.writeString("Hello world");
```

Field writing methods:

* `writeVarintField(tag, val)`
* `writeSVarintField(tag, val)`
* `writeFixed32Field(tag, val)`
* `writeFixed64Field(tag, val)`
* `writeSFixed32Field(tag, val)`
* `writeSFixed64Field(tag, val)`
* `writeBooleanField(tag, val)`
* `writeFloatField(tag, val)`
* `writeDoubleField(tag, val)`
* `writeStringField(tag, val)`
* `writeBytesField(tag, buffer)`
* `writePacked(tag, type, items)`
* `writeMessage(tag, pbf)`

Scalar writing methods:

* `writeVarint(val)`
* `writeSVarint(val)`
* `writeSFixed32(val)`
* `writeSFixed64(val)`
* `writeFloat(val)`
* `writeDouble(val)`
* `writeString(val)`
* `writeBytes(buffer)`

Misc methods:

* `realloc(minBytes)` - pad the underlying buffer size to accommodate the given number of bytes
* `finish()` - make the current buffer ready for reading and return the data as a buffer slice
* `destroy()` - dispose the buffer

For an example of a real-world usage of the library, see [vector-tile-js](https://github.com/mapbox/vector-tile-js).
