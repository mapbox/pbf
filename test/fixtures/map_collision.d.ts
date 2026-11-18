import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface Envelope {
    kv: {[key: string]: string};
    kn: {[key: string]: number};
    sibling: EnvelopeKvEntry | undefined;
    flag: EnvelopeKnEntry;
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;

export const EnvelopeKnEntry: {
    readonly ZERO: 0;
    readonly ONE: 1;
};
export type EnvelopeKnEntry = (typeof EnvelopeKnEntry)[keyof typeof EnvelopeKnEntry];

export interface EnvelopeKvEntry {
    marker: number;
}
export function readEnvelopeKvEntry(pbf: PbfReader, end?: number): EnvelopeKvEntry;
export function writeEnvelopeKvEntry(obj: DeepPartial<EnvelopeKvEntry>, pbf: PbfWriter): void;

export interface EnvelopeKvEntry$ {
    key: string;
    value: string;
}
export function readEnvelopeKvEntry$(pbf: PbfReader, end?: number): EnvelopeKvEntry$;
export function writeEnvelopeKvEntry$(obj: DeepPartial<EnvelopeKvEntry$>, pbf: PbfWriter): void;

export interface EnvelopeKnEntry$ {
    key: string;
    value: number;
}
export function readEnvelopeKnEntry$(pbf: PbfReader, end?: number): EnvelopeKnEntry$;
export function writeEnvelopeKnEntry$(obj: DeepPartial<EnvelopeKnEntry$>, pbf: PbfWriter): void;
