import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export const MessageType: {
    readonly UNKNOWN: 0;
    readonly GREETING: 1;
};
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface Envelope {
    type: MessageType;
    name: string;
    flag: boolean;
    weight: number;
    id: number;
}
export function readEnvelope(pbf: PbfReader, end?: number): Envelope;
export function writeEnvelope(obj: DeepPartial<Envelope>, pbf: PbfWriter): void;
