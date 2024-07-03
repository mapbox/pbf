# pbf

[![Node](https://github.com/mapbox/pbf/actions/workflows/node.yml/badge.svg)](https://github.com/mapbox/pbf/actions/workflows/node.yml)
![Bundle size](https://img.shields.io/bundlephobia/minzip/pbf)

A low-level, fast, ultra-lightweight (3KB gzipped) JavaScript library for decoding and encoding [protocol buffers](https://developers.google.com/protocol-buffers), a compact binary format for structured data serialization. Works both in Node and the browser. Supports lazy decoding and detailed customization of the reading/writing code.

## Performance

This library is extremely fast — much faster than native `JSON.parse`/`JSON.stringify`
and the [protocol-buffers](https://github.com/mafintosh/protocol-buffers) module.
Here's a result from running a real-world benchmark on Node v6.5
(decoding and encoding a sample of 439 vector tiles, 22.6 MB total):

- **pbf** decode: 387ms, or 57 MB/s
- **pbf** encode: 396ms, or 56 MB/s
- **protocol-buffers** decode: 837ms, or 26 MB/s
- **protocol-buffers** encode: 4197ms, or 5 MB/s
- **JSON.parse**: 1540ms, or 125 MB/s (parsing an equivalent 77.5 MB JSON file)
- **JSON.stringify**: 607ms, or 49 MB/s

## Examples

#### Using Compiled Code

Install `pbf` and compile a JavaScript module from a `.proto` file:

```bash
$ npm install -g pbf
$ pbf example.proto > example.js
```

Then read and write objects using the module like this:

```js
var Pbf = require('pbf');
var Example = require('./example.js').Example;

// read
var pbf = new Pbf(buffer);
var obj = Example.read(pbf);

// write
var pbf = new Pbf();
Example.write(obj, pbf);
var buffer = pbf.finish();
```

Alternatively, you can compile a module directly in the code:

```js
var compile = require('pbf/compile');
var schema = require('protocol-buffers-schema');

var proto = schema.parse(fs.readFileSync('example.proto'));
var Test = compile(proto).Test;
```

If you use `webpack` as your module bundler, you can use [pbf-loader](https://github.com/trivago/pbf-loader)
to load .proto files directly. It returns a compiled module ready to be used.

Given you already configured your `webpack.config.js`, the code above would look like:
```js
var Pbf = require('pbf');
var proto = require('./example.proto');

var Test = proto.Test;
```

#### Custom Reading

```js
var data = new Pbf(buffer).readFields(readData, {});

function readData(tag, data, pbf) {
    if (tag === 1) data.name = pbf.readString();
    else if (tag === 2) data.version = pbf.readVarint();
    else if (tag === 3) data.layer = pbf.readMessage(readLayer, {});
}
function readLayer(tag, layer, pbf) {
    if (tag === 1) layer.name = pbf.readString();
    else if (tag === 3) layer.size = pbf.readVarint();
}
```

#### Custom Writing

```js
var pbf = new Pbf();
writeData(data, pbf);
var buffer = pbf.finish();

function writeData(data, pbf) {
    pbf.writeStringField(1, data.name);
    pbf.writeVarintField(2, data.version);
    pbf.writeMessage(3, writeLayer, data.layer);
}
function writeLayer(layer, pbf) {
    pbf.writeStringField(1, layer.name);
    pbf.writeVarintField(2, layer.size);
}
```

## Install

Node and Browserify:

```bash
npm install pbf
```

Making a browser build:

```bash
npm install
npm run build-dev # dist/pbf-dev.js (development build)
npm run build-min # dist/pbf.js (minified production build)
```

CDN link: https://unpkg.com/pbf@3.3.0/dist/pbf.js

## API

Create a `Pbf` object, optionally given a `Buffer` or `Uint8Array` as input data:

```js
// parse a pbf file from disk in Node
var pbf = new Pbf(fs.readFileSync('data.pbf'));

// parse a pbf file in a browser after an ajax request with responseType="arraybuffer"
var pbf = new Pbf(new Uint8Array(xhr.response));
```

`Pbf` object properties:

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
and also passes the `Pbf` object as a third argument:

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
var str = pbf.readString();
var numbers = pbf.readPackedVarint();
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

* `readVarint(isSigned)` (pass `true` if you expect negative varints)
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
* `skip(value)`

Packed reading methods:

* `readPackedVarint(arr, isSigned)` (appends read items to `arr`)
* `readPackedSVarint(arr)`
* `readPackedFixed32(arr)`
* `readPackedFixed64(arr)`
* `readPackedSFixed32(arr)`
* `readPackedSFixed64(arr)`
* `readPackedBoolean(arr)`
* `readPackedFloat(arr)`
* `readPackedDouble(arr)`

#### Writing

Write values:

```js
pbf.writeVarint(123);
pbf.writeString("Hello world");
```

Write an embedded message:

```js
pbf.writeMessage(1, writeObj, obj);

function writeObj(obj, pbf) {
    pbf.writeStringField(obj.name);
    pbf.writeVarintField(obj.version);
}
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
* `writeBytes(buffer)`

Message writing methods:

* `writeMessage(tag, fn[, obj])`
* `writeRawMessage(fn[, obj])`

Misc methods:

* `realloc(minBytes)` - pad the underlying buffer size to accommodate the given number of bytes;
   note that the size increases exponentially, so it won't necessarily equal the size of data written
* `finish()` - make the current buffer ready for reading and return the data as a buffer slice
* `destroy()` - dispose the buffer

For an example of a real-world usage of the library, see [vector-tile-js](https://github.com/mapbox/vector-tile-js).


## Proto Schema to JavaScript

If installed globally, `pbf` provides a binary that compiles `proto` files into JavaScript modules. Usage:

```bash
$ pbf <proto_path> [--no-write] [--no-read] [--browser]
```

The `--no-write` and `--no-read` switches remove corresponding code in the output.
The `--browser` switch makes the module work in browsers instead of Node.

The resulting module exports each message by name with the following methods:

* `read(pbf)` - decodes an object from the given `Pbf` instance
* `write(obj, pbf)` - encodes an object into the given `Pbf` instance (usually empty)

The resulting code is clean and simple, so feel free to customize it.
