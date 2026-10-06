import { createMap } from "@dotmap/core";
import world from "@dotmap/world";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  appearanceForTheme,
  exportSource,
  type PresetOptions,
} from "../src/export-source";
import { countryGroups, groups, pins, viewOptions } from "../src/presence";
import { fixturePreset } from "../../../tests/fixtures/preset";

const options: PresetOptions = {
  pins,
  groups,
  countryGroups,
  continentGroups: {},
  grid: "hex",
  projection: "equalEarth",
  spacing: 9,
  scope: "world",
  theme: "midnight",
  hoverMode: "group",
  appearance: {
    ...appearanceForTheme("midnight"),
    land: "#123456",
    dotSize: 2.6,
  },
};

describe("portable map exports", () => {
  it.each(["world", "europe", "asia"] as const)(
    "recreates the %s preview from its JSON preset",
    (scope) => {
      const config = { ...options, scope };
      const preset = JSON.parse(exportSource("json", config));
      const actual = createMap({ geojson: world, ...preset.map }).compute(
        preset.content,
      );
      const expected = createMap({
        geojson: world,
        width: 1100,
        height: 540,
        padding: 28,
        grid: config.grid,
        projection: config.projection,
        spacing: config.spacing,
        ...viewOptions(scope),
      }).compute({
        pins,
        groups,
        countryGroups,
        labels: { connector: "elbow", fontSize: 12, gap: 20 },
      });
      expect(actual).toEqual(expected);
      expect(preset.display.theme).toMatchObject({
        land: "#123456",
        dotSize: "2.6",
        bg: "#121922",
        labelColor: "#e8eef4",
      });
      expect(preset.display.hoverMode).toBe("group");
    },
  );

  it.each([
    ["builder", { ...options, scope: "europe" as const }],
    ["partial theme", fixturePreset],
    [
      "named theme",
      {
        ...fixturePreset,
        display: { ...fixturePreset.display, theme: "midnight" as const },
      },
    ],
  ])(
    "exports a %s React component that passes strict TypeScript checking",
    (_name, config) => {
      const source = exportSource("react", config);
      const filename = path.resolve(__dirname, "generated-map.tsx");
      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        strict: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        noEmit: true,
      };
      const host = ts.createCompilerHost(compilerOptions);
      const getSourceFile = host.getSourceFile.bind(host);
      host.getSourceFile = (
        file,
        languageVersion,
        onError,
        shouldCreateNewSourceFile,
      ) =>
        file === filename
          ? ts.createSourceFile(
              file,
              source,
              languageVersion,
              true,
              ts.ScriptKind.TSX,
            )
          : getSourceFile(
              file,
              languageVersion,
              onError,
              shouldCreateNewSourceFile,
            );
      const program = ts.createProgram([filename], compilerOptions, host);
      const errors = ts
        .getPreEmitDiagnostics(program)
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        );
      expect(errors).toEqual([]);
    },
    15000,
  );

  it("preserves labels containing closing script tags in a single HTML module", () => {
    const source = exportSource("html", {
      ...options,
      scope: "europe",
      pins: [
        { lat: 48.2, lng: 16.3, label: '</script><span>My "office"</span>' },
      ],
    });
    expect(source.match(/<\/script>/g)).toHaveLength(2);
    expect(source).toContain(
      '\\u003c/script>\\u003cspan>My \\"office\\"\\u003c/span>',
    );
    expect(source).toContain('"width": 1100');
    expect(source).toContain("map.options =");
    expect(source).toContain('"region"');
    expect(source).toContain('"land": "#123456"');
  });
});
