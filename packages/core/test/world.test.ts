import type { FeatureCollection } from "geojson";
import { describe, expect, it } from "vitest";
import { continentView, createMap } from "../src/index.js";
import rawWorld from "../../world/src/countries.json";

const world = rawWorld as FeatureCollection;

describe("world map", () => {
  it("snaps Vienna onto an Austrian land dot", () => {
    const map = createMap({
      geojson: world,
      width: 720,
      height: 380,
      spacing: 10,
      grid: "diagonal",
      projection: "robinson",
    });

    const snap = map.latLngToGrid(48.2082, 16.3738);
    expect(snap?.land).toBe(true);
    expect(snap?.country).toBe("AUT");
    expect(map.dots.length).toBeGreaterThan(400);
  });

  it("keeps Siberia and the Russian Far East on the grid", () => {
    const map = createMap({
      geojson: world,
      width: 1100,
      height: 540,
      spacing: 11,
      grid: "diagonal",
      projection: "robinson",
      padding: 28,
    });

    const counts = new Map<string, number>();
    for (const dot of map.dots) {
      if (!dot.country) continue;
      counts.set(dot.country, (counts.get(dot.country) ?? 0) + 1);
    }

    expect(counts.get("RUS") ?? 0).toBeGreaterThan(counts.get("CHN") ?? 0);
    expect(map.latLngToGrid(55.0084, 82.9357)?.country).toBe("RUS");
    expect(map.latLngToGrid(62.0355, 129.6755)?.country).toBe("RUS");
    expect(map.latLngToGrid(53.044, 158.6509)?.country).toBe("RUS");
  });

  it("crops to a continent view and keeps only in-region pins", () => {
    const europe = createMap({
      geojson: world,
      width: 900,
      height: 560,
      spacing: 10,
      grid: "diagonal",
      projection: "naturalEarth",
      padding: 24,
      ...continentView("europe"),
    });
    const snapshot = europe.compute({
      pins: [
        { id: "vie", lat: 48.2082, lng: 16.3738, label: "Wien" },
        { id: "nyc", lat: 40.7128, lng: -74.006, label: "New York" },
      ],
    });

    expect(europe.dots.every((dot) => !dot.country || ["RUS", "TUR"].includes(dot.country) || dot.continent === "Europe")).toBe(true);
    expect(europe.dots.some((dot) => dot.country === "AUT")).toBe(true);
    expect(europe.dots.some((dot) => dot.country === "USA")).toBe(false);
    expect(snapshot.pins.map((pin) => pin.id)).toEqual(["vie"]);
  });

  it("includes Siberia when viewing Asia", () => {
    const asia = createMap({
      geojson: world,
      width: 900,
      height: 520,
      spacing: 10,
      grid: "diagonal",
      projection: "naturalEarth",
      ...continentView("asia"),
    });
    expect(asia.latLngToGrid(55.0084, 82.9357)?.country).toBe("RUS");
    expect(asia.dots.some((dot) => dot.country === "CHN")).toBe(true);
    expect(asia.dots.some((dot) => dot.country === "FRA")).toBe(false);
  });
});
