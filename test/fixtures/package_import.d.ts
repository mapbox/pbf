import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface Envelope {
    payload: Any | undefined;
    absolute_payload: Any | undefined;
    inner: EnvelopeInner | undefined;
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;

export interface EnvelopeInner {
    value: string;
}
export function readEnvelopeInner(pbf: PbfReader, end?: number): EnvelopeInner;
export function writeEnvelopeInner(obj: DeepPartial<EnvelopeInner>, pbf: PbfWriter): void;

export interface Any {
    type_url: string;
    value: Uint8Array | undefined;
}
export function readAny(pbf: PbfReader, end?: number): Any;
export function writeAny(obj: DeepPartial<Any>, pbf: PbfWriter): void;
