import type {
  ComputeInput,
  GridTopology,
  GroupDef,
  HoverMode,
  PinInput,
  MapPreset,
  ProjectionName,
} from "@dotmap/core";
import { PRESETS, type DotMapTheme, type ThemePreset } from "@dotmap/theme";
import { viewOptions, type ScopeId } from "./presence";

export type ExportFormat = "json" | "react" | "html";
export interface Appearance {
  background: string;
  land: string;
  dotSize: number;
}
export interface PresetOptions {
  pins: PinInput[];
  groups: GroupDef[];
  countryGroups: Record<string, string | string[]>;
  continentGroups: Record<string, string | string[]>;
  grid: GridTopology;
  projection: ProjectionName;
  spacing: number;
  scope: ScopeId;
  theme: ThemePreset;
  hoverMode: HoverMode;
  appearance: Appearance;
}

export const MAP_DIMENSIONS = { width: 1100, height: 540, padding: 28 };
export const LABEL_OPTIONS = {
  connector: "elbow",
  fontSize: 12,
  gap: 20,
} satisfies NonNullable<ComputeInput["labels"]>;

export function appearanceForTheme(theme: ThemePreset): Appearance {
  return {
    background:
      theme === "midnight"
        ? "#121922"
        : theme === "ink"
          ? "#f7f6f3"
          : "#fffaf1",
    land: PRESETS[theme].land,
    dotSize: Number(PRESETS[theme].dotSize),
  };
}

export function customTheme(
  theme: ThemePreset,
  appearance: Appearance,
): DotMapTheme {
  return {
    ...PRESETS[theme],
    bg: appearance.background,
    land: appearance.land,
    dotSize: String(appearance.dotSize),
    pinStroke: appearance.background,
    labelHalo: appearance.background,
  };
}

/** Uses the engine's options directly, so a preset can be reused without the builder. */
export function buildPreset(options: PresetOptions) {
  return {
    version: 1,
    map: {
      ...MAP_DIMENSIONS,
      grid: options.grid,
      projection: options.projection,
      spacing: options.spacing,
      ...viewOptions(options.scope),
    },
    content: {
      pins: options.pins,
      groups: options.groups,
      countryGroups: options.countryGroups,
      continentGroups: options.continentGroups,
      labels: LABEL_OPTIONS,
    },
    display: {
      theme: customTheme(options.theme, options.appearance),
      hoverMode: options.hoverMode,
    },
  };
}

export function exportSource(
  format: ExportFormat,
  options: PresetOptions | MapPreset,
  browserBundleUrl = "./dotmap.js",
): string {
  const preset: MapPreset =
    "version" in options ? options : (buildPreset(options) as MapPreset);
  if (format === "json") return JSON.stringify(preset, null, 2);
  if (format === "react") {
    return `"use client";

import { createMap, type ComputeInput, type MapOptions } from "@dotmap/toolkit/core";
import { DotMap, Legend } from "@dotmap/toolkit/react";
import world from "@dotmap/toolkit/world";
import { resolveTheme } from "@dotmap/toolkit/theme";
import "@dotmap/toolkit/styles.css";

const options = ${JSON.stringify(preset.map, null, 2)} satisfies Omit<MapOptions, "geojson">;

const content = ${JSON.stringify(preset.content, null, 2)} satisfies ComputeInput;

const theme = resolveTheme(${JSON.stringify(preset.display.theme ?? "paper", null, 2)});
const map = createMap({ geojson: world, ...options });
const snapshot = map.compute(content);

export default function CustomMap() {
  return (
    <div style={{ background: theme.bg, color: theme.ink, padding: 16 }}>
      <DotMap snapshot={snapshot} theme={theme} hoverMode="${preset.display.hoverMode ?? "country"}" shape="${preset.display.shape ?? "circle"}" showOcean={${preset.display.showOcean ?? false}} />
      <Legend items={snapshot.legend} />
    </div>
  );
}
`;
  }
  // Keep a literal closing script tag in a user label inside the JSON string.
  const scriptJson = (value: unknown) =>
    JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
  const escapeAttribute = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My DotMap</title>
    <script defer src="${escapeAttribute(browserBundleUrl)}"></script>
  </head>
  <body>
    <dot-map id="custom-map" hover-mode="${preset.display.hoverMode ?? "country"}"
      shape="${preset.display.shape ?? "circle"}" ${preset.display.showOcean ? "show-ocean" : ""}></dot-map>
    <script type="module">
      await customElements.whenDefined("dot-map");
      const map = document.querySelector("#custom-map");
      map.options = ${scriptJson(preset.map)};
      map.pins = ${scriptJson(preset.content.pins ?? [])};
      map.groups = ${scriptJson(preset.content.groups ?? [])};
      map.countryGroups = ${scriptJson(preset.content.countryGroups ?? {})};
      map.continentGroups = ${scriptJson(preset.content.continentGroups ?? {})};
      map.labels = ${scriptJson(preset.content.labels ?? {})};
      map.theme = ${scriptJson(preset.display.theme ?? "paper")};
    </script>
  </body>
</html>
`;
}
