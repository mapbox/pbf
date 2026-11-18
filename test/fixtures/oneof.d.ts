import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface Envelope {
    id: number;
    int: number;
    float: number;
    string: string;
    value: "int" | "float" | "string" | undefined;
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;
