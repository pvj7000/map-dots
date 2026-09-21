import type { MapOptions, Region } from "./types.js";

export type ContinentId =
  | "africa"
  | "antarctica"
  | "asia"
  | "europe"
  | "north-america"
  | "oceania"
  | "south-america";

export interface ContinentInfo {
  id: ContinentId;
  label: string;
  geoNames: string[];
  region: Region;
}

const CONTINENT_LIST: ContinentInfo[] = [
  {
    id: "africa",
    label: "Africa",
    geoNames: ["Africa"],
    region: { lat: [-36, 38], lng: [-26, 58] },
  },
  {
    id: "antarctica",
    label: "Antarctica",
    geoNames: ["Antarctica"],
    region: { lat: [-90, -60], lng: [-180, 180] },
  },
  {
    id: "asia",
    label: "Asia",
    geoNames: ["Asia"],
    region: { lat: [-12, 78], lng: [26, 180] },
  },
  {
    id: "europe",
    label: "Europe",
    geoNames: ["Europe"],
    region: { lat: [34, 72], lng: [-32, 45] },
  },
  {
    id: "north-america",
    label: "North America",
    geoNames: ["North America"],
    region: { lat: [5, 84], lng: [-170, -20] },
  },
  {
    id: "oceania",
    label: "Oceania",
    geoNames: ["Oceania"],
    region: { lat: [-48, 8], lng: [110, 180] },
  },
  {
    id: "south-america",
    label: "South America",
    geoNames: ["South America"],
    region: { lat: [-56, 14], lng: [-92, -32] },
  },
];

const BY_ID = new Map(CONTINENT_LIST.map((item) => [item.id, item]));

const ALIASES: Record<string, ContinentId> = {
  africa: "africa",
  antarctica: "antarctica",
  asia: "asia",
  europe: "europe",
  oceania: "oceania",
  australia: "oceania",
  "north america": "north-america",
  "north-america": "north-america",
  northamerica: "north-america",
  na: "north-america",
  "south america": "south-america",
  "south-america": "south-america",
  southamerica: "south-america",
  sa: "south-america",
};

export const CONTINENTS: readonly ContinentInfo[] = CONTINENT_LIST.filter(
  (item) => item.id !== "antarctica",
);

export function normalizeContinent(value?: string | null): ContinentId | null {
  if (!value) return null;
  const key = value.trim().toLowerCase().replace(/[_/]+/g, " ").replace(/\s+/g, " ");
  return ALIASES[key] ?? ALIASES[key.replace(/ /g, "-")] ?? null;
}

export function continentInfo(value?: string | null): ContinentInfo | null {
  const id = normalizeContinent(value);
  return id ? (BY_ID.get(id) ?? null) : null;
}

/** Options to crop and fit the map to one continent. */
export function continentView(
  value: ContinentId | string,
): Pick<MapOptions, "continents" | "countries" | "region" | "exclude"> {
  const info = continentInfo(value);
  if (!info) {
    throw new Error(`Unknown continent: ${value}`);
  }

  if (info.id === "asia") {
    return {
      continents: ["asia"],
      countries: ["RUS"],
      region: info.region,
      exclude: ["ATA"],
    };
  }

  return {
    continents: [info.id],
    region: info.region,
    exclude: ["ATA"],
  };
}

export function continentKeys(value?: string | null): string[] {
  const keys: string[] = [];
  if (value) {
    keys.push(value, value.toLowerCase());
  }
  const id = normalizeContinent(value);
  if (id) keys.push(id, continentInfo(id)?.label ?? id);
  return [...new Set(keys)];
}
