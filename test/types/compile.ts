import {PbfReader, PbfWriter} from 'pbf';

import * as defaults from '../fixtures/defaults_implicit.js';
import * as oneof from '../fixtures/oneof.js';
import * as map from '../fixtures/map.js';
import * as embedded from '../fixtures/embedded_type.js';
import * as typeString from '../fixtures/type_string.js';
import * as tile from '../fixtures/vector_tile.js';

const reader = new PbfReader(new Uint8Array());
const writer = new PbfWriter();

// read results have every field set, apart from unset messages and bytes
const envelope = defaults.readEnvelope(reader);
envelope.name satisfies string;
envelope.tags satisfies string[];
envelope.type satisfies 0 | 1;
envelope.bytes satisfies Uint8Array | undefined;
envelope.custom satisfies defaults.CustomType | undefined;
// @ts-expect-error message fields may be unset
envelope.custom satisfies defaults.CustomType;

// enums are plain objects with literal values
defaults.MessageType.GREETING satisfies 1;
const type: defaults.MessageType = defaults.MessageType.GREETING;
// @ts-expect-error not a MessageType value
const badType: defaults.MessageType = 2;

// write functions accept any subset of fields, including nested ones
defaults.writeEnvelope({}, writer);
defaults.writeEnvelope({type, name: 'test', bytes: new Uint8Array(1), types: [0, 1]}, writer);
defaults.writeEnvelope(envelope, writer);
// @ts-expect-error wrong field type
defaults.writeEnvelope({name: 1}, writer);
// @ts-expect-error unknown field
defaults.writeEnvelope({nope: 1}, writer);

embedded.writeEmbeddedType({sub_field: {values: [{}]}}, writer);
// @ts-expect-error wrong nested field type
embedded.writeEmbeddedType({sub_field: {values: [{value: 1}]}}, writer);
embedded.readEmbeddedType(reader).sub_field?.values[0].value satisfies string | undefined;

// oneof discriminators
const value = oneof.readEnvelope(reader).value;
value satisfies 'int' | 'float' | 'string' | undefined;
// @ts-expect-error not a member of the oneof
value === 'double';

// maps
map.readEnvelope(reader).kn.foo satisfies number;
map.writeEnvelope({kv: {a: 'b'}}, writer);
// @ts-expect-error wrong map value type
map.writeEnvelope({kv: {a: 1}}, writer);

// jstype = JS_STRING
typeString.readTypeString(reader).long satisfies string;

// round trip
tile.writeTile(tile.readTile(reader), writer);
tile.readTile(reader).layers[0].features[0].type satisfies tile.TileGeomType;

// read and write functions take the matching reader and writer
// @ts-expect-error a writer can't be read from
tile.readTile(writer);
