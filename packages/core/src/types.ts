import type { FeatureCollection } from "geojson";

export type GridTopology = "square" | "diagonal" | "hex";

export type ProjectionName =
  | "mercator"
  | "equirectangular"
  | "equalEarth"
  | "naturalEarth"
  | "robinson"
  | "mollweide"
  | "miller"
  | "orthographic";

export type LabelAnchor =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type ConnectorStyle = "line" | "elbow" | "none";

export type DotShape = "circle" | "square" | "hexagon";

export type HoverMode = "none" | "dot" | "country" | "group" | "continent";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Region {
  lat: [min: number, max: number];
  lng: [min: number, max: number];
}

export interface GroupDef {
  id: string;
  label: string;
  color: string;
  description?: string;
}

export interface PinInput {
  id?: string;
  lat: number;
  lng: number;
  label?: string;
  group?: string;
  color?: string;
  priority?: number;
  preferredAnchor?: LabelAnchor;
  data?: unknown;
}

export interface Dot {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  land: boolean;
  country?: string;
  countryName?: string;
  continent?: string;
  groups: string[];
}

export interface GridSnap {
  x: number;
  y: number;
  col: number;
  row: number;
  lat: number;
  lng: number;
  country?: string;
  countryName?: string;
  distance: number;
  land: boolean;
}

export interface PlacedPin {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  group?: string;
  color?: string;
  priority?: number;
  preferredAnchor?: LabelAnchor;
  data?: unknown;
  snapped: GridSnap;
  projected: { x: number; y: number };
}

export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelPlacement {
  pinId: string;
  text: string;
  anchor: LabelAnchor;
  x: number;
  y: number;
  align: "start" | "middle" | "end";
  baseline: "middle" | "auto" | "hanging";
  connector: {
    style: ConnectorStyle;
    points: { x: number; y: number }[];
  };
  box: LabelBox;
}

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  description?: string;
  count: number;
  pinCount: number;
  countries: string[];
  dotIds: string[];
}

export interface MapSnapshot {
  width: number;
  height: number;
  grid: GridTopology;
  projection: ProjectionName;
  spacing: number;
  dots: Dot[];
  landDots: Dot[];
  pins: PlacedPin[];
  labels: LabelPlacement[];
  legend: LegendItem[];
  matrix: number[][];
}

export interface ProjectionConfig {
  name: ProjectionName;
  center?: LatLng;
}

export interface MapOptions {
  geojson: FeatureCollection;
  width?: number;
  height?: number;
  spacing?: number;
  grid?: GridTopology;
  projection?: ProjectionName | ProjectionConfig;
  padding?: number;
  region?: Region;
  countries?: string[];
  continents?: string[];
  exclude?: string[];
  includeOcean?: boolean;
}

export interface LabelOptions {
  enabled?: boolean;
  fontSize?: number;
  gap?: number;
  connector?: ConnectorStyle;
}

export interface ComputeInput {
  pins?: PinInput[];
  groups?: GroupDef[];
  countryGroups?: Record<string, string | string[]>;
  continentGroups?: Record<string, string | string[]>;
  labels?: LabelOptions;
}

export interface MapHighlight {
  group?: string | null;
  country?: string | null;
  continent?: string | null;
  pin?: string | null;
  cell?: string | null;
}

export interface FrozenProjection {
  name: ProjectionName;
  scale: number;
  translate: [number, number];
  rotate: [number, number, number];
  center: [number, number];
  clipAngle: number | null;
}

export interface SerializedMap {
  v: 1;
  width: number;
  height: number;
  spacing: number;
  grid: GridTopology;
  projection: FrozenProjection;
  includeOcean: boolean;
  originX: number;
  originY: number;
  xStep: number;
  yStep: number;
  cols: number;
  rows: number;
  dots: Dot[];
  matrix: number[][];
}

export interface SvgRenderOptions {
  landColor?: string;
  oceanColor?: string;
  background?: string;
  pinRadius?: number;
  dotRadius?: number;
  showOcean?: boolean;
  showLabels?: boolean;
  labelColor?: string;
  connectorColor?: string;
  fontFamily?: string;
  fontSize?: number;
  shape?: DotShape;
  highlightGroup?: string | null;
}

export interface GridLayout {
  topology: GridTopology;
  cols: number;
  rows: number;
  xStep: number;
  yStep: number;
  originX: number;
  originY: number;
  stagger: (row: number) => number;
}
