export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};


export interface NotPacked {
    value: number[];
    types: number[];
}

export function readNotPacked(pbf: any, end?: number): NotPacked;
export function writeNotPacked(obj: NotPacked, pbf: any): void;

export interface FalsePacked {
    value: number[];
    types: number[];
}

export function readFalsePacked(pbf: any, end?: number): FalsePacked;
export function writeFalsePacked(obj: FalsePacked, pbf: any): void;

export interface Packed {
    value: number[];
}

export function readPacked(pbf: any, end?: number): Packed;
export function writePacked(obj: Packed, pbf: any): void;
