
export interface Envelope {
    kv?: { [key: string]: string };
    kn?: { [key: string]: number };
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;

export interface Envelope_FieldEntry1 {
    key?: string;
    value?: string;
}

export function readEnvelope_FieldEntry1(pbf: any, end?: number): Envelope_FieldEntry1;
export function writeEnvelope_FieldEntry1(obj: Envelope_FieldEntry1, pbf: any): void;

export interface Envelope_FieldEntry2 {
    key?: string;
    value?: number;
}

export function readEnvelope_FieldEntry2(pbf: any, end?: number): Envelope_FieldEntry2;
export function writeEnvelope_FieldEntry2(obj: Envelope_FieldEntry2, pbf: any): void;
