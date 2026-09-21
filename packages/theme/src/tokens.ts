export const CSS_VARS = {
  bg: "--dotmap-bg",
  land: "--dotmap-land",
  ocean: "--dotmap-ocean",
  ink: "--dotmap-ink",
  muted: "--dotmap-muted",
  font: "--dotmap-font",
  dotSize: "--dotmap-dot-size",
  pinSize: "--dotmap-pin-size",
  pinStroke: "--dotmap-pin-stroke",
  pinStrokeWidth: "--dotmap-pin-stroke-width",
  labelColor: "--dotmap-label-color",
  labelSize: "--dotmap-label-size",
  labelWeight: "--dotmap-label-weight",
  labelHalo: "--dotmap-label-halo",
  connector: "--dotmap-connector",
  connectorWidth: "--dotmap-connector-width",
  connectorOpacity: "--dotmap-connector-opacity",
  filterDim: "--dotmap-filter-dim",
  hoverScale: "--dotmap-hover-scale",
  hoverOpacity: "--dotmap-hover-opacity",
  hoverFill: "--dotmap-hover-fill",
  pinHoverScale: "--dotmap-pin-hover-scale",
  hoverDuration: "--dotmap-hover-duration",
  enterDuration: "--dotmap-enter-duration",
} as const;

export type ThemeToken = keyof typeof CSS_VARS;

export type HoverMode = "none" | "dot" | "country" | "group" | "continent";

export interface DotMapTheme {
  bg?: string;
  land?: string;
  ocean?: string;
  ink?: string;
  muted?: string;
  font?: string;
  dotSize?: string;
  pinSize?: string;
  pinStroke?: string;
  pinStrokeWidth?: string;
  labelColor?: string;
  labelSize?: string;
  labelWeight?: string;
  labelHalo?: string;
  connector?: string;
  connectorWidth?: string;
  connectorOpacity?: string;
  filterDim?: string;
  hoverScale?: string;
  hoverOpacity?: string;
  hoverFill?: string;
  pinHoverScale?: string;
  hoverDuration?: string;
  enterDuration?: string;
}

export type ThemePreset = "paper" | "ink" | "midnight";

export const PRESETS: Record<ThemePreset, Required<DotMapTheme>> = {
  paper: {
    bg: "transparent",
    land: "#8d8679",
    ocean: "transparent",
    ink: "#1b1915",
    muted: "#6d675c",
    font: 'Manrope, "IBM Plex Sans", system-ui, sans-serif',
    dotSize: "2.15",
    pinSize: "3.8",
    pinStroke: "var(--dotmap-label-halo)",
    pinStrokeWidth: "1.6",
    labelColor: "#1b1915",
    labelSize: "12px",
    labelWeight: "650",
    labelHalo: "#fffaf1",
    connector: "currentColor",
    connectorWidth: "1",
    connectorOpacity: "0.7",
    filterDim: "0.2",
    hoverScale: "1.55",
    hoverOpacity: "1",
    hoverFill: "",
    pinHoverScale: "1.85",
    hoverDuration: "160ms",
    enterDuration: "520ms",
  },
  ink: {
    bg: "transparent",
    land: "#2a2622",
    ocean: "transparent",
    ink: "#111111",
    muted: "#5c574f",
    font: 'Manrope, "IBM Plex Sans", system-ui, sans-serif',
    dotSize: "2.15",
    pinSize: "3.8",
    pinStroke: "#f6f1e8",
    pinStrokeWidth: "1.6",
    labelColor: "#111111",
    labelSize: "12px",
    labelWeight: "650",
    labelHalo: "#f6f1e8",
    connector: "currentColor",
    connectorWidth: "1",
    connectorOpacity: "0.75",
    filterDim: "0.18",
    hoverScale: "1.6",
    hoverOpacity: "1",
    hoverFill: "",
    pinHoverScale: "1.9",
    hoverDuration: "160ms",
    enterDuration: "480ms",
  },
  midnight: {
    bg: "transparent",
    land: "#64748b",
    ocean: "transparent",
    ink: "#e8eef4",
    muted: "#93a0ae",
    font: 'Manrope, "IBM Plex Sans", system-ui, sans-serif',
    dotSize: "2.15",
    pinSize: "3.8",
    pinStroke: "#121922",
    pinStrokeWidth: "1.6",
    labelColor: "#e8eef4",
    labelSize: "12px",
    labelWeight: "650",
    labelHalo: "#121922",
    connector: "currentColor",
    connectorWidth: "1",
    connectorOpacity: "0.7",
    filterDim: "0.18",
    hoverScale: "1.55",
    hoverOpacity: "1",
    hoverFill: "",
    pinHoverScale: "1.85",
    hoverDuration: "160ms",
    enterDuration: "520ms",
  },
};

export function resolveTheme(theme?: DotMapTheme | ThemePreset | null): DotMapTheme {
  if (!theme) return { ...PRESETS.paper };
  if (typeof theme === "string") return { ...PRESETS[theme] };
  return { ...PRESETS.paper, ...theme };
}

export function themePresetName(theme?: DotMapTheme | ThemePreset | null): ThemePreset {
  return typeof theme === "string" ? theme : "paper";
}

export function themeToCssVars(theme?: DotMapTheme | ThemePreset | null): Record<string, string> {
  if (!theme || typeof theme === "string") return {};
  const vars: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(CSS_VARS) as [ThemeToken, string][]) {
    const value = theme[key];
    if (value) vars[cssVar] = value;
  }
  return vars;
}

export function applyTheme(element: HTMLElement, theme?: DotMapTheme | ThemePreset | null): void {
  if (typeof theme === "string") {
    element.setAttribute("theme", theme);
    return;
  }
  const vars = themeToCssVars(theme);
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value);
  }
}
