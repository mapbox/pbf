
export interface Tile {
    layers: TileLayer[];
}

export function readTile(pbf: any, end?: number): Tile;
export function writeTile(obj: Tile, pbf: any): void;
export const TileGeomType: {
    readonly UNKNOWN: 0;
    readonly POINT: 1;
    readonly LINESTRING: 2;
    readonly POLYGON: 3;
};


export interface TileValue {
    string_value?: string;
    float_value?: number;
    double_value?: number;
    int_value?: number;
    uint_value?: number;
    sint_value?: number;
    bool_value?: boolean;
}

export function readTileValue(pbf: any, end?: number): TileValue;
export function writeTileValue(obj: TileValue, pbf: any): void;

export interface TileFeature {
    id?: number;
    tags: number[];
    type?: number;
    geometry: number[];
}

export function readTileFeature(pbf: any, end?: number): TileFeature;
export function writeTileFeature(obj: TileFeature, pbf: any): void;

export interface TileLayer {
    version?: number;
    name?: string;
    features: TileFeature[];
    keys: string[];
    values: TileValue[];
    extent?: number;
}

export function readTileLayer(pbf: any, end?: number): TileLayer;
export function writeTileLayer(obj: TileLayer, pbf: any): void;
