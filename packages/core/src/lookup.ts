import { geoBounds, geoContains } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import { asPolygonFeatures, featureMeta, type FeatureMeta } from "./geo.js";
import type { Region } from "./types.js";

type BBox = [[number, number], [number, number]];

export interface IndexedPart {
  meta: FeatureMeta;
  feature: Feature;
  parent: Feature;
  bbox: BBox;
}

export interface CountryIndex {
  parts: IndexedPart[];
  cells: Map<string, IndexedPart[]>;
  cellSize: number;
}

const CELL_SIZE = 8;

export function buildCountryIndex(geojson: FeatureCollection): CountryIndex {
  const parts: IndexedPart[] = [];
  const cells = new Map<string, IndexedPart[]>();

  for (const feature of geojson.features) {
    const meta = featureMeta(feature);
    for (const polygon of asPolygonFeatures(feature)) {
      const bbox = geoBounds(polygon) as BBox;
      const part: IndexedPart = { meta, feature: polygon, parent: feature, bbox };
      parts.push(part);
      for (const key of bboxCells(bbox, CELL_SIZE)) {
        const bucket = cells.get(key);
        if (bucket) bucket.push(part);
        else cells.set(key, [part]);
      }
    }
  }

  return { parts, cells, cellSize: CELL_SIZE };
}

export function lookupCountry(lng: number, lat: number, index: CountryIndex): FeatureMeta | null {
  const seen = new Set<IndexedPart>();
  for (const key of pointCellKeys(lng, lat, index.cellSize)) {
    const candidates = index.cells.get(key) ?? [];
    for (const part of candidates) {
      if (seen.has(part)) continue;
      seen.add(part);
      if (!bboxContains(part.bbox, lng, lat)) continue;
      if (geoContains(part.parent, [lng, lat]) || geoContains(part.feature, [lng, lat])) {
        return part.meta;
      }
    }
  }

  return null;
}

export function inRegion(lat: number, lng: number, region?: Region): boolean {
  if (!region) return true;
  if (lat < region.lat[0] || lat > region.lat[1]) return false;
  return lngContains(region.lng[0], region.lng[1], lng);
}

export function lngToCol(lng: number, size: number): number {
  const clamped = Math.min(180, Math.max(-180, lng));
  const maxCol = Math.floor(360 / size);
  return Math.min(Math.floor((clamped + 180) / size), maxCol);
}

export function latToRow(lat: number, size: number): number {
  const clamped = Math.min(90, Math.max(-90, lat));
  return Math.floor((clamped + 90) / size);
}

function pointCellKeys(lng: number, lat: number, size: number): string[] {
  const keys = [`${lngToCol(lng, size)}:${latToRow(lat, size)}`];
  if (Math.abs(Math.abs(lng) - 180) < 1e-6) {
    keys.push(`${lngToCol(-lng, size)}:${latToRow(lat, size)}`);
  }
  return keys;
}

function bboxContains(bbox: BBox, lng: number, lat: number): boolean {
  const [[west, south], [east, north]] = bbox;
  if (lat < south || lat > north) return false;
  return lngContains(west, east, lng);
}

function lngContains(west: number, east: number, lng: number): boolean {
  if (west <= east) return lng >= west && lng <= east;
  return lng >= west || lng <= east;
}

function bboxCells(bbox: BBox, size: number): string[] {
  const [[west, south], [east, north]] = bbox;
  const latStart = latToRow(south, size);
  const latEnd = latToRow(north, size);
  const keys: string[] = [];

  const addLngRange = (from: number, to: number) => {
    const start = lngToCol(from, size);
    const end = lngToCol(to, size);
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    for (let row = latStart; row <= latEnd; row += 1) {
      for (let col = lo; col <= hi; col += 1) {
        keys.push(`${col}:${row}`);
      }
    }
  };

  if (west <= east) {
    addLngRange(west, east);
  } else {
    addLngRange(west, 180);
    addLngRange(-180, east);
  }

  return keys;
}
