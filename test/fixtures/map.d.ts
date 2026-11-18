import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface Envelope {
    kv: {[key: string]: string};
    kn: {[key: string]: number};
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;

export interface EnvelopeKvEntry {
    key: string;
    value: string;
}
export function readEnvelopeKvEntry(pbf: PbfReader, end?: number): EnvelopeKvEntry;
export function writeEnvelopeKvEntry(obj: DeepPartial<EnvelopeKvEntry>, pbf: PbfWriter): void;

export interface EnvelopeKnEntry {
    key: string;
    value: number;
}
export function readEnvelopeKnEntry(pbf: PbfReader, end?: number): EnvelopeKnEntry;
export function writeEnvelopeKnEntry(obj: DeepPartial<EnvelopeKnEntry>, pbf: PbfWriter): void;
