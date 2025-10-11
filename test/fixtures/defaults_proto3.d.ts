export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};


export interface Envelope {
    type?: number;
    name?: string;
    flag?: boolean;
    weight?: number;
    id?: number;
}

export function readEnvelope(pbf: any, end?: number): Envelope;
export function writeEnvelope(obj: Envelope, pbf: any): void;
