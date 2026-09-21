import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dest = resolve(dirname(fileURLToPath(import.meta.url)), "../packages/world/src/countries.json");
const url =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

const raw = await fetch(url).then((response) => {
  if (!response.ok) throw new Error(`Failed to download world GeoJSON: ${response.status}`);
  return response.json();
});

const roundRing = (ring) => ring.map(([lng, lat]) => [Math.round(lng * 100) / 100, Math.round(lat * 100) / 100]);

const compactGeom = (geom) => {
  if (geom.type === "Polygon") return { type: "Polygon", coordinates: geom.coordinates.map(roundRing) };
  if (geom.type === "MultiPolygon") {
    return { type: "MultiPolygon", coordinates: geom.coordinates.map((poly) => poly.map(roundRing)) };
  }
  return geom;
};

const features = raw.features.map((feature) => {
  const props = feature.properties ?? {};
  const iso = props.ISO_A3 && props.ISO_A3 !== "-99" ? props.ISO_A3 : (props.ADM0_A3 ?? props.ISO_A3_EH ?? "UNK");
  return {
    type: "Feature",
    id: iso,
    properties: {
      iso,
      name: props.NAME || props.ADMIN || iso,
      continent: props.CONTINENT || null,
    },
    geometry: compactGeom(feature.geometry),
  };
});

writeFileSync(dest, JSON.stringify({ type: "FeatureCollection", features }));
console.log(`wrote ${features.length} countries to ${dest}`);
