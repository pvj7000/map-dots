import type { PlacedPin } from "./types.js";

export interface PinCluster {
  cellId: string;
  x: number;
  y: number;
  pins: PlacedPin[];
}

/** Retains every location that snapped to a shared grid cell. */
export function clusterPins(pins: PlacedPin[]): PinCluster[] {
  const cells = new Map<string, PinCluster>();
  for (const pin of pins) {
    const cellId = `${pin.snapped.col}:${pin.snapped.row}`;
    const cluster = cells.get(cellId) ?? {
      cellId,
      x: pin.snapped.x,
      y: pin.snapped.y,
      pins: [],
    };
    cluster.pins.push(pin);
    cells.set(cellId, cluster);
  }
  return [...cells.values()];
}

export function pinClusterSegments(
  cluster: PinCluster,
  radius: number,
  colors: Map<string, string>,
  fallback: string,
) {
  return cluster.pins.map((pin, index) => {
    const start = -Math.PI / 2 + (index * Math.PI * 2) / cluster.pins.length;
    const end = start + (Math.PI * 2) / cluster.pins.length;
    const point = (angle: number) =>
      `${(cluster.x + radius * Math.cos(angle)).toFixed(2)} ${(cluster.y + radius * Math.sin(angle)).toFixed(2)}`;
    const path = `M${cluster.x.toFixed(2)} ${cluster.y.toFixed(2)} L${point(start)} A${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${point(end)} Z`;
    return {
      pin,
      path,
      color:
        pin.color ??
        (pin.group ? colors.get(pin.group) : undefined) ??
        fallback,
    };
  });
}

export function pinDescription(pin: PlacedPin): string {
  return `${pin.label || pin.id}: ${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}${pin.group ? ` (${pin.group})` : ""}`;
}
