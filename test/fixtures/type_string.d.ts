
export interface TypeString {
    int?: string | null;
    long?: string | null;
    boolVal?: boolean | null;
    float?: string | null;
    default_implicit?: string | null;
    default_explicit?: string | null;
}

export function readTypeString(pbf: any, end?: number): TypeString;
export function writeTypeString(obj: TypeString, pbf: any): void;

export interface TypeNotString {
    int?: number | null;
    long?: number | null;
    boolVal?: boolean | null;
    float?: number | null;
}

export function readTypeNotString(pbf: any, end?: number): TypeNotString;
export function writeTypeNotString(obj: TypeNotString, pbf: any): void;
