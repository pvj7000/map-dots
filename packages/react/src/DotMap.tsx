import {
  createMap,
  hasHighlight,
  hexPath,
  highlightFromHover,
  hoverRelatesSiblings,
  matchHighlight,
  resolveDotColor,
  type ComputeInput,
  type Dot,
  type DotShape,
  type HoverMode,
  type MapHighlight,
  type MapOptions,
  type MapSnapshot,
  type PlacedPin,
} from "@dotmap/core";
import { resolveTheme, themePresetName, themeToCssVars, type DotMapTheme, type ThemePreset } from "@dotmap/theme";
import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export interface DotMapProps extends Partial<MapOptions>, ComputeInput {
  snapshot?: MapSnapshot;
  shape?: DotShape;
  highlight?: MapHighlight | null;
  highlightGroup?: string | null;
  hoverMode?: HoverMode;
  theme?: DotMapTheme | ThemePreset;
  showOcean?: boolean;
  className?: string;
  style?: CSSProperties;
  renderDot?: (dot: Dot, context: { isPin: boolean; highlighted: boolean; hover: boolean }) => ReactNode;
  renderPin?: (pin: PlacedPin) => ReactNode;
  onPinEnter?: (pin: PlacedPin) => void;
  onPinLeave?: (pin: PlacedPin) => void;
  onHover?: (highlight: MapHighlight | null, target?: { dot: Dot; pin?: PlacedPin }) => void;
}

export function DotMap(props: DotMapProps) {
  const snapshot = useResolvedSnapshot(props);
  const shape = props.shape ?? "circle";
  const hoverMode = props.hoverMode ?? "country";
  const highlight: MapHighlight | null = props.highlight ?? (props.highlightGroup ? { group: props.highlightGroup } : null);
  const filtering = hasHighlight(highlight);
  const showOcean = props.showOcean ?? false;
  const theme = resolveTheme(props.theme);
  const [hover, setHover] = useState<MapHighlight | null>(null);
  const hoverModeRef = useRef(hoverMode);
  hoverModeRef.current = hoverMode;
  const hovering = Boolean(hover && hoverRelatesSiblings(hoverMode));

  useEffect(() => {
    setHover(null);
  }, [hoverMode]);
  const groupColor = new Map(snapshot.legend.map((item) => [item.id, item.color]));
  const pinsByCell = new Map<string, PlacedPin>(
    snapshot.pins.map((pin) => [`${pin.snapped.col}:${pin.snapped.row}`, pin]),
  );
  const dotsById = useMemo(() => new Map(snapshot.dots.map((dot) => [dot.id, dot])), [snapshot.dots]);
  const sizes = {
    dot: Number(theme.dotSize ?? 2.15),
    pin: Number(theme.pinSize ?? 3.8),
  };

  const setHoverTarget = (next: MapHighlight | null, target?: { dot: Dot; pin?: PlacedPin }) => {
    setHover(next);
    props.onHover?.(next, target);
  };

  const onPointerOver = (event: PointerEvent<SVGSVGElement>) => {
    const node = (event.target as Element | null)?.closest?.("[data-id]");
    if (!node) return;
    const id = node.getAttribute("data-id");
    const dot = id ? dotsById.get(id) : undefined;
    if (!dot) return;
    const pin = pinsByCell.get(dot.id);
    setHoverTarget(highlightFromHover(hoverModeRef.current, dot, pin), { dot, pin });
  };

  return (
    <svg
      className={["dotmap", filtering ? "is-filtering" : "", hovering ? "is-hovering" : "", props.className]
        .filter(Boolean)
        .join(" ")}
      data-theme={themePresetName(props.theme)}
      data-hover={hoverMode}
      viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
      role="img"
      aria-label="Dotted world map"
      style={{ ...(themeToCssVars(props.theme) as CSSProperties), ...props.style }}
      onPointerOver={onPointerOver}
      onPointerLeave={() => setHoverTarget(null)}
    >
      <g className="dotmap__dots">
        {snapshot.dots
          .filter((dot) => dot.land || showOcean)
          .map((dot) => {
            const pin = pinsByCell.get(dot.id);
            const highlighted = matchHighlight(dot, highlight, pin);
            const related = Boolean(hover && matchHighlight(dot, hover, pin));
            const exact = Boolean(hover?.cell === dot.id || (pin && hover?.pin === pin.id));
            if (props.renderDot) {
              return (
                <g key={dot.id} className="dotmap__dot-slot" data-id={dot.id}>
                  {props.renderDot(dot, { isPin: Boolean(pin), highlighted, hover: exact || related })}
                </g>
              );
            }
            return (
              <DotShapeNode
                key={dot.id}
                dot={dot}
                shape={shape}
                isPin={Boolean(pin)}
                highlighted={filtering && highlighted}
                exact={exact}
                related={related && !exact}
                radius={pin ? sizes.pin : sizes.dot}
                color={pin?.color ?? resolveDotColor(dot, groupColor, "var(--dotmap-land)", Boolean(pin))}
              />
            );
          })}
      </g>
      <g className="dotmap__labels">
        {snapshot.labels.map((label) => {
          const pin = snapshot.pins.find((item) => item.id === label.pinId);
          const cell = pin ? `${pin.snapped.col}:${pin.snapped.row}` : "";
          const labeled = cell ? dotsById.get(cell) : undefined;
          const related = Boolean(hover && labeled && matchHighlight(labeled, hover, pin));
          const exact = Boolean(hover?.cell === cell || hover?.pin === label.pinId);
          return (
            <g
              key={label.pinId}
              className={["dotmap__label", exact ? "is-hover" : "", related && !exact ? "is-related" : ""]
                .filter(Boolean)
                .join(" ")}
            >
              {label.connector.points.length >= 2 ? (
                <path className="dotmap__connector" d={toPath(label.connector.points)} fill="none" />
              ) : null}
              <text x={label.x} y={label.y} textAnchor={label.align} dominantBaseline={label.baseline}>
                {label.text}
              </text>
            </g>
          );
        })}
      </g>
      <g className="dotmap__pins">
        {snapshot.pins.map((pin) => (
          <g
            key={pin.id}
            className="dotmap__pin-hit"
            data-id={`${pin.snapped.col}:${pin.snapped.row}`}
            onMouseEnter={() => props.onPinEnter?.(pin)}
            onMouseLeave={() => props.onPinLeave?.(pin)}
          >
            {props.renderPin ? (
              props.renderPin(pin)
            ) : (
              <circle className="dotmap__pin" cx={pin.snapped.x} cy={pin.snapped.y} r={8} fill="transparent" />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

function useResolvedSnapshot(props: DotMapProps): MapSnapshot {
  const options = useMemo<MapOptions | null>(() => {
    if (props.snapshot || !props.geojson) return null;
    return {
      geojson: props.geojson,
      width: props.width,
      height: props.height,
      spacing: props.spacing,
      grid: props.grid,
      projection: props.projection,
      padding: props.padding,
      region: props.region,
      countries: props.countries,
      continents: props.continents,
      exclude: props.exclude,
      includeOcean: props.includeOcean,
    };
  }, [
    props.snapshot,
    props.geojson,
    props.width,
    props.height,
    props.spacing,
    props.grid,
    props.projection,
    props.padding,
    props.region,
    props.countries,
    props.continents,
    props.exclude,
    props.includeOcean,
  ]);

  const computeInput = useMemo<ComputeInput>(
    () => ({
      pins: props.pins,
      groups: props.groups,
      countryGroups: props.countryGroups,
      continentGroups: props.continentGroups,
      labels: props.labels,
    }),
    [props.pins, props.groups, props.countryGroups, props.continentGroups, props.labels],
  );

  const computed = useMemo(() => {
    if (!options) return null;
    return createMap(options).compute(computeInput);
  }, [options, computeInput]);

  const snapshot = props.snapshot ?? computed;
  if (!snapshot) {
    throw new Error("DotMap needs either a snapshot or a geojson FeatureCollection");
  }
  return snapshot;
}

function DotShapeNode({
  dot,
  shape,
  isPin,
  highlighted,
  exact,
  related,
  radius,
  color,
}: {
  dot: Dot;
  shape: DotShape;
  isPin: boolean;
  highlighted: boolean;
  exact: boolean;
  related: boolean;
  radius: number;
  color: string;
}) {
  const className = [
    "dotmap__dot",
    isPin ? "is-pin" : "",
    highlighted ? "is-active" : "",
    exact ? "is-hover" : "",
    related ? "is-related" : "",
    dot.land ? "is-land" : "is-ocean",
  ]
    .filter(Boolean)
    .join(" ");
  const style = {
    ["--delay" as string]: `${Math.round(dot.x * 0.35)}ms`,
    ["--dotmap-dot-fill" as string]: color,
  };

  if (shape === "square") {
    const size = radius * 1.8;
    return (
      <rect
        className={className}
        x={dot.x - size / 2}
        y={dot.y - size / 2}
        width={size}
        height={size}
        rx={0.4}
        style={style}
        data-id={dot.id}
        data-country={dot.country}
        data-continent={dot.continent}
      />
    );
  }

  if (shape === "hexagon") {
    return (
      <path
        className={className}
        d={hexPath(dot.x, dot.y, radius)}
        style={style}
        data-id={dot.id}
        data-country={dot.country}
        data-continent={dot.continent}
      />
    );
  }

  return (
    <circle
      className={className}
      cx={dot.x}
      cy={dot.y}
      r={radius}
      style={style}
      data-id={dot.id}
      data-country={dot.country}
      data-continent={dot.continent}
    />
  );
}

function toPath(points: { x: number; y: number }[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}
