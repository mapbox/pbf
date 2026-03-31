
export interface Envelope {
    id?: number | null;
    int?: number | null;
    float?: number | null;
    string?: string | null;
    value?: "int" | "float" | "string";
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
