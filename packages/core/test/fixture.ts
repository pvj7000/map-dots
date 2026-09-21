import type { FeatureCollection } from "geojson";

/** A square island centered near 15°N, 15°E — easy to reason about in tests. */
export const testland: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "TST",
      properties: { iso: "TST", name: "Testland", continent: "Test" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [10, 10],
            [10, 20],
            [20, 20],
            [20, 10],
            [10, 10],
          ],
        ],
      },
    },
  ],
};
