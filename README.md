# pbf

A [protocol buffers](http://code.google.com/p/protobuf/) implementation in
JavaScript.

## install

    npm install pbf

## api

### `Protobuf(buf, pos)`

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

Writing

* writeTag
* writeUInt32
* writeUInt32LE
* writeUInt64
* writeUInt64LE
* writePacked
* writePackedVarints
* writeDoubleLE
* writeDouble
* writeTaggedBuffer
* writeTaggedString
* writeTaggedBoolean
* writeTaggedUInt64
* writeTaggedUInt32
* writeTaggedVarint
* writeRepeated
