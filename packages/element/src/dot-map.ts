import {
  continentView,
  createMap,
  highlightFromHover,
  type ComputeInput,
  type ContinentId,
  type DotMap,
  type GroupDef,
  type GridTopology,
  type HoverMode,
  type MapHighlight,
  type MapOptions,
  type MapSnapshot,
  type PinInput,
  type ProjectionName,
} from "@dotmap/core";
import type { FeatureCollection } from "geojson";
import {
  applyTheme,
  resolveTheme,
  type DotMapTheme,
  type ThemePreset,
} from "@dotmap/theme";
import world from "@dotmap/world";
import { fallbackStyle, themeSheet } from "./css.js";
import { lookupDot, renderMapSvg } from "./render.js";

const CONTINENT_SCOPES = new Set<string>([
  "africa",
  "antarctica",
  "asia",
  "europe",
  "north-america",
  "oceania",
  "south-america",
]);

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class DotMapElement extends HTMLElement {
  static observedAttributes = [
    "grid",
    "projection",
    "spacing",
    "width",
    "height",
    "padding",
    "theme",
    "hover-mode",
    "scope",
    "countries",
    "shape",
    "pins",
    "groups",
    "country-groups",
    "continent-groups",
  ];

  #engine: DotMap | null = null;
  #snapshot: MapSnapshot | null = null;
  #hover: MapHighlight | null = null;
  #highlight: MapHighlight | null = null;
  #geojson = world as FeatureCollection;
  #pins: PinInput[] = [];
  #groups: GroupDef[] = [];
  #countryGroups: Record<string, string | string[]> = {};
  #continentGroups: Record<string, string | string[]> = {};
  #theme: DotMapTheme | ThemePreset = "paper";
  #mapOptions: Omit<MapOptions, "geojson"> = {};
  #labels: ComputeInput["labels"] = {
    connector: "elbow",
    fontSize: 12,
    gap: 20,
  };
  #frame: number | null = null;
  #pendingRebuild = false;
  #painting = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    try {
      root.adoptedStyleSheets = [themeSheet()];
    } catch {
      root.appendChild(fallbackStyle());
    }
  }

  get pins(): PinInput[] {
    return this.#pins;
  }

  get options(): Omit<MapOptions, "geojson"> {
    return this.#mapOptions;
  }
  set options(value: Omit<MapOptions, "geojson">) {
    this.#mapOptions = value;
    this.#schedule("rebuild");
  }
  get labels(): ComputeInput["labels"] {
    return this.#labels;
  }
  set labels(value: ComputeInput["labels"]) {
    this.#labels = value;
    this.#schedule("compute");
  }
  set pins(value: PinInput[]) {
    this.#pins = value;
    this.#schedule("compute");
  }

  get groups(): GroupDef[] {
    return this.#groups;
  }
  set groups(value: GroupDef[]) {
    this.#groups = value;
    this.#schedule("compute");
  }

  get countryGroups(): Record<string, string | string[]> {
    return this.#countryGroups;
  }
  set countryGroups(value: Record<string, string | string[]>) {
    this.#countryGroups = value;
    this.#schedule("compute");
  }

  get continentGroups(): Record<string, string | string[]> {
    return this.#continentGroups;
  }
  set continentGroups(value: Record<string, string | string[]>) {
    this.#continentGroups = value;
    this.#schedule("compute");
  }

  get highlight(): MapHighlight | null {
    return this.#highlight;
  }
  set highlight(value: MapHighlight | null) {
    this.#highlight = value;
    this.#paint();
  }

  get theme(): DotMapTheme | ThemePreset {
    return this.#theme;
  }
  set theme(value: DotMapTheme | ThemePreset) {
    this.#theme = value;
    applyTheme(this, value);
    this.#paint();
  }

  get hoverMode(): HoverMode {
    const value = this.getAttribute("hover-mode") ?? "country";
    return value as HoverMode;
  }
  set hoverMode(value: HoverMode) {
    this.setAttribute("hover-mode", value);
  }

  connectedCallback(): void {
    this.#applyLook();
    this.#rebuild();
    this.shadowRoot?.addEventListener("pointerover", this.#onOver);
    this.shadowRoot?.addEventListener("pointerleave", this.#onLeave);
    this.shadowRoot?.addEventListener("focusin", this.#onOver);
    this.shadowRoot?.addEventListener("focusout", this.#onLeave);
  }

  disconnectedCallback(): void {
    if (this.#frame) cancelAnimationFrame(this.#frame);
    this.#frame = null;
    this.shadowRoot?.removeEventListener("pointerover", this.#onOver);
    this.shadowRoot?.removeEventListener("pointerleave", this.#onLeave);
    this.shadowRoot?.removeEventListener("focusin", this.#onOver);
    this.shadowRoot?.removeEventListener("focusout", this.#onLeave);
  }

  attributeChangedCallback(
    _name: string,
    previous: string | null,
    next: string | null,
  ): void {
    if (!this.isConnected || previous === next) return;
    this.#schedule("rebuild");
  }

  #onOver = (event: Event) => {
    if (this.#painting) return;
    const target = (event.target as Element | null)?.closest?.("[data-id]");
    if (!target || !this.#snapshot) return;
    const found = lookupDot(
      this.#snapshot,
      target.getAttribute("data-id") ?? "",
      target.getAttribute("data-pin"),
    );
    if (!found) return;
    this.#hover = highlightFromHover(
      this.hoverMode,
      found.dot,
      found.pin,
      found.pins,
    );
    this.dispatchEvent(
      new CustomEvent("dotmap-hover", {
        detail: { ...found, highlight: this.#hover },
        bubbles: true,
      }),
    );
    this.#paint();
  };

  #onLeave = () => {
    if (this.#painting) return;
    this.#hover = null;
    this.dispatchEvent(
      new CustomEvent("dotmap-hover", { detail: null, bubbles: true }),
    );
    this.#paint();
  };

  #schedule(kind: "rebuild" | "compute"): void {
    if (kind === "rebuild") this.#pendingRebuild = true;
    if (this.#frame) cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      const rebuild = this.#pendingRebuild;
      this.#pendingRebuild = false;
      if (rebuild) this.#rebuild();
      else this.#compute();
    });
  }

  #options(): MapOptions {
    const scope = this.getAttribute("scope") ?? "world";
    const countries = (this.getAttribute("countries") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const view = CONTINENT_SCOPES.has(scope)
      ? continentView(scope as ContinentId)
      : {};
    return {
      geojson: this.#geojson,
      width: Number(this.getAttribute("width") ?? 1100),
      height: Number(this.getAttribute("height") ?? 540),
      spacing: Number(this.getAttribute("spacing") ?? 8),
      padding: Number(this.getAttribute("padding") ?? 28),
      grid: (this.getAttribute("grid") ?? "diagonal") as GridTopology,
      projection: (this.getAttribute("projection") ??
        "robinson") as ProjectionName,
      countries: countries.length ? countries : undefined,
      ...view,
      ...this.#mapOptions,
    };
  }

  #input(): ComputeInput {
    return {
      pins: this.#pins.length
        ? this.#pins
        : parseJson(this.getAttribute("pins"), []),
      groups: this.#groups.length
        ? this.#groups
        : parseJson(this.getAttribute("groups"), []),
      countryGroups: Object.keys(this.#countryGroups).length
        ? this.#countryGroups
        : parseJson(this.getAttribute("country-groups"), {}),
      continentGroups: Object.keys(this.#continentGroups).length
        ? this.#continentGroups
        : parseJson(this.getAttribute("continent-groups"), {}),
      labels: this.#labels,
    };
  }

  #applyLook(): void {
    applyTheme(this, this.#theme);
  }

  #rebuild(): void {
    const themeAttr = this.getAttribute("theme");
    if (themeAttr && typeof this.#theme === "string") {
      this.#theme = themeAttr as ThemePreset;
    }
    this.#applyLook();
    this.#engine = createMap(this.#options());
    this.#compute();
  }

  #compute(): void {
    if (!this.#engine) return;
    this.#snapshot = this.#engine.compute(this.#input());
    this.#paint();
  }

  #paint(): void {
    if (!this.shadowRoot || !this.#snapshot) return;
    const focused = this.shadowRoot.activeElement?.getAttribute("data-pin");
    this.#painting = true;
    const existing = this.shadowRoot.querySelector("style");
    this.shadowRoot.innerHTML = renderMapSvg({
      snapshot: this.#snapshot,
      shape: (this.getAttribute("shape") ?? "circle") as
        "circle" | "square" | "hexagon",
      highlight: this.#highlight,
      hover: this.#hover,
      hoverMode: this.hoverMode,
      showOcean: this.hasAttribute("show-ocean"),
      style: "",
      theme: resolveTheme(this.#theme),
    });
    if (existing) this.shadowRoot.prepend(existing);
    this.#applyLook();
    if (focused) {
      const marker = Array.from(
        this.shadowRoot.querySelectorAll<SVGElement>(".dotmap__pin-hit"),
      ).find((node) => node.getAttribute("data-pin") === focused);
      (marker as (SVGElement & { focus(): void }) | undefined)?.focus();
    }
    this.#painting = false;
  }
}

export function defineDotMap(tag = "dot-map"): void {
  if (!customElements.get(tag)) {
    customElements.define(tag, DotMapElement);
  }
}
