
export interface EmbeddedType {
    value?: string | null;
    sub_field?: EmbeddedTypeContainer | null;
    sub_sub_field?: EmbeddedTypeContainerInner | null;
}

export function readEmbeddedType(pbf: any, end?: number): EmbeddedType;
export function writeEmbeddedType(obj: EmbeddedType, pbf: any): void;

export interface EmbeddedTypeContainer {
    values: EmbeddedTypeContainerInner[];
}

export function readEmbeddedTypeContainer(pbf: any, end?: number): EmbeddedTypeContainer;
export function writeEmbeddedTypeContainer(obj: EmbeddedTypeContainer, pbf: any): void;

export interface EmbeddedTypeContainerInner {
    value?: string | null;
}

export function readEmbeddedTypeContainerInner(pbf: any, end?: number): EmbeddedTypeContainerInner;
export function writeEmbeddedTypeContainerInner(obj: EmbeddedTypeContainerInner, pbf: any): void;
