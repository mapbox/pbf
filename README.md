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
import Pbf from 'pbf';
import {readExample, writeExample} from './example.js';

// read
var obj = readExample(new Pbf(buffer));

// write
const pbf = new Pbf();
writeExample(obj, pbf);
const buffer = pbf.finish();
```

Alternatively, you can compile a protobuf schema file directly in the code:

```js
import {compile} from 'pbf/compile';
import schema from 'protocol-buffers-schema';

const proto = schema.parse(fs.readFileSync('example.proto'));
const {readExample, writeExample} = compile(proto);
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

Install using NPM with `npm install pbf`, then import as a module:

```js
import Pbf from 'pbf';
```

Or use as a module directly in the browser with [jsDelivr](https://www.jsdelivr.com/esm):

```html
<script type="module">
    import Pbf from 'https://cdn.jsdelivr.net/npm/pbf/+esm';
</script>
```

Alternatively, there's a browser bundle with a `Pbf` global variable:

```html
<script src="https://cdn.jsdelivr.net/npm/pbf"></script>
```

## API

Create a `Pbf` object, optionally given a `Buffer` or `Uint8Array` as input data:

```js
// parse a pbf file from disk in Node
const pbf = new Pbf(fs.readFileSync('data.pbf'));

// parse a pbf file in a browser after an ajax request with responseType="arraybuffer"
const pbf = new Pbf(new Uint8Array(xhr.response));
```

`Pbf` object properties:

```js
pbf.length; // length of the underlying buffer
pbf.pos; // current offset for reading or writing
```

#### Reading

Read a sequence of fields:

```js
pbf.readFields((tag) => {
    if (tag === 1) pbf.readVarint();
    else if (tag === 2) pbf.readString();
    else ...
});
```

It optionally accepts an object that will be passed to the reading function for easier construction of decoded data,
and also passes the `Pbf` object as a third argument:

```js
const result = pbf.readFields(readField, {})

function readField(tag, result, pbf) {
    if (tag === 1) result.id = pbf.readVarint();
}
```

To read an embedded message, use `pbf.readMessage(fn[, obj])` (in the same way as `read`).

Read values:

```js
const value = pbf.readVarint();
const str = pbf.readString();
const numbers = pbf.readPackedVarint();
```

For lazy or partial decoding, simply save the position instead of reading a value,
then later set it back to the saved value and read:

```js
const fooPos = -1;
pbf.readFields((tag) => {
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

For an example of a real-world usage of the library, see [vector-tile-js](https://github.com/mapbox/vector-tile-js).


## Proto Schema to JavaScript

If installed globally, `pbf` provides a binary that compiles `proto` files into JavaScript modules. Usage:

```bash
$ pbf <proto_path> [--no-write] [--no-read] [--legacy]
```

The `--no-write` and `--no-read` switches remove corresponding code in the output.
The `--legacy` switch makes it generate a CommonJS module instead of ESM.

`Pbf` will generate `read<Identifier>` and `write<Identifier>` functions for every message in the schema. For nested messages, their names will be concatenated — e.g. `Message` inside `Test` will produce `readTestMessage` and `writeTestMessage` functions.


* `read(pbf)` - decodes an object from the given `Pbf` instance.
* `write(obj, pbf)` - encodes an object into the given `Pbf` instance (usually empty).

The resulting code is clean and simple, so it's meant to be customized.
