import { geoArea, geoCentroid, type GeoProjection } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { featureMeta, filterCollection } from "./geo.js";
import { cellCenter, cellKey, createGridLayout, nearestCell } from "./grid.js";
import { placeLabels } from "./labels.js";
import { applyGroups, buildLegend } from "./legend.js";
import { buildCountryIndex, inRegion, lookupCountry, type CountryIndex } from "./lookup.js";
import {
  createProjection,
  freezeProjection,
  invertPoint,
  projectPoint,
  resolveProjectionConfig,
  restoreProjection,
} from "./projections.js";
import type {
  ComputeInput,
  Dot,
  GridLayout,
  GridSnap,
  MapOptions,
  MapSnapshot,
  PinInput,
  PlacedPin,
  Region,
  SerializedMap,
} from "./types.js";

export interface DotMap {
  readonly width: number;
  readonly height: number;
  readonly dots: Dot[];
  readonly matrix: number[][];
  project(lat: number, lng: number): { x: number; y: number } | null;
  invert(x: number, y: number): { lat: number; lng: number } | null;
  latLngToGrid(lat: number, lng: number, options?: { landOnly?: boolean }): GridSnap | null;
  compute(input?: ComputeInput): MapSnapshot;
  toJSON(): SerializedMap;
}

interface EngineState {
  width: number;
  height: number;
  spacing: number;
  includeOcean: boolean;
  layout: GridLayout;
  projectionName: ReturnType<typeof resolveProjectionConfig>["name"];
  projection: GeoProjection;
  cells: Dot[];
  byId: Map<string, Dot>;
  byCountry: Map<string, Dot[]>;
  index: CountryIndex | null;
  matrix: number[][];
  region?: Region;
  cropped: boolean;
}

export function createMap(options: MapOptions): DotMap {
  if (!options.geojson || options.geojson.type !== "FeatureCollection") {
    throw new Error("createMap requires a GeoJSON FeatureCollection");
  }

  const width = options.width ?? 960;
  const height = options.height ?? Math.round(width * 0.5);
  const spacing = options.spacing ?? 12;
  const padding = options.padding ?? 36;
  const grid = options.grid ?? "diagonal";
  const includeOcean = options.includeOcean ?? false;
  const projectionConfig = resolveProjectionConfig(options.projection);
  const geojson = filterCollection(options.geojson, {
    countries: options.countries,
    continents: options.continents,
    exclude: options.exclude ?? ["ATA"],
  });
  const cropped = Boolean(options.countries?.length || options.continents?.length || options.region);

  if (geojson.features.length === 0) {
    throw new Error("createMap: no features left after country filters");
  }

  const projection = createProjection(
    projectionConfig,
    geojson,
    width,
    height,
    padding,
    options.region,
  );
  const layout = createGridLayout({ width, height, spacing, topology: grid, padding });
  const index = buildCountryIndex(geojson);
  const cells: Dot[] = [];
  const matrix: number[][] = Array.from({ length: layout.rows }, () =>
    Array.from({ length: layout.cols }, () => 0),
  );

  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      const { x, y } = cellCenter(layout, col, row);
      const geo = invertPoint(projection, x, y);
      if (!geo || !inRegion(geo.lat, geo.lng, options.region)) {
        cells.push(oceanDot(col, row, x, y, geo?.lat ?? 0, geo?.lng ?? 0));
        continue;
      }
      const country = lookupCountry(geo.lng, geo.lat, index);
      const land = Boolean(country);
      matrix[row][col] = land ? 1 : 0;
      cells.push({
        id: cellKey(col, row),
        col,
        row,
        x,
        y,
        lat: geo.lat,
        lng: geo.lng,
        land,
        country: country?.iso,
        countryName: country?.name,
        continent: country?.continent,
        groups: [],
      });
    }
  }

  const byId = new Map(cells.map((dot) => [dot.id, dot]));
  seedMissingCountries(geojson, cells, byId, matrix, layout, projection);

  return createEngine({
    width,
    height,
    spacing,
    includeOcean,
    layout,
    projectionName: projectionConfig.name,
    projection,
    cells,
    byId,
    byCountry: indexByCountry(cells),
    index,
    matrix,
    region: options.region,
    cropped,
  });
}

export function fromJSON(data: SerializedMap): DotMap {
  if (data.v !== 1) throw new Error("Unsupported DotMap serialization version");
  const layout: GridLayout = {
    topology: data.grid,
    cols: data.cols,
    rows: data.rows,
    xStep: data.xStep,
    yStep: data.yStep,
    originX: data.originX,
    originY: data.originY,
    stagger: (row: number) =>
      data.grid === "square" ? 0 : row % 2 === 1 ? data.xStep / 2 : 0,
  };
  return createEngine({
    width: data.width,
    height: data.height,
    spacing: data.spacing,
    includeOcean: data.includeOcean,
    layout,
    projectionName: data.projection.name,
    projection: restoreProjection(data.projection),
    cells: data.dots,
    byId: new Map(data.dots.map((dot) => [dot.id, dot])),
    byCountry: indexByCountry(data.dots),
    index: null,
    matrix: data.matrix,
    cropped: false,
  });
}

function createEngine(state: EngineState): DotMap {
  const publicDots = state.includeOcean ? state.cells : state.cells.filter((dot) => dot.land);

  const latLngToGrid = (lat: number, lng: number, options?: { landOnly?: boolean }): GridSnap | null => {
    const projected = projectPoint(state.projection, lat, lng);
    if (!projected) return null;
    const landOnly = options?.landOnly !== false;
    const country = state.index ? lookupCountry(lng, lat, state.index) : undefined;
    const owned = country ? state.byCountry.get(country.iso) : undefined;

    if (landOnly && owned && owned.length > 0) {
      return snapFromDot(nearestDot(owned, projected.x, projected.y), projected);
    }

    const approx = nearestCell(state.layout, projected.x, projected.y);
    const local = collectNeighborhood(state, approx.col, approx.row, landOnly ? 6 : 1, landOnly);
    const best = nearestDot(local.length > 0 ? local : landOnly ? state.cells.filter((dot) => dot.land) : local, projected.x, projected.y);
    return best ? snapFromDot(best, projected) : null;
  };

  const placePins = (pins: PinInput[]): PlacedPin[] =>
    pins.flatMap((pin, index) => {
      if (state.region && !inRegion(pin.lat, pin.lng, state.region)) return [];
      const projected = projectPoint(state.projection, pin.lat, pin.lng);
      const snapped = latLngToGrid(pin.lat, pin.lng);
      if (!projected || !snapped) return [];
      if (state.cropped && !pointOnCanvas(projected, state.width, state.height)) return [];
      return [
        {
          id: pin.id ?? `pin-${index}`,
          lat: pin.lat,
          lng: pin.lng,
          label: pin.label,
          group: pin.group,
          color: pin.color,
          priority: pin.priority,
          preferredAnchor: pin.preferredAnchor,
          data: pin.data,
          snapped,
          projected,
        },
      ];
    });

  return {
    width: state.width,
    height: state.height,
    dots: publicDots,
    matrix: state.matrix,
    project: (lat, lng) => projectPoint(state.projection, lat, lng),
    invert: (x, y) => invertPoint(state.projection, x, y),
    latLngToGrid,
    compute(input: ComputeInput = {}): MapSnapshot {
      const pins = placePins(input.pins ?? []);
      const grouped = applyGroups(state.cells, input.countryGroups, pins, input.continentGroups);
      const visible = state.includeOcean ? grouped : grouped.filter((dot) => dot.land);
      const labels = placeLabels(pins, grouped, state.width, state.height, input.labels);
      return {
        width: state.width,
        height: state.height,
        grid: state.layout.topology,
        projection: state.projectionName,
        spacing: state.spacing,
        dots: visible,
        landDots: grouped.filter((dot) => dot.land),
        pins,
        labels,
        legend: buildLegend(input.groups ?? [], visible, pins),
        matrix: state.matrix,
      };
    },
    toJSON(): SerializedMap {
      return {
        v: 1,
        width: state.width,
        height: state.height,
        spacing: state.spacing,
        grid: state.layout.topology,
        projection: freezeProjection(state.projectionName, state.projection),
        includeOcean: state.includeOcean,
        originX: state.layout.originX,
        originY: state.layout.originY,
        xStep: state.layout.xStep,
        yStep: state.layout.yStep,
        cols: state.layout.cols,
        rows: state.layout.rows,
        dots: state.cells,
        matrix: state.matrix,
      };
    },
  };
}

function seedMissingCountries(
  geojson: FeatureCollection,
  cells: Dot[],
  byId: Map<string, Dot>,
  matrix: number[][],
  layout: GridLayout,
  projection: GeoProjection,
): void {
  const counts = new Map<string, number>();
  for (const dot of cells) {
    if (!dot.land || !dot.country) continue;
    counts.set(dot.country, (counts.get(dot.country) ?? 0) + 1);
  }

  const missing = geojson.features
    .map((feature) => ({ feature, meta: featureMeta(feature), area: geoArea(feature) }))
    .filter((item) => (counts.get(item.meta.iso) ?? 0) === 0)
    .sort((a, b) => a.area - b.area);

  for (const item of missing) {
    const [lng, lat] = geoCentroid(item.feature);
    const projected = projectPoint(projection, lat, lng);
    if (!projected) continue;
    const target = pickSeedCell(layout, byId, counts, projected.x, projected.y);
    if (!target) continue;
    if (target.land && target.country) {
      counts.set(target.country, Math.max(0, (counts.get(target.country) ?? 1) - 1));
    }
    target.land = true;
    target.country = item.meta.iso;
    target.countryName = item.meta.name;
    target.continent = item.meta.continent;
    matrix[target.row][target.col] = 1;
    counts.set(item.meta.iso, 1);
  }
}

function pickSeedCell(
  layout: GridLayout,
  byId: Map<string, Dot>,
  counts: Map<string, number>,
  x: number,
  y: number,
): Dot | null {
  const start = nearestCell(layout, x, y);
  const ranked: { dot: Dot; distance: number; stealCost: number }[] = [];

  for (let row = start.row - 3; row <= start.row + 3; row += 1) {
    for (let col = start.col - 3; col <= start.col + 3; col += 1) {
      const dot = byId.get(cellKey(col, row));
      if (!dot) continue;
      const ownerCount = dot.country ? (counts.get(dot.country) ?? 0) : 0;
      const stealCost = !dot.land ? 0 : ownerCount <= 1 ? 50 : 8;
      ranked.push({
        dot,
        distance: (dot.x - x) ** 2 + (dot.y - y) ** 2,
        stealCost,
      });
    }
  }

  ranked.sort((a, b) => a.stealCost - b.stealCost || a.distance - b.distance);
  return ranked[0]?.dot ?? null;
}

function indexByCountry(cells: Dot[]): Map<string, Dot[]> {
  const map = new Map<string, Dot[]>();
  for (const dot of cells) {
    if (!dot.land || !dot.country) continue;
    const list = map.get(dot.country);
    if (list) list.push(dot);
    else map.set(dot.country, [dot]);
  }
  return map;
}

function collectNeighborhood(
  state: EngineState,
  col: number,
  row: number,
  radius: number,
  landOnly: boolean,
): Dot[] {
  const found: Dot[] = [];
  for (let r = row - radius; r <= row + radius; r += 1) {
    for (let c = col - radius; c <= col + radius; c += 1) {
      const dot = state.byId.get(cellKey(c, r));
      if (!dot) continue;
      if (landOnly && !dot.land) continue;
      found.push(dot);
    }
  }
  return found;
}

function nearestDot(dots: Dot[], x: number, y: number): Dot | null {
  let best: Dot | null = null;
  let bestDistance = Infinity;
  for (const dot of dots) {
    const distance = (dot.x - x) ** 2 + (dot.y - y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = dot;
    }
  }
  return best;
}

function snapFromDot(dot: Dot, projected: { x: number; y: number }): GridSnap {
  return {
    x: dot.x,
    y: dot.y,
    col: dot.col,
    row: dot.row,
    lat: dot.lat,
    lng: dot.lng,
    country: dot.country,
    countryName: dot.countryName,
    distance: Math.hypot(dot.x - projected.x, dot.y - projected.y),
    land: dot.land,
  };
}

function pointOnCanvas(
  point: { x: number; y: number },
  width: number,
  height: number,
  margin = 48,
): boolean {
  return point.x >= -margin && point.x <= width + margin && point.y >= -margin && point.y <= height + margin;
}

function oceanDot(col: number, row: number, x: number, y: number, lat: number, lng: number): Dot {
  return {
    id: cellKey(col, row),
    col,
    row,
    x,
    y,
    lat,
    lng,
    land: false,
    groups: [],
  };
}
