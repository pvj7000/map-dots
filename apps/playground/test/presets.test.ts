import { describe, it, expect } from "vitest";
import {
  importPreset,
  loadDraft,
  saveDraft,
  starterPreset,
  DRAFT_KEY,
} from "../src/customizer-state";
import { fixturePreset } from "../../../tests/fixtures/preset";

describe("preset import and drafts", () => {
  it("restores every exported setting from browser storage", () => {
    let saved = "";
    const storage = {
      getItem: () => saved,
      setItem: (key: string, value: string) => {
        expect(key).toBe(DRAFT_KEY);
        saved = value;
      },
    };
    expect(saveDraft(fixturePreset, storage)).toBeNull();
    expect(loadDraft(starterPreset("blank"), storage)).toMatchObject({
      preset: fixturePreset,
      restored: true,
    });
  });
  it("falls back without overwriting a corrupt draft", () => {
    let writes = 0;
    const storage = {
      getItem: () => '{"version":99}',
      setItem: () => {
        writes += 1;
      },
    };
    const fallback = starterPreset("presence");
    expect(loadDraft(fallback, storage)).toMatchObject({
      preset: fallback,
      restored: false,
    });
    expect(writes).toBe(0);
  });
  it("allows manual export when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(loadDraft(starterPreset("blank"), storage).message).toContain(
      "Could not restore",
    );
    expect(saveDraft(fixturePreset, storage)).toContain(
      "Download a JSON preset",
    );
  });
  it("rejects a syntactically valid preset with unusable country filters", () => {
    expect(() =>
      importPreset(
        JSON.stringify({ ...fixturePreset, map: { countries: ["UNKNOWN"] } }),
      ),
    ).toThrow("no features");
  });
});
