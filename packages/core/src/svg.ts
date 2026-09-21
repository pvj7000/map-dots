import type { Dot, DotShape, LabelPlacement, MapSnapshot, SvgRenderOptions } from "./types.js";

const DEFAULTS: Required<
  Pick<
    SvgRenderOptions,
    | "landColor"
    | "oceanColor"
    | "background"
    | "pinRadius"
    | "dotRadius"
    | "showOcean"
    | "showLabels"
    | "labelColor"
    | "connectorColor"
    | "fontFamily"
    | "fontSize"
    | "shape"
  >
> = {
  landColor: "#c4bdb0",
  oceanColor: "transparent",
  background: "#f4efe6",
  pinRadius: 3.4,
  dotRadius: 1.55,
  showOcean: false,
  showLabels: true,
  labelColor: "#1c1916",
  connectorColor: "#1c1916",
  fontFamily: 'Manrope, "IBM Plex Sans", system-ui, sans-serif',
  fontSize: 12,
  shape: "circle",
};

export function renderSVG(snapshot: MapSnapshot, options: SvgRenderOptions = {}): string {
  const style = { ...DEFAULTS, ...options };
  const groupColor = new Map(snapshot.legend.map((item) => [item.id, item.color]));
  const pinIds = new Set(snapshot.pins.map((pin) => `${pin.snapped.col}:${pin.snapped.row}`));
  const visibleDots = snapshot.dots.filter((dot) => dot.land || style.showOcean);

  const dots = visibleDots
    .map((dot) => {
      const active = !style.highlightGroup || dot.groups.includes(style.highlightGroup);
      const dim = style.highlightGroup && !active;
      const isPin = pinIds.has(dot.id);
      const color = resolveDotColor(dot, groupColor, style.landColor, isPin);
      const radius = isPin ? style.pinRadius : style.dotRadius;
      const opacity = dim ? 0.22 : dot.land ? 1 : 0.35;
      return shapeNode(style.shape, dot.x, dot.y, radius, color, opacity, dot.id);
    })
    .join("\n");

  const labels =
    style.showLabels && snapshot.labels.length > 0
      ? snapshot.labels.map((label) => renderLabel(label, style)).join("\n")
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${snapshot.width} ${snapshot.height}" width="${snapshot.width}" height="${snapshot.height}" role="img">
<rect width="100%" height="100%" fill="${style.background}"/>
<g class="dots">${dots}</g>
<g class="labels">${labels}</g>
</svg>`;
}

export function resolveDotColor(
  dot: Dot,
  groupColor: Map<string, string>,
  fallback: string,
  isPin = false,
): string {
  if (dot.groups.length > 0) {
    const last = dot.groups[dot.groups.length - 1];
    const color = groupColor.get(last);
    if (color) return isPin ? color : color;
  }
  return fallback;
}

export function shapeNode(
  shape: DotShape,
  x: number,
  y: number,
  radius: number,
  fill: string,
  opacity: number,
  id?: string,
): string {
  const common = `fill="${fill}" fill-opacity="${opacity}"${id ? ` data-id="${id}"` : ""}`;
  if (shape === "square") {
    const size = radius * 1.8;
    return `<rect x="${(x - size / 2).toFixed(2)}" y="${(y - size / 2).toFixed(2)}" width="${size.toFixed(2)}" height="${size.toFixed(2)}" rx="0.4" ${common}/>`;
  }
  if (shape === "hexagon") {
    return `<path d="${hexPath(x, y, radius)}" ${common}/>`;
  }
  return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius}" ${common}/>`;
}

export function hexPath(x: number, y: number, radius: number): string {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    return `${(x + radius * Math.cos(angle)).toFixed(2)},${(y + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join("L")}Z`;
}

function renderLabel(
  label: LabelPlacement,
  style: Required<Pick<SvgRenderOptions, "labelColor" | "connectorColor" | "fontFamily" | "fontSize">>,
): string {
  const points = label.connector.points;
  const connector =
    points.length >= 2
      ? `<path d="${polyline(points)}" fill="none" stroke="${style.connectorColor}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`
      : "";
  return `<g class="label" data-pin="${escapeAttr(label.pinId)}">${connector}<text x="${label.x.toFixed(2)}" y="${label.y.toFixed(2)}" text-anchor="${label.align}" dominant-baseline="${label.baseline}" fill="${style.labelColor}" font-family="${style.fontFamily}" font-size="${style.fontSize}" font-weight="600">${escapeXml(label.text)}</text></g>`;
}

function polyline(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeXml(value);
}

export function formatMatrix(
  matrix: number[][],
  options: { land?: string; ocean?: string; join?: string } = {},
): string {
  const land = options.land ?? "1";
  const ocean = options.ocean ?? "0";
  const join = options.join ?? "";
  return matrix.map((row) => row.map((cell) => (cell ? land : ocean)).join(join)).join("\n");
}
