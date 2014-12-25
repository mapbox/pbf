# pbf

[![build status](https://secure.travis-ci.org/mapbox/pbf.png)](http://travis-ci.org/mapbox/pbf) [![Coverage Status](https://coveralls.io/repos/mapbox/pbf/badge.png)](https://coveralls.io/r/mapbox/pbf)

A low-level, lightweight [protocol buffers](https://developers.google.com/protocol-buffers) implementation in JavaScript for Node and browsers.

Designed to be a building block for writing a customized, lazy decoder for a stable protobuf schema.
If you need an easy-to-use, all-purpose protobuf JS library that does most of the work for you,
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

```js
var pbf = new Pbf(buffer),
    name, version, layerName;

pbf.read(function(tag) {
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
pbf.read(function (tag) {
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

Writing methods:

* `writeTaggedVarint(tag, val)`
* `writeTaggedSVarint(tag, val)`
* `writeTaggedFixed32(tag, val)`
* `writeTaggedFixed64(tag, val)`
* `writeTaggedBoolean(tag, val)`
* `writeTaggedFloat(tag, val)`
* `writeTaggedDouble(tag, val)`
* `writeTaggedString(tag, val)`
* `writeTaggedBytes(tag, buffer)`
* `writePacked(type, tag, items)`
* `writeVarint(val)`
* `writeSVarint(val)`
* `writeFixed32(val)`
* `writeFixed64(val)`
* `writeFloat(val)`
* `writeDouble(val)`
* `writeString(val)`
* `writeBytes(buffer)`
* `writeMessage(tag, pbf)`

Misc methods:

* `realloc(minBytes)` - pad the underlying buffer size to accommodate the given number of bytes
* `finish()` - return the buffer slice with the exact data length
* `destroy()` - disposes the buffer

For an example of a real-world usage of the library, see [vector-tile-js](https://github.com/mapbox/vector-tile-js).
