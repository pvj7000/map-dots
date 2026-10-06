import { describe, it, expect } from "vitest";
import { parsePreset } from "../src/preset.js";
import { fixturePreset } from "../../../tests/fixtures/preset.js";

describe("portable preset validation", () => {
  it("preserves advanced geometry, labels, groups, pin metadata, and display options", () => {
    expect(parsePreset(JSON.stringify(fixturePreset))).toEqual(fixturePreset);
  });
  it.each([
    [{ ...fixturePreset, version: 2 }, "version 1"],
    [{ ...fixturePreset, map: { spacing: 0 } }, "map.spacing"],
    [
      { ...fixturePreset, map: { width: 4096, height: 4096, spacing: 2 } },
      "grid cells",
    ],
    [
      { ...fixturePreset, content: { pins: [{ lat: 200, lng: 16 }] } },
      "pins[0].lat",
    ],
    [
      {
        ...fixturePreset,
        content: {
          pins: [
            { id: "same", lat: 0, lng: 0 },
            { id: "same", lat: 1, lng: 1 },
          ],
        },
      },
      "unique",
    ],
    [
      { ...fixturePreset, map: { region: { lat: [10, 5], lng: [0, 20] } } },
      "min must",
    ],
  ])(
    "rejects invalid geometry and identifiers before rendering",
    (preset, message) => {
      expect(() => parsePreset(preset)).toThrow(message);
    },
  );
  it("reports malformed JSON", () =>
    expect(() => parsePreset("{")).toThrow("invalid JSON"));
});
