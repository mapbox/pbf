import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface EmbeddedType {
    value: string;
    sub_field: EmbeddedTypeContainer | undefined;
    sub_sub_field: EmbeddedTypeContainerInner | undefined;
}
export function readEmbeddedType(pbf: PbfReader, end?: number): EmbeddedType;
export function writeEmbeddedType(obj: DeepPartial<EmbeddedType>, pbf: PbfWriter): void;

export interface EmbeddedTypeContainer {
    values: EmbeddedTypeContainerInner[];
}
export function readEmbeddedTypeContainer(pbf: PbfReader, end?: number): EmbeddedTypeContainer;
export function writeEmbeddedTypeContainer(obj: DeepPartial<EmbeddedTypeContainer>, pbf: PbfWriter): void;

export interface EmbeddedTypeContainerInner {
    value: string;
}
export function readEmbeddedTypeContainerInner(pbf: PbfReader, end?: number): EmbeddedTypeContainerInner;
export function writeEmbeddedTypeContainerInner(obj: DeepPartial<EmbeddedTypeContainerInner>, pbf: PbfWriter): void;
