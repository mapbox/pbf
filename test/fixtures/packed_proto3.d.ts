import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface NotPacked {
    value: number[];
    types: MessageType[];
}
export function readNotPacked(pbf: PbfReader, end?: number): NotPacked;
export function writeNotPacked(obj: DeepPartial<NotPacked>, pbf: PbfWriter): void;

export interface FalsePacked {
    value: number[];
    types: MessageType[];
}
export function readFalsePacked(pbf: PbfReader, end?: number): FalsePacked;
export function writeFalsePacked(obj: DeepPartial<FalsePacked>, pbf: PbfWriter): void;

export interface Packed {
    value: number[];
}
export function readPacked(pbf: PbfReader, end?: number): Packed;
export function writePacked(obj: DeepPartial<Packed>, pbf: PbfWriter): void;

export interface PackedFixed {
    value: number[];
}
export function readPackedFixed(pbf: PbfReader, end?: number): PackedFixed;
export function writePackedFixed(obj: DeepPartial<PackedFixed>, pbf: PbfWriter): void;
