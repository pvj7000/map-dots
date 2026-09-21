import {
  CONTINENTS,
  continentView,
  type ContinentId,
  type GroupDef,
  type GridTopology,
  type HoverMode,
  type MapOptions,
  type PinInput,
  type ProjectionName,
} from "@dotmap/core";
import type { ThemePreset } from "@dotmap/theme";

export type ScopeId = "world" | ContinentId;
export type ColorMode = "presence" | "continents";

export const groups: GroupDef[] = [
  { id: "teams", label: "Teams", color: "#0f766e", description: "Office locations" },
  { id: "targets", label: "Zielländer", color: "#5c6b7a", description: "Active markets" },
];

export const continentGroups: GroupDef[] = [
  { id: "europe", label: "Europe", color: "#3d6b8c" },
  { id: "asia", label: "Asia", color: "#c8963e" },
  { id: "africa", label: "Africa", color: "#c26d4a" },
  { id: "north-america", label: "North America", color: "#0f766e" },
  { id: "south-america", label: "South America", color: "#8a5a7a" },
  { id: "oceania", label: "Oceania", color: "#4f8f7b" },
];

export function groupsForTheme(theme: ThemePreset, mode: ColorMode): GroupDef[] {
  if (mode === "continents") {
    if (theme === "midnight") {
      return [
        { id: "europe", label: "Europe", color: "#7dd3fc" },
        { id: "asia", label: "Asia", color: "#fbbf24" },
        { id: "africa", label: "Africa", color: "#fb7185" },
        { id: "north-america", label: "North America", color: "#2dd4bf" },
        { id: "south-america", label: "South America", color: "#e879f9" },
        { id: "oceania", label: "Oceania", color: "#34d399" },
      ];
    }
    return continentGroups;
  }
  if (theme === "midnight") {
    return [
      { id: "teams", label: "Teams", color: "#2dd4bf", description: "Office locations" },
      { id: "targets", label: "Zielländer", color: "#94a3b8", description: "Active markets" },
    ];
  }
  return groups;
}

export const pins: PinInput[] = [
  { id: "vie", lat: 48.2082, lng: 16.3738, label: "Wien", group: "teams", preferredAnchor: "right" },
  { id: "bog", lat: 4.711, lng: -74.0721, label: "Bogotá", group: "teams", preferredAnchor: "left" },
  { id: "nyc", lat: 40.7128, lng: -74.006, label: "New York", group: "teams", preferredAnchor: "left" },
  { id: "sin", lat: 1.3521, lng: 103.8198, label: "Singapur", group: "teams", preferredAnchor: "left" },
  { id: "cpt", lat: -33.9249, lng: 18.4241, label: "Kapstadt", group: "teams", preferredAnchor: "right" },
];

export const countryGroups: Record<string, string> = {
  AUT: "teams",
  COL: "teams",
  USA: "teams",
  SGP: "teams",
  ZAF: "teams",
  DEU: "targets",
  CHE: "targets",
  FRA: "targets",
  ITA: "targets",
  ESP: "targets",
  GBR: "targets",
  NLD: "targets",
  POL: "targets",
  CZE: "targets",
  SWE: "targets",
  BRA: "targets",
  MEX: "targets",
  ARG: "targets",
  CHL: "targets",
  CAN: "targets",
  IND: "targets",
  JPN: "targets",
  AUS: "targets",
  KEN: "targets",
};

export const continentGroupMap: Record<string, string> = {
  europe: "europe",
  asia: "asia",
  africa: "africa",
  "north-america": "north-america",
  "south-america": "south-america",
  oceania: "oceania",
};

export const scopes: { id: ScopeId; label: string }[] = [
  { id: "world", label: "World" },
  ...CONTINENTS.map((item) => ({ id: item.id, label: item.label })),
];

export const projections: { id: ProjectionName; label: string }[] = [
  { id: "robinson", label: "Robinson" },
  { id: "naturalEarth", label: "Natural Earth" },
  { id: "equalEarth", label: "Equal Earth" },
  { id: "mercator", label: "Mercator" },
  { id: "equirectangular", label: "Equirectangular" },
  { id: "miller", label: "Miller" },
  { id: "mollweide", label: "Mollweide" },
];

export const grids: { id: GridTopology; label: string; hint: string }[] = [
  { id: "square", label: "Square", hint: "Orthogonal matrix" },
  { id: "diagonal", label: "Diagonal", hint: "Staggered rows" },
  { id: "hex", label: "Hex", hint: "True hex packing" },
];

export const themes: { id: ThemePreset; label: string }[] = [
  { id: "paper", label: "Paper" },
  { id: "ink", label: "Ink" },
  { id: "midnight", label: "Midnight" },
];

export const hoverModes: { id: HoverMode; label: string; hint: string }[] = [
  { id: "none", label: "None", hint: "Static" },
  { id: "dot", label: "Dot", hint: "Scale one cell" },
  { id: "country", label: "Country", hint: "Light the ISO" },
  { id: "group", label: "Group", hint: "Related marks" },
  { id: "continent", label: "Continent", hint: "Whole region" },
];

export function viewOptions(scope: ScopeId): Partial<MapOptions> {
  if (scope === "world") return {};
  return continentView(scope);
}

export function sampleSource(
  grid: GridTopology,
  projection: ProjectionName,
  scope: ScopeId,
  theme: ThemePreset,
  hoverMode: HoverMode,
): string {
  const view =
    scope === "world"
      ? ""
      : `
  ...continentView('${scope}'),`;
  return `import { createMap, continentView } from '@dotmap/core';
import { DotMap, Legend } from '@dotmap/react';
import world from '@dotmap/world';

const map = createMap({
  geojson: world,
  grid: '${grid}',
  projection: '${projection}',
  width: 1100,${view}
});

const snapshot = map.compute({
  pins: [{ lat: 48.2082, lng: 16.3738, label: 'Wien', group: 'teams' }],
  countryGroups: { AUT: 'teams', DEU: 'targets' },
});

<DotMap
  snapshot={snapshot}
  theme="${theme}"
  hoverMode="${hoverMode}"
  style={{ '--dotmap-hover-scale': '1.8' }}
/>

// any site, no React:
// <script type="module" src="@dotmap/element"></script>
// <dot-map theme="${theme}" hover-mode="${hoverMode}" grid="${grid}"></dot-map>`;
}
