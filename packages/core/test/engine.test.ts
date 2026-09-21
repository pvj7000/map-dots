import { describe, expect, it } from "vitest";
import {
  createMap,
  formatMatrix,
  fromJSON,
  highlightFromHover,
  matchHighlight,
  renderSVG,
} from "../src/index.js";
import { testland } from "./fixture.js";

const base = {
  geojson: testland,
  width: 240,
  height: 240,
  spacing: 12,
  padding: 20,
  projection: "equirectangular" as const,
  exclude: [],
  region: { lat: [0, 30] as [number, number], lng: [0, 30] as [number, number] },
};

describe("createMap", () => {
  it("builds a land/ocean matrix from GeoJSON", () => {
    const map = createMap({ ...base, grid: "square" });
    const ones = map.matrix.flat().filter((cell) => cell === 1).length;
    const zeros = map.matrix.flat().filter((cell) => cell === 0).length;

    expect(map.matrix.length).toBeGreaterThan(8);
    expect(map.matrix[0]?.length).toBeGreaterThan(8);
    expect(ones).toBeGreaterThan(10);
    expect(zeros).toBeGreaterThan(10);
    expect(map.dots.every((dot) => dot.land)).toBe(true);
  });

  it("snaps a coordinate inside the island onto a land grid cell", () => {
    const map = createMap({ ...base, grid: "diagonal" });
    const snap = map.latLngToGrid(15, 15);

    expect(snap).not.toBeNull();
    expect(snap?.land).toBe(true);
    expect(snap?.country).toBe("TST");
    expect(map.project(15, 15)).toEqual(expect.objectContaining({ x: expect.any(Number) }));
  });

  it("does not snap ocean coordinates onto land when landOnly is false", () => {
    const map = createMap({ ...base, includeOcean: true, grid: "square" });
    const snap = map.latLngToGrid(0, 0, { landOnly: false });
    expect(snap?.land).toBe(false);
  });

  it("supports square, diagonal, and hex topologies", () => {
    for (const grid of ["square", "diagonal", "hex"] as const) {
      const map = createMap({ ...base, grid });
      expect(map.dots.length).toBeGreaterThan(5);
      expect(map.latLngToGrid(15, 15)?.land).toBe(true);
    }
  });

  it("places labels without overlapping boxes", () => {
    const map = createMap({ ...base, grid: "square" });
    const snapshot = map.compute({
      pins: [
        { id: "a", lat: 16, lng: 12, label: "North" },
        { id: "b", lat: 13, lng: 18, label: "South" },
      ],
      labels: { connector: "elbow", fontSize: 11 },
    });

    expect(snapshot.labels).toHaveLength(2);
    const [first, second] = snapshot.labels;
    const overlap = !(
      first.box.x + first.box.width < second.box.x ||
      second.box.x + second.box.width < first.box.x ||
      first.box.y + first.box.height < second.box.y ||
      second.box.y + second.box.height < first.box.y
    );
    expect(overlap).toBe(false);
  });

  it("paints country groups and exports legend metadata", () => {
    const map = createMap({ ...base });
    const snapshot = map.compute({
      groups: [{ id: "hq", label: "HQ", color: "#0f766e" }],
      countryGroups: { TST: "hq" },
      pins: [{ lat: 15, lng: 15, label: "Camp", group: "hq" }],
    });

    expect(snapshot.landDots.every((dot) => dot.groups.includes("hq"))).toBe(true);
    expect(snapshot.legend[0]?.count).toBe(snapshot.landDots.length);
    expect(snapshot.legend[0]?.pinCount).toBe(1);
    expect(snapshot.legend[0]?.countries).toEqual(["TST"]);

    const seeded = snapshot.landDots[0];
    expect(seeded).toBeTruthy();
    if (!seeded) return;
    const hover = highlightFromHover("country", seeded);
    expect(hover?.country).toBe("TST");
    expect(snapshot.landDots.every((dot) => matchHighlight(dot, hover))).toBe(true);
    expect(highlightFromHover("dot", seeded)).toEqual({ cell: seeded.id });
    expect(highlightFromHover("none", seeded)).toBeNull();
    const continentHover = highlightFromHover("continent", { ...seeded, continent: "North America" });
    expect(continentHover?.continent).toBe("north-america");
    expect(
      matchHighlight({ ...seeded, continent: "North America", country: "CAN" }, continentHover),
    ).toBe(true);
  });

  it("paints continent groups from the GeoJSON continent field", () => {
    const map = createMap({ ...base });
    const snapshot = map.compute({
      groups: [{ id: "lab", label: "Lab", color: "#0f766e" }],
      continentGroups: { Test: "lab" },
    });
    expect(snapshot.landDots.every((dot) => dot.groups.includes("lab"))).toBe(true);
  });

  it("round-trips through JSON and still snaps pins", () => {
    const map = createMap({ ...base, grid: "hex" });
    const restored = fromJSON(map.toJSON());
    const snap = restored.latLngToGrid(15, 15);
    expect(snap?.country).toBe("TST");
    expect(restored.compute().landDots.length).toBe(map.dots.length);
  });

  it("renders an SVG string from a snapshot", () => {
    const snapshot = createMap({ ...base }).compute({
      pins: [{ lat: 15, lng: 15, label: "Camp" }],
    });
    const svg = renderSVG(snapshot);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("Camp");
    expect(svg).toContain("<circle");
  });

  it("formats the 1/0 matrix as text", () => {
    const map = createMap({ ...base, grid: "square" });
    const text = formatMatrix(map.matrix);
    expect(text).toMatch(/[01]/);
    expect(text.split("\n")).toHaveLength(map.matrix.length);
  });
});
