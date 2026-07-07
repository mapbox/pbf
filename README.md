# pbf

[![Node](https://github.com/mapbox/pbf/actions/workflows/node.yml/badge.svg)](https://github.com/mapbox/pbf/actions/workflows/node.yml)
![Bundle size](https://img.shields.io/bundlephobia/minzip/pbf)

A low-level, fast, ultra-lightweight (2.5KB gzipped) JavaScript library for decoding and encoding [protocol buffers](https://developers.google.com/protocol-buffers), a compact binary format for structured data serialization. Works both in Node and the browser. Supports lazy decoding and detailed customization of the reading/writing code.

## Performance

This library is fast — competitive with or faster than other JS protobuf implementations —
while being an order of magnitude smaller. Here's a result from a real-world benchmark on Node v26
(decoding and encoding 439 Mapbox vector tiles, 37.5 MB total; the equivalent JSON is 136 MB):

|                  | decode            | encode            | size (minzip) |
|------------------|-------------------|-------------------|------------------|
| **pbf**          | 195ms, 192 MB/s   | 174ms, 216 MB/s   | 2.5 KB           |
| protocol-buffers | 303ms, 124 MB/s   | 612ms,  61 MB/s   | 14.2 KB          |
| protobuf.js      | 192ms, 195 MB/s   | 141ms, 266 MB/s   | 33.9 KB          |
| JSON             | 441ms, 308 MB/s   | 363ms, 374 MB/s   | —                |

`JSON` throughput is measured against the 136 MB JSON payload, not the 37.5 MB pbf payload —
on the same data, pbf is ~2× faster to decode and ~2.5× faster to encode, and produces output
roughly a quarter the size. See `bench/bench-tiles.js`.

## Examples

#### Using Compiled Code

Install `pbf` and compile a JavaScript module from a `.proto` file:

```bash
$ npm install -g pbf
$ pbf example.proto > example.js
```

Then read and write objects using the module like this:

```js
import {PbfReader, PbfWriter} from 'pbf';
import {readExample, writeExample} from './example.js';

// read
const obj = readExample(new PbfReader(buffer));

// write
const pbf = new PbfWriter();
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
const pbf = new PbfReader(buffer);
const data = readData(pbf);

function readData(pbf, end) {
    const data = {};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) data.name = pbf.readString();
        else if (field === 2) data.version = pbf.readVarint();
        else if (field === 3) data.layer = readLayer(pbf, pbf.readVarint() + pbf.pos);
    }
    return data;
}
function readLayer(pbf, end) {
    const layer = {};
    let field;
    while ((field = pbf.nextField(end))) {
        if (field === 1) layer.name = pbf.readString();
        else if (field === 3) layer.size = pbf.readVarint();
    }
    return layer;
}
```

#### Custom Writing

```js
const pbf = new PbfWriter();
writeData(data, pbf);
const buffer = pbf.finish();

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
import {PbfReader, PbfWriter} from 'pbf';
```

Or use as a module directly in the browser with [jsDelivr](https://www.jsdelivr.com/esm):

```html
<script type="module">
    import {PbfReader, PbfWriter} from 'https://cdn.jsdelivr.net/npm/pbf/+esm';
</script>
```

Alternatively, there's a browser bundle exposing a `Pbf` global with `PbfReader` and `PbfWriter` properties:

```html
<script src="https://cdn.jsdelivr.net/npm/pbf"></script>
```

## API

The library exposes two classes: `PbfReader` for decoding and `PbfWriter` for encoding. Splitting them lets bundlers tree-shake the half you don't use.

Create a `PbfReader` from a `Buffer` or `Uint8Array`:

```js
// parse a pbf file from disk in Node
const pbf = new PbfReader(fs.readFileSync('data.pbf'));

// parse a pbf file in a browser after an ajax request with responseType="arraybuffer"
const pbf = new PbfReader(new Uint8Array(xhr.response));
```

Both classes expose the following properties:

```js
pbf.length; // length of the underlying buffer
pbf.pos; // current offset for reading or writing
```

#### Reading

Loop over a message's fields with `nextField` and dispatch on the field number. Unrecognized or unread fields are skipped automatically on the next iteration:

```js
let field;
while ((field = pbf.nextField(end))) {
    if (field === 1) obj.id = pbf.readVarint();
    else if (field === 2) obj.name = pbf.readString();
}
```

To read an embedded message, pass `pbf.readVarint() + pbf.pos` as `end` to a nested reader:

```js
const msg = readSubMessage(pbf, pbf.readVarint() + pbf.pos);
```

Read values:

```js
const value = pbf.readVarint();
const str = pbf.readString();
const numbers = pbf.readPackedVarint();
```

For lazy or partial decoding, save the position and come back to it later:

```js
let fooPos = -1;
let field;
while ((field = pbf.nextField())) {
    if (field === 1) fooPos = pbf.pos;
}
...
pbf.pos = fooPos;
const foo = readFoo(pbf, pbf.readVarint() + pbf.pos);
```

A callback-based `readFields(fn, obj, end)` is also available for backward compatibility, but new code should prefer the `nextField` loop — it's significantly faster.

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

Field iteration methods:

* `nextField(end)` — returns the next field number, or `0` at end-of-message; skips the previous field's value if it wasn't consumed
* `skip(value)` — skips a field given its raw tag varint

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

Create a `PbfWriter` (optionally with a pre-allocated `Buffer` or `Uint8Array`):

```js
const pbf = new PbfWriter();
```

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


* `read(pbf)` - decodes an object from the given `PbfReader` instance.
* `write(obj, pbf)` - encodes an object into the given `PbfWriter` instance (usually empty).

The resulting code is clean and simple, so it's meant to be customized.
