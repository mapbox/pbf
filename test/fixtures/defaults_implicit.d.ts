export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};


export interface CustomType {
}

export function readCustomType(pbf: any, end?: number): CustomType;
export function writeCustomType(obj: CustomType, pbf: any): void;

export interface Envelope {
    type?: number | null;
    name?: string | null;
    flag?: boolean | null;
    weight?: number | null;
    id?: number | null;
    tags: string[];
    numbers: number[];
    bytes?: Uint8Array | null;
    custom?: CustomType | null;
    types: number[];
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
