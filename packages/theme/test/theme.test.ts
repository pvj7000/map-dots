import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyTheme,
  CSS_VARS,
  DOTMAP_CSS,
  PRESETS,
  themeToCssVars,
} from "../src/index.js";

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
    const file = readFileSync(
      new URL("../src/dotmap.css", import.meta.url),
      "utf8",
    );
    expect(DOTMAP_CSS).toBe(file);
  });

  it("clears managed overrides and synchronizes the base theme when switching looks", () => {
    const attrs = new Map<string, string>(),
      vars = new Map<string, string>();
    const element = {
      getAttribute: (name: string) => attrs.get(name) ?? null,
      setAttribute: (name: string, value: string) => attrs.set(name, value),
      style: {
        setProperty: (name: string, value: string) => vars.set(name, value),
        removeProperty: (name: string) => vars.delete(name),
      },
    } as unknown as HTMLElement;
    applyTheme(element, { land: "#ff00aa" });
    expect(vars.get(CSS_VARS.land)).toBe("#ff00aa");
    applyTheme(element, "midnight");
    expect(vars.size).toBe(0);
    expect(attrs.get("theme")).toBe("midnight");
    applyTheme(element, { dotSize: "3" });
    expect(attrs.get("theme")).toBe("paper");
    expect(attrs.get("data-theme")).toBe("paper");
  });
});
