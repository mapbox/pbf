export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};


export interface Envelope {
    type?: number | null;
    name?: string | null;
    flag?: boolean | null;
    weight?: number | null;
    id?: number | null;
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
