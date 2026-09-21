import { continentKeys, normalizeContinent } from "./continents.js";
import type { Dot, GroupDef, HoverMode, LegendItem, MapHighlight, PlacedPin } from "./types.js";

export function applyGroups(
  dots: Dot[],
  countryGroups: Record<string, string | string[]> = {},
  pins: PlacedPin[] = [],
  continentGroups: Record<string, string | string[]> = {},
): Dot[] {
  const next = dots.map((dot) => ({ ...dot, groups: [] as string[] }));
  const byId = new Map(next.map((dot) => [dot.id, dot]));

  for (const dot of next) {
    for (const group of groupsForKeys(continentGroups, continentKeys(dot.continent))) {
      pushGroup(dot, group);
    }
    if (dot.country) {
      for (const group of groupsForKeys(countryGroups, [dot.country, dot.country.toUpperCase()])) {
        pushGroup(dot, group);
      }
    }
  }

  for (const pin of pins) {
    if (!pin.group) continue;
    const dot = byId.get(`${pin.snapped.col}:${pin.snapped.row}`);
    if (dot) pushGroup(dot, pin.group);
  }

  return next;
}

export function buildLegend(groups: GroupDef[], dots: Dot[], pins: PlacedPin[]): LegendItem[] {
  return groups.map((group) => {
    const groupDots = dots.filter((dot) => dot.groups.includes(group.id));
    const countries = unique(
      groupDots.map((dot) => dot.country).filter((value): value is string => Boolean(value)),
    );
    return {
      id: group.id,
      label: group.label,
      color: group.color,
      description: group.description,
      count: groupDots.length,
      pinCount: pins.filter((pin) => pin.group === group.id).length,
      countries,
      dotIds: groupDots.map((dot) => dot.id),
    };
  });
}

function groupsForKeys(
  mapping: Record<string, string | string[]>,
  keys: string[],
): string[] {
  const found: string[] = [];
  for (const key of keys) {
    const assigned = mapping[key];
    if (!assigned) continue;
    found.push(...(Array.isArray(assigned) ? assigned : [assigned]));
  }
  return found;
}

function pushGroup(dot: Dot, group: string): void {
  if (!dot.groups.includes(group)) dot.groups.push(group);
}

export function hasHighlight(highlight?: MapHighlight | null): boolean {
  return Boolean(
    highlight?.group || highlight?.country || highlight?.continent || highlight?.pin || highlight?.cell,
  );
}

export function matchHighlight(
  dot: Dot,
  highlight?: MapHighlight | null,
  pin?: PlacedPin,
): boolean {
  if (!hasHighlight(highlight)) return true;
  if (highlight?.cell && dot.id === highlight.cell) return true;
  if (highlight?.group && dot.groups.includes(highlight.group)) return true;
  if (highlight?.country && dot.country?.toUpperCase() === highlight.country.toUpperCase()) return true;
  if (highlight?.continent) {
    const wanted = normalizeContinent(highlight.continent);
    if (wanted && continentKeys(dot.continent).some((key) => normalizeContinent(key) === wanted)) {
      return true;
    }
  }
  if (highlight?.pin && pin?.id === highlight.pin) return true;
  return false;
}

export function highlightFromHover(
  mode: HoverMode,
  dot: Dot,
  pin?: PlacedPin,
): MapHighlight | null {
  if (mode === "none") return null;
  if (mode === "dot") return { cell: dot.id };
  if (mode === "country") return { cell: dot.id, country: dot.country ?? null };
  if (mode === "group") {
    return { cell: dot.id, group: pin?.group ?? dot.groups.at(-1) ?? null };
  }
  return { cell: dot.id, continent: normalizeContinent(dot.continent) ?? dot.continent ?? null };
}

export function hoverRelatesSiblings(mode: HoverMode): boolean {
  return mode === "country" || mode === "group" || mode === "continent";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
