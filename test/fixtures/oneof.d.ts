
export interface Envelope {
    id?: number;
    int?: number;
    float?: number;
    string?: string;
    value?: "int" | "float" | "string";
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
