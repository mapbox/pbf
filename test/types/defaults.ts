import Pbf from 'pbf';

import {readEnvelope, writeEnvelope, MessageType} from '../fixtures/defaults.js'
import type {Envelope} from '../fixtures/defaults.js'

const pbf = new Pbf();
readEnvelope(pbf) satisfies Envelope;

const valid: Envelope = {
    type: MessageType.GREETING,
    name: 'test',
    flag: true,
    weight: 1.5,
    id: 1,
};

const invalid = {
    type: null,
    name: null,
    flag: null,
    weight: null,
    id: null,
};

writeEnvelope(valid, pbf);

// @ts-expect-error
writeEnvelope(invalid, pbf);
