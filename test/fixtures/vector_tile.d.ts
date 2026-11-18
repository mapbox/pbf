import type {PbfReader, PbfWriter, DeepPartial} from 'pbf';

export interface Tile {
    layers: TileLayer[];
}
export function readTile(pbf: PbfReader, end?: number): Tile;
export function writeTile(obj: DeepPartial<Tile>, pbf: PbfWriter): void;

export const TileGeomType: {
    readonly UNKNOWN: 0;
    readonly POINT: 1;
    readonly LINESTRING: 2;
    readonly POLYGON: 3;
};
export type TileGeomType = (typeof TileGeomType)[keyof typeof TileGeomType];

export interface TileValue {
    string_value: string;
    float_value: number;
    double_value: number;
    int_value: number;
    uint_value: number;
    sint_value: number;
    bool_value: boolean;
}
export function readTileValue(pbf: PbfReader, end?: number): TileValue;
export function writeTileValue(obj: DeepPartial<TileValue>, pbf: PbfWriter): void;

export interface TileFeature {
    id: number;
    tags: number[];
    type: TileGeomType;
    geometry: number[];
}
export function readTileFeature(pbf: PbfReader, end?: number): TileFeature;
export function writeTileFeature(obj: DeepPartial<TileFeature>, pbf: PbfWriter): void;

export interface TileLayer {
    version: number;
    name: string;
    features: TileFeature[];
    keys: string[];
    values: TileValue[];
    extent: number;
}
export function readTileLayer(pbf: PbfReader, end?: number): TileLayer;
export function writeTileLayer(obj: DeepPartial<TileLayer>, pbf: PbfWriter): void;
