import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface CustomType {}
export function readCustomType(pbf: PbfReader, end?: number): CustomType;
export function writeCustomType(obj: DeepPartial<CustomType>, pbf: PbfWriter): void;

export interface Envelope {
    type: MessageType;
    name: string;
    flag: boolean;
    weight: number;
    id: number;
    tags: string[];
    numbers: number[];
    bytes: Uint8Array | undefined;
    custom: CustomType | undefined;
    types: MessageType[];
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;
