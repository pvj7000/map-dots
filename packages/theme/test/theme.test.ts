import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CSS_VARS, DOTMAP_CSS, PRESETS, themeToCssVars } from "../src/index.js";

describe("theme tokens", () => {
  it("leaves named presets to CSS so page variables still win", () => {
    expect(themeToCssVars("midnight")).toEqual({});
    expect(PRESETS.midnight.land).toBe("#64748b");
    expect(PRESETS.midnight.hoverScale).toBe("1.55");
  });

  it("inlines only the tokens a site actually overrides", () => {
    const vars = themeToCssVars({ land: "#ff00aa", hoverScale: "2.2" });
    expect(vars[CSS_VARS.land]).toBe("#ff00aa");
    expect(vars[CSS_VARS.hoverScale]).toBe("2.2");
    expect(vars[CSS_VARS.ink]).toBeUndefined();
  });

  it("keeps the CSS file and the JS string identical", () => {
    const file = readFileSync(new URL("../src/dotmap.css", import.meta.url), "utf8");
    expect(DOTMAP_CSS).toBe(file);
  });
});
