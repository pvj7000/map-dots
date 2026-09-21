import {
  geoEqualEarth,
  geoEquirectangular,
  geoMercator,
  geoNaturalEarth1,
  geoOrthographic,
  type GeoProjection,
} from "d3-geo";
import { geoMiller, geoMollweide, geoRobinson } from "d3-geo-projection";
import type { Feature, FeatureCollection } from "geojson";
import type { FrozenProjection, LatLng, ProjectionConfig, ProjectionName, Region } from "./types.js";

const factories: Record<ProjectionName, () => GeoProjection> = {
  mercator: () => geoMercator(),
  equirectangular: () => geoEquirectangular(),
  equalEarth: () => geoEqualEarth(),
  naturalEarth: () => geoNaturalEarth1(),
  robinson: () => geoRobinson(),
  mollweide: () => geoMollweide(),
  miller: () => geoMiller(),
  orthographic: () => geoOrthographic().clipAngle(90),
};

export function resolveProjectionConfig(
  projection: ProjectionName | ProjectionConfig | undefined,
): ProjectionConfig {
  if (!projection) return { name: "robinson" };
  if (typeof projection === "string") return { name: projection };
  return projection;
}

export function createProjection(
  config: ProjectionConfig,
  geojson: FeatureCollection,
  width: number,
  height: number,
  padding: number,
  region?: Region,
): GeoProjection {
  const projection = factories[config.name]();
  if (config.center) {
    applyCenter(projection, config.center);
  }
  const fitTarget = region ? regionFeature(region) : geojson;
  projection.fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    fitTarget,
  );
  return projection;
}

export function regionFeature(region: Region): Feature {
  const [minLat, maxLat] = region.lat;
  const [minLng, maxLng] = region.lng;
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [minLng, minLat],
          [minLng, maxLat],
          [maxLng, maxLat],
          [maxLng, minLat],
          [minLng, minLat],
        ],
      ],
    },
  };
}

export function applyCenter(projection: GeoProjection, center: LatLng): void {
  projection.rotate([-center.lng, -center.lat]);
}

export function freezeProjection(
  name: ProjectionName,
  projection: GeoProjection,
): FrozenProjection {
  const rotate = projection.rotate();
  const center = projection.center();
  const clipAngle = typeof projection.clipAngle === "function" ? projection.clipAngle() : null;
  return {
    name,
    scale: projection.scale(),
    translate: projection.translate() as [number, number],
    rotate: [rotate[0], rotate[1], rotate[2] ?? 0],
    center: [center[0], center[1]],
    clipAngle: Number.isFinite(clipAngle) ? clipAngle : null,
  };
}

export function restoreProjection(frozen: FrozenProjection): GeoProjection {
  const projection = factories[frozen.name]();
  projection.scale(frozen.scale);
  projection.translate(frozen.translate);
  projection.rotate(frozen.rotate);
  projection.center(frozen.center);
  if (frozen.clipAngle != null && typeof projection.clipAngle === "function") {
    projection.clipAngle(frozen.clipAngle);
  }
  return projection;
}

export function projectPoint(
  projection: GeoProjection,
  lat: number,
  lng: number,
): { x: number; y: number } | null {
  const point = projection([lng, lat]);
  if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
  return { x: point[0], y: point[1] };
}

export function invertPoint(
  projection: GeoProjection,
  x: number,
  y: number,
): { lat: number; lng: number } | null {
  const invert = projection.invert;
  if (!invert) return null;
  const point = invert([x, y]);
  if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
  return { lng: point[0], lat: point[1] };
}
