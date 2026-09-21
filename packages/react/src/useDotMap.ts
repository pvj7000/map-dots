import { createMap, type ComputeInput, type DotMap, type MapOptions, type MapSnapshot } from "@dotmap/core";
import { useMemo } from "react";

export function useDotMap(options: MapOptions, input: ComputeInput = {}): {
  map: DotMap;
  snapshot: MapSnapshot;
} {
  const map = useMemo(
    () => createMap(options),
    [
      options.geojson,
      options.width,
      options.height,
      options.spacing,
      options.grid,
      options.padding,
      options.includeOcean,
      JSON.stringify(options.projection),
      JSON.stringify(options.region),
      JSON.stringify(options.countries),
      JSON.stringify(options.continents),
      JSON.stringify(options.exclude),
    ],
  );

  const snapshot = useMemo(
    () => map.compute(input),
    [map, input.pins, input.groups, input.countryGroups, input.continentGroups, input.labels],
  );

  return { map, snapshot };
}
