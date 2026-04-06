import Pbf from 'pbf';

import {readEnvelope, writeEnvelope, MessageType} from '../fixtures/defaults_implicit.js'
import type {Envelope, CustomType} from '../fixtures/defaults_implicit.js'

const pbf = new Pbf();
readEnvelope(pbf) satisfies Envelope;

const valid: Envelope = {
    type: MessageType.GREETING,
    name: 'test',
    flag: true,
    weight: 1.5,
    id: 1,
    tags: [''],
    numbers: [0],
    bytes: new Uint8Array(0),
    custom: {} satisfies CustomType,
    types: [MessageType.GREETING],
};

const invalid = {
    type: null,
    name: null,
    flag: null,
    weight: null,
    id: null,
    tags: null,
    numbers: null,
    bytes: null,
    custom: null,
    types: null,
};

writeEnvelope(valid, pbf);

// @ts-expect-error
writeEnvelope(invalid, pbf);
