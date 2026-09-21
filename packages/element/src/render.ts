import {
  hasHighlight,
  hexPath,
  hoverRelatesSiblings,
  matchHighlight,
  resolveDotColor,
  type Dot,
  type DotShape,
  type HoverMode,
  type MapHighlight,
  type MapSnapshot,
  type PlacedPin,
} from "@dotmap/core";

export interface RenderState {
  snapshot: MapSnapshot;
  shape: DotShape;
  highlight: MapHighlight | null;
  hover: MapHighlight | null;
  hoverMode: HoverMode;
  showOcean: boolean;
  style: string;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toPath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function shapeMarkup(dot: Dot, shape: DotShape, radius: number, className: string, fill: string): string {
  const delay = Math.round(dot.x * 0.35);
  const common = `class="${className}" style="--delay:${delay}ms;--dotmap-dot-fill:${escapeAttr(fill)}" data-id="${escapeAttr(dot.id)}" data-country="${escapeAttr(dot.country ?? "")}" data-continent="${escapeAttr(dot.continent ?? "")}"`;
  if (shape === "square") {
    const size = radius * 1.8;
    return `<rect ${common} x="${(dot.x - size / 2).toFixed(2)}" y="${(dot.y - size / 2).toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="0.4"/>`;
  }
  if (shape === "hexagon") {
    return `<path ${common} d="${hexPath(dot.x, dot.y, radius)}"/>`;
  }
  return `<circle ${common} cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${radius}"/>`;
}

export function renderMapSvg(state: RenderState): string {
  const { snapshot, shape, highlight, hover, hoverMode, showOcean, style } = state;
  const filtering = hasHighlight(highlight);
  const hovering = Boolean(hover && hoverRelatesSiblings(hoverMode));
  const groupColor = new Map(snapshot.legend.map((item) => [item.id, item.color]));
  const pinsByCell = new Map<string, PlacedPin>(
    snapshot.pins.map((pin) => [`${pin.snapped.col}:${pin.snapped.row}`, pin]),
  );
  const className = ["dotmap", filtering ? "is-filtering" : "", hovering ? "is-hovering" : ""]
    .filter(Boolean)
    .join(" ");

  const dots = snapshot.dots
    .filter((dot) => dot.land || showOcean)
    .map((dot) => {
      const pin = pinsByCell.get(dot.id);
      const active = filtering && matchHighlight(dot, highlight, pin);
      const related = Boolean(hover && matchHighlight(dot, hover, pin));
      const exact = Boolean(hover?.cell === dot.id || (pin && hover?.pin === pin.id));
      const radius = pin ? 3.8 : 2.15;
      const classes = [
        "dotmap__dot",
        pin ? "is-pin" : "",
        dot.land ? "is-land" : "is-ocean",
        active ? "is-active" : "",
        exact ? "is-hover" : "",
        related && !exact ? "is-related" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const color = pin?.color ?? resolveDotColor(dot, groupColor, "var(--dotmap-land)", Boolean(pin));
      return shapeMarkup(dot, shape, radius, classes, color);
    })
    .join("");

  const labels = snapshot.labels
    .map((label) => {
      const pin = snapshot.pins.find((item) => item.id === label.pinId);
      const cell = pin ? `${pin.snapped.col}:${pin.snapped.row}` : "";
      const labeled = cell ? snapshot.dots.find((item) => item.id === cell) : undefined;
      const related = Boolean(hover && labeled && matchHighlight(labeled, hover, pin));
      const exact = Boolean(hover?.cell === cell || hover?.pin === label.pinId);
      const connector =
        label.connector.points.length >= 2
          ? `<path class="dotmap__connector" d="${toPath(label.connector.points)}" fill="none"/>`
          : "";
      return `<g class="dotmap__label${exact ? " is-hover" : related ? " is-related" : ""}" data-pin="${escapeAttr(label.pinId)}">${connector}<text x="${label.x.toFixed(2)}" y="${label.y.toFixed(2)}" text-anchor="${label.align}" dominant-baseline="${label.baseline}">${escapeAttr(label.text)}</text></g>`;
    })
    .join("");

  return `<svg class="${className}" data-hover="${hoverMode}" viewBox="0 0 ${snapshot.width} ${snapshot.height}" role="img" aria-label="Dotted world map" style="${escapeAttr(style)}">${dots}${labels}${snapshot.pins
    .map(
      (pin) =>
        `<circle class="dotmap__pin-hit" data-id="${escapeAttr(`${pin.snapped.col}:${pin.snapped.row}`)}" cx="${pin.snapped.x}" cy="${pin.snapped.y}" r="8" fill="transparent"/>`,
    )
    .join("")}</svg>`;
}

export function lookupDot(snapshot: MapSnapshot, cellId: string): { dot: Dot; pin?: PlacedPin } | null {
  const dot = snapshot.dots.find((item) => item.id === cellId);
  if (!dot) return null;
  const pin = snapshot.pins.find((item) => `${item.snapped.col}:${item.snapped.row}` === cellId);
  return { dot, pin };
}
