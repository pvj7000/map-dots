import type { LegendItem } from "@dotmap/core";

export interface LegendProps {
  items: LegendItem[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  className?: string;
}

export function Legend({ items, activeId = null, onHover, onSelect, className }: LegendProps) {
  return (
    <ul className={["dotmap-legend", className].filter(Boolean).join(" ")}>
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <li key={item.id}>
            <button
              type="button"
              className={["dotmap-legend__item", active ? "is-active" : ""].filter(Boolean).join(" ")}
              onMouseEnter={() => onHover?.(item.id)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(item.id)}
              onBlur={() => onHover?.(null)}
              onClick={() => onSelect?.(active ? null : item.id)}
              aria-pressed={active}
            >
              <span className="dotmap-legend__swatch" style={{ background: item.color }} />
              <span className="dotmap-legend__copy">
                <span className="dotmap-legend__label">{item.label}</span>
                <span className="dotmap-legend__meta">
                  {item.pinCount} {item.pinCount === 1 ? "pin" : "pins"} · {item.countries.length}{" "}
                  {item.countries.length === 1 ? "country" : "countries"}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
