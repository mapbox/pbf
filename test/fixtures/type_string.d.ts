
export interface TypeString {
    int?: string;
    long?: string;
    boolVal?: boolean;
    float?: string;
    default_implicit?: string;
    default_explicit?: string;
}

export function readTypeString(pbf: any, end?: number): TypeString;
export function writeTypeString(obj: TypeString, pbf: any): void;

export interface TypeNotString {
    int?: number;
    long?: number;
    boolVal?: boolean;
    float?: number;
}

export function readTypeNotString(pbf: any, end?: number): TypeNotString;
export function writeTypeNotString(obj: TypeNotString, pbf: any): void;
