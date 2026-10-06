import type { DotMapTheme, ThemePreset } from "@dotmap/theme";
import type { ComputeInput, DotShape, HoverMode, MapOptions } from "./types.js";

export interface MapPreset {
  version: 1;
  map: Omit<MapOptions, "geojson">;
  content: ComputeInput;
  display: {
    theme?: DotMapTheme | ThemePreset;
    hoverMode?: HoverMode;
    shape?: DotShape;
    showOcean?: boolean;
  };
}

const projections = [
  "mercator",
  "equirectangular",
  "equalEarth",
  "naturalEarth",
  "robinson",
  "mollweide",
  "miller",
  "orthographic",
];
const themeKeys = [
  "bg",
  "land",
  "ocean",
  "ink",
  "muted",
  "font",
  "dotSize",
  "pinSize",
  "pinStroke",
  "pinStrokeWidth",
  "labelColor",
  "labelSize",
  "labelWeight",
  "labelHalo",
  "connector",
  "connectorWidth",
  "connectorOpacity",
  "filterDim",
  "hoverScale",
  "hoverOpacity",
  "hoverFill",
  "pinHoverScale",
  "hoverDuration",
  "enterDuration",
];

function fail(path: string, reason: string): never {
  throw new Error(`${path}: ${reason}`);
}
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(path, "expected an object");
  return value as Record<string, unknown>;
}
function number(
  value: unknown,
  path: string,
  min: number,
  max: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    fail(path, `expected a number between ${min} and ${max}`);
  return value;
}
function text(value: unknown, path: string, max = 200, empty = false): string {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > max
  )
    fail(
      path,
      `expected ${empty ? "a" : "a nonempty"} string of at most ${max} characters`,
    );
  return value;
}
function choice(value: unknown, path: string, allowed: string[]) {
  if (!allowed.includes(value as string))
    fail(path, `expected one of ${allowed.join(", ")}`);
}
function optional(value: unknown, validate: (value: unknown) => void) {
  if (value !== undefined) validate(value);
}
function bool(value: unknown, path: string) {
  if (typeof value !== "boolean") fail(path, "expected true or false");
}
function keys(value: Record<string, unknown>, path: string, allowed: string[]) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) fail(`${path}.${key}`, "unsupported setting");
}
function list(value: unknown, path: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    fail(path, `expected an array of at most ${max} items`);
  return value;
}
function css(value: unknown, path: string) {
  const result = text(value, path, 512, true);
  if (/[<>;\n\r]/.test(result))
    fail(path, "expected a CSS value, not a declaration");
}
function identifier(value: unknown, path: string): string {
  const id = text(value, path, 100);
  if (["__proto__", "constructor", "prototype"].includes(id))
    fail(path, "reserved identifier");
  return id;
}
function coordinate(value: unknown, path: string) {
  const point = object(value, path);
  number(point.lat, `${path}.lat`, -90, 90);
  number(point.lng, `${path}.lng`, -180, 180);
}

/** Validates portable JSON before the engine or customizer consumes it. */
export function parsePreset(source: string | unknown): MapPreset {
  let raw: unknown = source;
  if (typeof source === "string") {
    if (source.length > 2_000_000) fail("Preset", "file exceeds 2 MB");
    try {
      raw = JSON.parse(source);
    } catch {
      fail("Preset", "invalid JSON");
    }
  }
  const root = object(raw, "Preset");
  if (root.version !== 1) fail("Preset.version", "only version 1 is supported");
  keys(root, "Preset", ["version", "map", "content", "display"]);
  const map = object(root.map, "map");
  keys(map, "map", [
    "width",
    "height",
    "spacing",
    "grid",
    "projection",
    "padding",
    "region",
    "countries",
    "continents",
    "exclude",
    "includeOcean",
  ]);
  optional(map.width, (v) => number(v, "map.width", 100, 4096));
  optional(map.height, (v) => number(v, "map.height", 100, 4096));
  optional(map.spacing, (v) => number(v, "map.spacing", 2, 80));
  optional(map.padding, (v) =>
    number(
      v,
      "map.padding",
      0,
      Math.min((map.width as number) ?? 960, (map.height as number) ?? 480) /
        2 -
        1,
    ),
  );
  if (
    (((map.width as number) ?? 960) * ((map.height as number) ?? 480)) /
      ((map.spacing as number) ?? 8) ** 2 >
    150_000
  )
    fail(
      "map.spacing",
      "this resolution exceeds 150,000 grid cells; increase spacing",
    );
  optional(map.grid, (v) =>
    choice(v, "map.grid", ["square", "diagonal", "hex"]),
  );
  optional(map.includeOcean, (v) => bool(v, "map.includeOcean"));
  optional(map.projection, (v) => {
    if (typeof v === "string") choice(v, "map.projection", projections);
    else {
      const p = object(v, "map.projection");
      keys(p, "map.projection", ["name", "center"]);
      choice(p.name, "map.projection.name", projections);
      optional(p.center, (c) => coordinate(c, "map.projection.center"));
    }
  });
  for (const key of ["countries", "continents", "exclude"])
    optional(map[key], (v) =>
      list(v, `map.${key}`, 500).forEach((item, i) =>
        identifier(item, `map.${key}[${i}]`),
      ),
    );
  optional(map.region, (v) => {
    const region = object(v, "map.region");
    keys(region, "map.region", ["lat", "lng"]);
    for (const key of ["lat", "lng"]) {
      const range = list(region[key], `map.region.${key}`, 2);
      if (range.length !== 2) fail(`map.region.${key}`, "expected [min, max]");
      const bound = key === "lat" ? 90 : 180;
      const min = number(range[0], `map.region.${key}[0]`, -bound, bound),
        max = number(range[1], `map.region.${key}[1]`, -bound, bound);
      if (min >= max) fail(`map.region.${key}`, "min must be less than max");
    }
  });
  const content = object(root.content, "content");
  keys(content, "content", [
    "pins",
    "groups",
    "countryGroups",
    "continentGroups",
    "labels",
  ]);
  const ids = new Set<string>();
  optional(content.pins, (v) =>
    list(v, "content.pins", 500).forEach((item, i) => {
      const path = `content.pins[${i}]`,
        pin = object(item, path);
      coordinate(pin, path);
      keys(pin, path, [
        "id",
        "lat",
        "lng",
        "label",
        "group",
        "color",
        "priority",
        "preferredAnchor",
        "data",
      ]);
      const id =
        pin.id === undefined ? `pin-${i}` : identifier(pin.id, `${path}.id`);
      if (ids.has(id)) fail(`${path}.id`, "pin IDs must be unique");
      ids.add(id);
      optional(pin.label, (v) => text(v, `${path}.label`, 200, true));
      optional(pin.group, (v) => identifier(v, `${path}.group`));
      optional(pin.color, (v) => css(v, `${path}.color`));
      optional(pin.priority, (v) =>
        number(v, `${path}.priority`, -1_000_000, 1_000_000),
      );
      optional(pin.preferredAnchor, (v) =>
        choice(v, `${path}.preferredAnchor`, [
          "top",
          "bottom",
          "left",
          "right",
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ]),
      );
    }),
  );
  const groupIds = new Set<string>();
  optional(content.groups, (v) =>
    list(v, "content.groups", 100).forEach((item, i) => {
      const path = `content.groups[${i}]`,
        group = object(item, path);
      keys(group, path, ["id", "label", "color", "description"]);
      const id = identifier(group.id, `${path}.id`);
      if (groupIds.has(id)) fail(`${path}.id`, "group IDs must be unique");
      groupIds.add(id);
      text(group.label, `${path}.label`);
      css(group.color, `${path}.color`);
      optional(group.description, (v) =>
        text(v, `${path}.description`, 512, true),
      );
    }),
  );
  for (const key of ["countryGroups", "continentGroups"])
    optional(content[key], (v) => {
      const entries = object(v, `content.${key}`);
      if (Object.keys(entries).length > 500)
        fail(`content.${key}`, "at most 500 entries are supported");
      for (const [keyName, groups] of Object.entries(entries)) {
        identifier(keyName, `content.${key}`);
        if (Array.isArray(groups))
          list(groups, `content.${key}.${keyName}`, 100).forEach((g) =>
            identifier(g, `content.${key}.${keyName}`),
          );
        else identifier(groups, `content.${key}.${keyName}`);
      }
    });
  optional(content.labels, (v) => {
    const labels = object(v, "content.labels");
    keys(labels, "content.labels", ["enabled", "fontSize", "gap", "connector"]);
    optional(labels.enabled, (v) => bool(v, "content.labels.enabled"));
    optional(labels.fontSize, (v) =>
      number(v, "content.labels.fontSize", 1, 64),
    );
    optional(labels.gap, (v) => number(v, "content.labels.gap", 0, 200));
    optional(labels.connector, (v) =>
      choice(v, "content.labels.connector", ["line", "elbow", "none"]),
    );
  });
  const display = object(root.display, "display");
  keys(display, "display", ["theme", "hoverMode", "shape", "showOcean"]);
  optional(display.theme, (v) => {
    if (typeof v === "string")
      choice(v, "display.theme", ["paper", "ink", "midnight"]);
    else {
      const theme = object(v, "display.theme");
      keys(theme, "display.theme", themeKeys);
      for (const [key, value] of Object.entries(theme)) {
        css(value, `display.theme.${key}`);
        if (key === "dotSize" || key === "pinSize")
          number(Number(value), `display.theme.${key}`, 0.1, 30);
      }
    }
  });
  optional(display.hoverMode, (v) =>
    choice(v, "display.hoverMode", [
      "none",
      "dot",
      "country",
      "group",
      "continent",
    ]),
  );
  optional(display.shape, (v) =>
    choice(v, "display.shape", ["circle", "square", "hexagon"]),
  );
  optional(display.showOcean, (v) => bool(v, "display.showOcean"));
  try {
    return JSON.parse(JSON.stringify(root)) as MapPreset;
  } catch {
    fail("Preset", "settings must be JSON serializable");
  }
}
