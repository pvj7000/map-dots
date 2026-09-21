import { DOTMAP_CSS } from "@dotmap/theme";

let cached: CSSStyleSheet | null = null;

export function themeSheet(): CSSStyleSheet {
  if (cached) return cached;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(DOTMAP_CSS);
  cached = sheet;
  return sheet;
}

export function fallbackStyle(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = DOTMAP_CSS;
  return style;
}
