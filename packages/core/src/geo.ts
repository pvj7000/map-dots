import type { Feature, FeatureCollection, Geometry } from "geojson";
import { normalizeContinent } from "./continents.js";

export interface FeatureMeta {
  iso: string;
  name: string;
  continent?: string;
}

export function featureMeta(feature: Feature): FeatureMeta {
  const props = (feature.properties ?? {}) as Record<string, unknown>;
  const rawIso = props.iso ?? props.ISO_A3 ?? props.iso_a3 ?? props.ADM0_A3 ?? feature.id;
  const iso = String(rawIso ?? "UNK");
  const name = String(props.name ?? props.NAME ?? props.ADMIN ?? iso);
  const continentValue = props.continent ?? props.CONTINENT;
  return {
    iso,
    name,
    continent: continentValue == null ? undefined : String(continentValue),
  };
}

export function filterCollection(
  geojson: FeatureCollection,
  options: { countries?: string[]; continents?: string[]; exclude?: string[] },
): FeatureCollection {
  const allowCountries = options.countries?.length
    ? new Set(options.countries.map((code) => code.toUpperCase()))
    : null;
  const allowContinents = options.continents?.length
    ? new Set(
        options.continents
          .map((value) => normalizeContinent(value))
          .filter((value): value is NonNullable<typeof value> => Boolean(value)),
      )
    : null;
  const deny = new Set((options.exclude ?? []).map((code) => code.toUpperCase()));

  return {
    type: "FeatureCollection",
    features: geojson.features.filter((feature) => {
      const meta = featureMeta(feature);
      const code = meta.iso.toUpperCase();
      if (deny.has(code)) return false;
      if (!feature.geometry) return false;

      const countryOk = allowCountries ? allowCountries.has(code) : false;
      const continentId = normalizeContinent(meta.continent);
      const continentOk = allowContinents ? Boolean(continentId && allowContinents.has(continentId)) : false;

      if (allowCountries && allowContinents) return countryOk || continentOk;
      if (allowCountries) return countryOk;
      if (allowContinents) return continentOk;
      return true;
    }),
  };
}

export function asPolygonFeatures(feature: Feature): Feature[] {
  const geometry = feature.geometry;
  if (!geometry) return [];
  if (geometry.type === "Polygon") {
    return [feature];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((coordinates, index) => ({
      type: "Feature" as const,
      id: `${featureMeta(feature).iso}:${index}`,
      properties: feature.properties,
      geometry: { type: "Polygon" as const, coordinates },
    }));
  }
  return [];
}

export function isGeometry(value: unknown): value is Geometry {
  return Boolean(value && typeof value === "object" && "type" in value);
}
