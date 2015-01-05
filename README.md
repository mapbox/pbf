# pbf

[![build status](https://secure.travis-ci.org/mapbox/pbf.png)](http://travis-ci.org/mapbox/pbf) [![Coverage Status](https://coveralls.io/repos/mapbox/pbf/badge.png)](https://coveralls.io/r/mapbox/pbf)

A low-level, fast, ultra-lightweight (3KB gzipped) JavaScript library for decoding and encoding [protocol buffers](https://developers.google.com/protocol-buffers) (a compact binary format for structured data serialization).

Designed to be a building block for writing customized decoders and encoders for a stable protobuf schema.
If you need an all-purpose protobuf JS library that does most of the work for you,
take a look at [protocol-buffers](https://github.com/mafintosh/protocol-buffers).

## Example

#### Reading

```js
var pbf = new Pbf(buffer),
    name, version, layerName;

pbf.readFields(function(tag) {
    if (tag === 1) name = pbf.readString();
    else if (tag === 2) version = pbf.readVarint();
    else if (tag === 3) pbf.readMessage(function(tag) {
        if (tag === 1) layerName = pbf.readString();
    });
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

## API

Create a Protobuf object, optionally given a `Buffer` as input data (or `Uint8Array` in browsers):

```js
var pbf = Protobuf(/*Buffer or Uint8Array*/ buf);
```

Protobuf object properties:

```js
pbf.length; // length of the underlying buffer
pbf.pos; // current offset for reading or writing
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

It optionally accepts an object that will be passed to the reading function for easier construction of decoded data,
and also passes the Protobuf object as a third argument:

```js
var result = pbf.readFields(callback, {})

function callback(tag, result, pbf) {
    if (tag === 1) result.id = pbf.readVarint();
}
```

To read an embedded message, use `pbf.readMessage(fn[, obj])` (in the same way as `read`).

Read values:

```js
var value = pbf.readVarint();
var packed = pbf.readPacked('UInt32');
```

For lazy or partial decoding, simply save the position instead of reading a value,
then later set it back to the saved value and read:

```js
var fooPos = -1;
pbf.readFields(function (tag) {
    if (tag === 1) fooPos = pbf.pos;
});
...
pbf.pos = fooPos;
pbf.readMessage(readFoo);
```

Scalar reading methods:

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
* `readString()`
* `readBytes()`
* `skip(value)`

Packed reading methods:

* `readPackedVarint()`
* `readPackedSVarint()`
* `readPackedFixed32()`
* `readPackedFixed64()`
* `readPackedSFixed32()`
* `readPackedSFixed64()`
* `readPackedBoolean()`
* `readPackedFloat()`
* `readPackedDouble()`

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

Packed field writing methods:

* `writePackedVarint(tag, val)`
* `writePackedSVarint(tag, val)`
* `writePackedSFixed32(tag, val)`
* `writePackedSFixed64(tag, val)`
* `writePackedBoolean(tag, val)`
* `writePackedFloat(tag, val)`
* `writePackedDouble(tag, val)`

Scalar writing methods:

* `writeVarint(val)`
* `writeSVarint(val)`
* `writeSFixed32(val)`
* `writeSFixed64(val)`
* `writeBoolean(val)`
* `writeFloat(val)`
* `writeDouble(val)`
* `writeString(val)`
* `writeBytes(buffer[, start, end])`

Misc methods:

* `realloc(minBytes)` - pad the underlying buffer size to accommodate the given number of bytes;
   note that the size increases exponentially, so it won't necessarily equal the size of data written
* `finish()` - make the current buffer ready for reading and return the data as a buffer slice
* `destroy()` - dispose the buffer

For an example of a real-world usage of the library, see [vector-tile-js](https://github.com/mapbox/vector-tile-js).

## Changelog

#### master (unreleased)

- Replaced `readPacked` and `writePacked` methods that accept type as a string
  with `readPackedVarint`, etc. for each type (for better performance).
- Significantly improved encoding performance (the tile encoding benchmark is now 2.6x faster).
- Significantly improved encoding and decoding performance in browsers (faster Buffer shim).
- Added optional `start` and `end` arguments to `writeBytes`.

#### 1.1.4 (Jan 2, 2015)

- Significantly improved `readPacked` and `writePacked` performance (the tile reading benchmark is now 70% faster).

#### 1.1.3 (Dec 26, 2014)

Brings tons of improvements and fixes over the previous version (`0.0.2`).
Basically makes the library complete.

##### Improvements

- Improved performance of both reading and writing.
- Made the browser build 3 times smaller.
- Added convenience `readFields` and `readMessage` methods for a much easier reading API.
- Added reading methods: `readFloat`, `readBoolean`, `readSFixed32`, `readSFixed64`.
- Added writing methods: `writeUInt64`, `writeSFixed32`, `writeSFixed64`.
- Improved `readDouble` and `readString` to use native Buffer methods under Node.
- Improved `readString` and `writeString` to use HTML5 `TextEncoder` and `TextDecoder` where available.
- Made `Pbf` `buffer` argument optional.
- Added extensive docs and examples in the readme.
- Added an extensive test suite that brings test coverage up to 100%.

##### Breaking API changes

- Renamed `readBuffer`/`writeBuffer` to `readBytes`/`writeBytes`.
- Renamed `readUInt32`/`writeUInt32` to `readFixed32`/`writeFixed32`, etc.
- Renamed `writeTaggedVarint` to `writeVarintField`, etc.
- Changed `writePacked` signature from `(type, tag, items)` to `(tag, type, items)`.

##### Bugfixes

- Fixed `readVarint` to handle varints bigger than 6 bytes.
- Fixed `readSVarint` to handle number bigger than `2^30`.
- Fixed `writeVarint` failing on some integers.
- Fixed `writeVarint` not throwing an error on numbers that are too big.
- Fixed `readUInt64` always failing.
- Fixed writing to an empty buffer always failing.
