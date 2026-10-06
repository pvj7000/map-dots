import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createMap,
  clusterPins,
  highlightFromHover,
  matchHighlight,
  renderSVG,
} from "@dotmap/core";
import { DotMap } from "../../../packages/react/src/DotMap";
import { renderMapSvg, lookupDot } from "../../../packages/element/src/render";
import { testland } from "../../../packages/core/test/fixture";

const snapshot = createMap({
  geojson: testland,
  width: 240,
  height: 240,
  spacing: 12,
  exclude: [],
  projection: "equirectangular",
}).compute({
  pins: [
    {
      id: "a",
      label: "Office A",
      lat: 15,
      lng: 15,
      group: "one",
      color: "#00aabb",
    },
    {
      id: "b",
      label: "Office B",
      lat: 15,
      lng: 15,
      group: "two",
      color: "#cc2244",
    },
  ],
  groups: [
    { id: "one", label: "One", color: "#007766" },
    { id: "two", label: "Two", color: "#772233" },
  ],
});

describe("locations sharing a grid cell", () => {
  it("preserves both pins, labels, and group membership", () => {
    expect(clusterPins(snapshot.pins)[0].pins).toHaveLength(2);
    expect(snapshot.labels).toHaveLength(2);
    expect(snapshot.legend.map((group) => group.pinCount)).toEqual([1, 1]);
  });
  it("renders every location and its own color in all three renderers", () => {
    const outputs = [
      renderToStaticMarkup(createElement(DotMap, { snapshot })),
      renderMapSvg({
        snapshot,
        shape: "circle",
        highlight: null,
        hover: null,
        hoverMode: "group",
        showOcean: false,
        style: "",
      }),
      renderSVG(snapshot),
    ];
    for (const output of outputs) {
      expect(output).toContain('data-pin-count="2"');
      expect(output).toContain('data-pin="a"');
      expect(output).toContain('data-pin="b"');
      expect(output).toContain('fill="#00aabb"');
      expect(output).toContain('fill="#cc2244"');
      expect(output).toContain("Office A");
      expect(output).toContain("Office B");
    }
  });
  it("resolves the actual hovered pin instead of whichever pin was first or last", () => {
    const cluster = clusterPins(snapshot.pins)[0];
    expect(lookupDot(snapshot, cluster.cellId, "b")?.pin?.id).toBe("b");
    const target = lookupDot(snapshot, cluster.cellId)!;
    expect(target.pin).toBeUndefined();
    expect(target.pins).toHaveLength(2);
    const highlight = highlightFromHover(
      "group",
      target.dot,
      target.pin,
      target.pins,
    );
    expect(highlight?.groups).toEqual(["one", "two"]);
    expect(
      matchHighlight(
        { ...target.dot, id: "different", groups: ["one"] },
        highlight,
      ),
    ).toBe(true);
  });
});
