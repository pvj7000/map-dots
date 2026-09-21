export { createMap, fromJSON, type DotMap } from "./create-map.js";
export { formatMatrix, hexPath, renderSVG, resolveDotColor, shapeNode } from "./svg.js";
export { estimateTextWidth, placeLabels } from "./labels.js";
export {
  applyGroups,
  buildLegend,
  hasHighlight,
  highlightFromHover,
  hoverRelatesSiblings,
  matchHighlight,
} from "./legend.js";
export { createGridLayout, cellCenter, cellKey, nearestCell } from "./grid.js";
export {
  CONTINENTS,
  continentInfo,
  continentKeys,
  continentView,
  normalizeContinent,
  type ContinentId,
  type ContinentInfo,
} from "./continents.js";

export type {
  ComputeInput,
  ConnectorStyle,
  Dot,
  DotShape,
  FrozenProjection,
  GridLayout,
  GridSnap,
  GridTopology,
  GroupDef,
  HoverMode,
  LabelAnchor,
  LabelBox,
  LabelOptions,
  LabelPlacement,
  LatLng,
  LegendItem,
  MapHighlight,
  MapOptions,
  MapSnapshot,
  PinInput,
  PlacedPin,
  ProjectionConfig,
  ProjectionName,
  Region,
  SerializedMap,
  SvgRenderOptions,
} from "./types.js";
