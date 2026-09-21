import type { GridLayout, GridTopology } from "./types.js";

export function createGridLayout(options: {
  width: number;
  height: number;
  spacing: number;
  topology: GridTopology;
  padding: number;
}): GridLayout {
  const { width, height, spacing, topology, padding } = options;
  const innerW = Math.max(spacing, width - padding * 2);
  const innerH = Math.max(spacing, height - padding * 2);
  const xStep = spacing;
  const yStep = topology === "hex" ? spacing * (Math.sqrt(3) / 2) : spacing;
  const staggerAmount = topology === "square" ? 0 : xStep / 2;

  const cols = Math.max(1, Math.floor((innerW - staggerAmount) / xStep) + 1);
  const rows = Math.max(1, Math.floor(innerH / yStep) + 1);
  const usedW = (cols - 1) * xStep + staggerAmount;
  const usedH = (rows - 1) * yStep;

  return {
    topology,
    cols,
    rows,
    xStep,
    yStep,
    originX: padding + (innerW - usedW) / 2,
    originY: padding + (innerH - usedH) / 2,
    stagger: (row: number) => (topology === "square" ? 0 : row % 2 === 1 ? staggerAmount : 0),
  };
}

export function cellCenter(layout: GridLayout, col: number, row: number): { x: number; y: number } {
  return {
    x: layout.originX + col * layout.xStep + layout.stagger(row),
    y: layout.originY + row * layout.yStep,
  };
}

export function cellKey(col: number, row: number): string {
  return `${col}:${row}`;
}

export function nearestCell(
  layout: GridLayout,
  x: number,
  y: number,
): { col: number; row: number } {
  const row = clamp(Math.round((y - layout.originY) / layout.yStep), 0, layout.rows - 1);
  const col = clamp(
    Math.round((x - layout.originX - layout.stagger(row)) / layout.xStep),
    0,
    layout.cols - 1,
  );
  return { col, row };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
