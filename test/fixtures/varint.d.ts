
export interface Envelope {
    int?: number | null;
    uint?: number | null;
    long?: number | null;
    ulong?: number | null;
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
