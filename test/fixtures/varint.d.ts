import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface Envelope {
    int: number;
    uint: number;
    long: number;
    ulong: number;
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;
