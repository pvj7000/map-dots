import type { Dot } from "./types.js";
import type {
  ConnectorStyle,
  LabelAnchor,
  LabelBox,
  LabelOptions,
  LabelPlacement,
  PlacedPin,
} from "./types.js";

const DEFAULT_ORDER: LabelAnchor[] = [
  "right",
  "top",
  "left",
  "bottom",
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
];

const ANCHOR_BIAS: Record<LabelAnchor, number> = {
  right: 0,
  top: 4,
  left: 8,
  bottom: 12,
  "top-right": 6,
  "top-left": 10,
  "bottom-right": 14,
  "bottom-left": 16,
};

export function estimateTextWidth(text: string, fontSize: number): number {
  let units = 0;
  for (const char of text) {
    if (char === " " || char === "." || char === ",") units += 0.32;
    else if (char.toUpperCase() === char && /[A-Z]/.test(char)) units += 0.66;
    else units += 0.56;
  }
  return Math.max(fontSize, units * fontSize);
}

export function placeLabels(
  pins: PlacedPin[],
  dots: Dot[],
  width: number,
  height: number,
  options: LabelOptions = {},
): LabelPlacement[] {
  if (options.enabled === false) return [];

  const fontSize = options.fontSize ?? 12;
  const gap = options.gap ?? 18;
  const connector = options.connector ?? "elbow";
  const placed: LabelPlacement[] = [];
  const boxes: LabelBox[] = [];
  const pinBoxes = pins.map((pin) => ({
    x: pin.snapped.x - 6,
    y: pin.snapped.y - 6,
    width: 12,
    height: 12,
  }));

  const ordered = pins
    .filter((pin) => pin.label)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const pin of ordered) {
    const text = pin.label as string;
    const textWidth = estimateTextWidth(text, fontSize);
    const textHeight = fontSize * 1.2;
    const order = pin.preferredAnchor
      ? [pin.preferredAnchor, ...DEFAULT_ORDER.filter((anchor) => anchor !== pin.preferredAnchor)]
      : DEFAULT_ORDER;

    let best: LabelPlacement | null = null;
    let bestScore = Infinity;

    for (const anchor of order) {
      const candidate = makeCandidate(pin, anchor, text, textWidth, textHeight, gap, connector);
      const score = scoreCandidate(candidate, boxes, pinBoxes, width, height, dots, pin.id);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best) {
      placed.push(best);
      boxes.push(best.box);
    }
  }

  return placed;
}

function makeCandidate(
  pin: PlacedPin,
  anchor: LabelAnchor,
  text: string,
  width: number,
  height: number,
  gap: number,
  connector: ConnectorStyle,
): LabelPlacement {
  const px = pin.snapped.x;
  const py = pin.snapped.y;
  const layout = anchorLayout(anchor, px, py, width, height, gap);

  return {
    pinId: pin.id,
    text,
    anchor,
    x: layout.x,
    y: layout.y,
    align: layout.align,
    baseline: layout.baseline,
    box: layout.box,
    connector: {
      style: connector,
      points: connectorPoints(anchor, px, py, layout.box, connector),
    },
  };
}

function anchorLayout(
  anchor: LabelAnchor,
  px: number,
  py: number,
  width: number,
  height: number,
  gap: number,
): {
  x: number;
  y: number;
  align: LabelPlacement["align"];
  baseline: LabelPlacement["baseline"];
  box: LabelBox;
} {
  switch (anchor) {
    case "right":
      return {
        x: px + gap,
        y: py,
        align: "start",
        baseline: "middle",
        box: { x: px + gap, y: py - height / 2, width, height },
      };
    case "left":
      return {
        x: px - gap,
        y: py,
        align: "end",
        baseline: "middle",
        box: { x: px - gap - width, y: py - height / 2, width, height },
      };
    case "top":
      return {
        x: px,
        y: py - gap,
        align: "middle",
        baseline: "auto",
        box: { x: px - width / 2, y: py - gap - height, width, height },
      };
    case "bottom":
      return {
        x: px,
        y: py + gap,
        align: "middle",
        baseline: "hanging",
        box: { x: px - width / 2, y: py + gap, width, height },
      };
    case "top-right":
      return {
        x: px + gap * 0.75,
        y: py - gap * 0.75,
        align: "start",
        baseline: "auto",
        box: { x: px + gap * 0.75, y: py - gap * 0.75 - height, width, height },
      };
    case "top-left":
      return {
        x: px - gap * 0.75,
        y: py - gap * 0.75,
        align: "end",
        baseline: "auto",
        box: { x: px - gap * 0.75 - width, y: py - gap * 0.75 - height, width, height },
      };
    case "bottom-right":
      return {
        x: px + gap * 0.75,
        y: py + gap * 0.75,
        align: "start",
        baseline: "hanging",
        box: { x: px + gap * 0.75, y: py + gap * 0.75, width, height },
      };
    case "bottom-left":
      return {
        x: px - gap * 0.75,
        y: py + gap * 0.75,
        align: "end",
        baseline: "hanging",
        box: { x: px - gap * 0.75 - width, y: py + gap * 0.75, width, height },
      };
  }
}

function connectorPoints(
  anchor: LabelAnchor,
  px: number,
  py: number,
  box: LabelBox,
  style: ConnectorStyle,
): { x: number; y: number }[] {
  if (style === "none") return [];

  const target = edgePoint(anchor, box);
  if (style === "line") return [{ x: px, y: py }, target];

  if (anchor === "right" || anchor === "left") {
    const midX = (px + target.x) / 2;
    return [
      { x: px, y: py },
      { x: midX, y: py },
      { x: midX, y: target.y },
      target,
    ];
  }

  if (anchor === "top" || anchor === "bottom") {
    const midY = (py + target.y) / 2;
    return [
      { x: px, y: py },
      { x: px, y: midY },
      { x: target.x, y: midY },
      target,
    ];
  }

  return [
    { x: px, y: py },
    { x: target.x, y: py },
    target,
  ];
}

function edgePoint(anchor: LabelAnchor, box: LabelBox): { x: number; y: number } {
  switch (anchor) {
    case "right":
    case "top-right":
    case "bottom-right":
      return { x: box.x - 3, y: box.y + box.height / 2 };
    case "left":
    case "top-left":
    case "bottom-left":
      return { x: box.x + box.width + 3, y: box.y + box.height / 2 };
    case "top":
      return { x: box.x + box.width / 2, y: box.y + box.height + 2 };
    case "bottom":
      return { x: box.x + box.width / 2, y: box.y - 2 };
  }
}

function scoreCandidate(
  candidate: LabelPlacement,
  labels: LabelBox[],
  pins: LabelBox[],
  width: number,
  height: number,
  dots: Dot[],
  pinId: string,
): number {
  let score = ANCHOR_BIAS[candidate.anchor];
  const { box } = candidate;
  const margin = 8;

  if (box.x < margin) score += 900 + (margin - box.x);
  if (box.y < margin) score += 900 + (margin - box.y);
  if (box.x + box.width > width - margin) score += 900 + (box.x + box.width - (width - margin));
  if (box.y + box.height > height - margin) score += 900 + (box.y + box.height - (height - margin));

  for (const other of labels) {
    if (intersects(box, other, 6)) score += 750;
  }

  for (const pin of pins) {
    if (intersects(box, pin, 4)) score += 420;
  }

  if (overlapsLand(box, dots)) score += 35;
  void pinId;
  return score;
}

function intersects(a: LabelBox, b: LabelBox, pad = 0): boolean {
  return !(
    a.x + a.width + pad < b.x ||
    b.x + b.width + pad < a.x ||
    a.y + a.height + pad < b.y ||
    b.y + b.height + pad < a.y
  );
}

function overlapsLand(box: LabelBox, dots: Dot[]): boolean {
  let hits = 0;
  let land = 0;
  for (const dot of dots) {
    if (
      dot.x >= box.x - 4 &&
      dot.x <= box.x + box.width + 4 &&
      dot.y >= box.y - 4 &&
      dot.y <= box.y + box.height + 4
    ) {
      hits += 1;
      if (dot.land) land += 1;
      if (hits >= 8) break;
    }
  }
  return hits > 0 && land / hits > 0.5;
}
