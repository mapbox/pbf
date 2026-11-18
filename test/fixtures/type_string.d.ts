import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface TypeString {
    int: string;
    long: string;
    boolVal: boolean;
    float: string;
    default_implicit: string;
    default_explicit: string;
}
export function readTypeString(pbf: PbfReader, end?: number): TypeString;
export function writeTypeString(obj: DeepPartial<TypeString>, pbf: PbfWriter): void;

export interface TypeNotString {
    int: number;
    long: number;
    boolVal: boolean;
    float: number;
}
export function readTypeNotString(pbf: PbfReader, end?: number): TypeNotString;
export function writeTypeNotString(obj: DeepPartial<TypeNotString>, pbf: PbfWriter): void;
