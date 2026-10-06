import {
  createMap,
  parsePreset,
  type MapPreset,
  type MapOptions,
} from "@dotmap/core";
import { resolveTheme, type ThemePreset } from "@dotmap/theme";
import world from "@dotmap/world";
import { appearanceForTheme, buildPreset } from "./export-source";
import {
  countryGroups,
  continentGroupMap,
  groupsForTheme,
  pins,
  scopes,
  viewOptions,
  type ScopeId,
} from "./presence";

export type Starter = "presence" | "continents" | "blank";
export const DRAFT_KEY = "dotmap.preset.v1";
type DraftStorage = Pick<Storage, "getItem" | "setItem">;

export function starterPreset(starter: Starter): MapPreset {
  const theme = starter === "blank" ? "ink" : "paper";
  const groups = groupsForTheme(theme, "presence");
  return buildPreset({
    pins: starter === "presence" ? pins.map((pin) => ({ ...pin })) : [],
    groups:
      starter === "continents"
        ? [...groupsForTheme(theme, "continents"), ...groups]
        : groups,
    countryGroups:
      starter === "presence"
        ? countryGroups
        : starter === "continents"
          ? { RUS: "asia" }
          : {},
    continentGroups: starter === "continents" ? continentGroupMap : {},
    grid: "diagonal",
    projection: "robinson",
    spacing: starter === "blank" ? 10 : 8,
    scope: "world",
    theme,
    hoverMode: starter === "continents" ? "continent" : "country",
    appearance: appearanceForTheme(theme),
  }) as MapPreset;
}

export function importPreset(source: string): MapPreset {
  const preset = parsePreset(source);
  // Check geographic filters against the same dataset as the actual preview.
  createMap({ geojson: world, ...preset.map });
  return preset;
}

export function loadDraft(fallback: MapPreset, storage?: DraftStorage) {
  try {
    const source = (storage ?? window.localStorage).getItem(DRAFT_KEY);
    return source
      ? {
          preset: importPreset(source),
          restored: true,
          message: "Restored your saved map.",
        }
      : {
          preset: fallback,
          restored: false,
          message: "Your changes are saved in this browser.",
        };
  } catch (error) {
    return {
      preset: fallback,
      restored: false,
      message: `Could not restore a saved map. ${error instanceof Error ? error.message : "Browser storage is unavailable."} You can still import and export presets.`,
    };
  }
}

export function saveDraft(
  preset: MapPreset,
  storage?: DraftStorage,
): string | null {
  try {
    (storage ?? window.localStorage).setItem(DRAFT_KEY, JSON.stringify(preset));
    return null;
  } catch {
    return "Autosave is unavailable in this browser. Download a JSON preset to keep your work.";
  }
}

export function presetScope(
  map: Omit<MapOptions, "geojson">,
): ScopeId | "custom" {
  const crop = (m: Partial<MapOptions>) =>
    JSON.stringify({
      countries: m.countries ?? [],
      continents: m.continents ?? [],
      region: m.region ?? null,
    });
  return (
    scopes.find((scope) => crop(viewOptions(scope.id)) === crop(map))?.id ??
    "custom"
  );
}

export function presetTheme(preset: MapPreset): ThemePreset {
  if (typeof preset.display.theme === "string") return preset.display.theme;
  const theme = resolveTheme(preset.display.theme);
  return theme.labelColor === "#e8eef4"
    ? "midnight"
    : theme.labelColor === "#141210"
      ? "ink"
      : "paper";
}
