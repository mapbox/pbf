
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
    string_value?: string | null;
    float_value?: number | null;
    double_value?: number | null;
    int_value?: number | null;
    uint_value?: number | null;
    sint_value?: number | null;
    bool_value?: boolean | null;
}

export function readTileValue(pbf: any, end?: number): TileValue;
export function writeTileValue(obj: TileValue, pbf: any): void;

export interface TileFeature {
    id?: number | null;
    tags: number[];
    type?: number | null;
    geometry: number[];
}

export function readTileFeature(pbf: any, end?: number): TileFeature;
export function writeTileFeature(obj: TileFeature, pbf: any): void;

export interface TileLayer {
    version?: number | null;
    name?: string | null;
    features: TileFeature[];
    keys: string[];
    values: TileValue[];
    extent?: number | null;
}

export function readTileLayer(pbf: any, end?: number): TileLayer;
export function writeTileLayer(obj: TileLayer, pbf: any): void;
