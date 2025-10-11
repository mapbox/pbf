
export interface Envelope {
    int?: number;
    uint?: number;
    long?: number;
    ulong?: number;
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
