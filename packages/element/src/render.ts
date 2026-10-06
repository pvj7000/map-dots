import {
  hasHighlight,
  clusterPins,
  pinClusterSegments,
  pinDescription,
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
import type { DotMapTheme } from "@dotmap/theme";

export interface RenderState {
  snapshot: MapSnapshot;
  shape: DotShape;
  highlight: MapHighlight | null;
  hover: MapHighlight | null;
  hoverMode: HoverMode;
  showOcean: boolean;
  style: string;
  theme?: DotMapTheme;
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
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function shapeMarkup(
  dot: Dot,
  shape: DotShape,
  radius: number,
  className: string,
  fill: string,
): string {
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
  const { snapshot, shape, highlight, hover, hoverMode, showOcean, style } =
    state;
  const filtering = hasHighlight(highlight);
  const hovering = Boolean(hover && hoverRelatesSiblings(hoverMode));
  const groupColor = new Map(
    snapshot.legend.map((item) => [item.id, item.color]),
  );
  const clusters = clusterPins(snapshot.pins);
  const pinsByCell = new Map(
    clusters
      .filter((cluster) => cluster.pins.length === 1)
      .map((cluster) => [cluster.cellId, cluster.pins[0]]),
  );
  const className = [
    "dotmap",
    filtering ? "is-filtering" : "",
    hovering ? "is-hovering" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dots = snapshot.dots
    .filter((dot) => dot.land || showOcean)
    .map((dot) => {
      const pin = pinsByCell.get(dot.id);
      const active = filtering && matchHighlight(dot, highlight, pin);
      const related = Boolean(hover && matchHighlight(dot, hover, pin));
      const exact = Boolean(
        hover?.cell === dot.id || (pin && hover?.pin === pin.id),
      );
      const radius = Number(
        pin ? (state.theme?.pinSize ?? 3.8) : (state.theme?.dotSize ?? 2.15),
      );
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
      const color =
        pin?.color ??
        resolveDotColor(dot, groupColor, "var(--dotmap-land)", Boolean(pin));
      return shapeMarkup(dot, shape, radius, classes, color);
    })
    .join("");

  const labels = snapshot.labels
    .map((label) => {
      const pin = snapshot.pins.find((item) => item.id === label.pinId);
      const cell = pin ? `${pin.snapped.col}:${pin.snapped.row}` : "";
      const labeled = cell
        ? snapshot.dots.find((item) => item.id === cell)
        : undefined;
      const related = Boolean(
        hover && labeled && matchHighlight(labeled, hover, pin),
      );
      const exact = Boolean(hover?.cell === cell || hover?.pin === label.pinId);
      const connector =
        label.connector.points.length >= 2
          ? `<path class="dotmap__connector" d="${toPath(label.connector.points)}" fill="none"/>`
          : "";
      return `<g class="dotmap__label${exact ? " is-hover" : related ? " is-related" : ""}" data-pin="${escapeAttr(label.pinId)}">${connector}<text x="${label.x.toFixed(2)}" y="${label.y.toFixed(2)}" text-anchor="${label.align}" dominant-baseline="${label.baseline}">${escapeAttr(label.text)}</text></g>`;
    })
    .join("");

  const markers = clusters
    .map((cluster) => {
      const segments = pinClusterSegments(
        cluster,
        Number(state.theme?.pinSize ?? 3.8) * 1.8,
        groupColor,
        "var(--dotmap-land)",
      );
      const pins = cluster.pins
        .map(
          (pin, index) =>
            `<g class="dotmap__pin-hit" data-id="${escapeAttr(cluster.cellId)}" data-pin="${escapeAttr(pin.id)}" role="img" tabindex="0" aria-label="${escapeAttr(pinDescription(pin))}"><title>${escapeAttr(pinDescription(pin))}</title>${
              cluster.pins.length > 1
                ? `<path class="dotmap__pin-segment" d="${segments[index].path}" fill="${escapeAttr(segments[index].color)}"/>`
                : `<circle class="dotmap__pin" cx="${pin.snapped.x}" cy="${pin.snapped.y}" r="8" fill="transparent"/>`
            }</g>`,
        )
        .join("");
      const dot = snapshot.dots.find((item) => item.id === cluster.cellId);
      const active =
        filtering &&
        Boolean(
          dot &&
          cluster.pins.some((pin) => matchHighlight(dot, highlight, pin)),
        );
      const related = Boolean(
        dot &&
        hover &&
        cluster.pins.some((pin) => matchHighlight(dot, hover, pin)),
      );
      const count =
        cluster.pins.length > 1
          ? `<text class="dotmap__cluster-count" x="${cluster.x}" y="${cluster.y}" text-anchor="middle" dominant-baseline="central">${cluster.pins.length}</text>`
          : "";
      return `<g class="dotmap__cluster${active ? " is-active" : ""}${related ? " is-related" : ""}" data-id="${escapeAttr(cluster.cellId)}" data-pin-count="${cluster.pins.length}"><title>${escapeAttr(cluster.pins.map(pinDescription).join("\n"))}</title>${pins}${count}</g>`;
    })
    .join("");
  return `<svg class="${className}" data-hover="${hoverMode}" viewBox="0 0 ${snapshot.width} ${snapshot.height}" role="img" aria-label="Dotted world map" style="${escapeAttr(style)}">${dots}${labels}${markers}</svg>`;
}

export function lookupDot(
  snapshot: MapSnapshot,
  cellId: string,
  pinId?: string | null,
): { dot: Dot; pin?: PlacedPin; pins: PlacedPin[] } | null {
  const dot = snapshot.dots.find((item) => item.id === cellId);
  if (!dot) return null;
  const pins = snapshot.pins.filter(
    (item) => `${item.snapped.col}:${item.snapped.row}` === cellId,
  );
  const pin = pinId
    ? pins.find((item) => item.id === pinId)
    : pins.length === 1
      ? pins[0]
      : undefined;
  return { dot, pin, pins };
}
