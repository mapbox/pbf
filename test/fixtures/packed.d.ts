import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface NotPacked {
    value: number[];
    types: number[];
}
export function readNotPacked(pbf: PbfReader, end?: number): NotPacked;
export function writeNotPacked(obj: DeepPartial<NotPacked>, pbf: PbfWriter): void;

export interface FalsePacked {
    value: number[];
    types: number[];
}
export function readFalsePacked(pbf: PbfReader, end?: number): FalsePacked;
export function writeFalsePacked(obj: DeepPartial<FalsePacked>, pbf: PbfWriter): void;

export interface Packed {
    value: number[];
    types: number[];
}
export function readPacked(pbf: PbfReader, end?: number): Packed;
export function writePacked(obj: DeepPartial<Packed>, pbf: PbfWriter): void;
