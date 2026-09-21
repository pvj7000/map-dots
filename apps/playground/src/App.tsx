import { createMap, type GridTopology, type HoverMode, type ProjectionName } from "@dotmap/core";
import { DotMap, Legend } from "@dotmap/react";
import type { ThemePreset } from "@dotmap/theme";
import world from "@dotmap/world";
import { useEffect, useMemo, useState } from "react";
import {
  type ColorMode,
  type ScopeId,
  continentGroupMap,
  countryGroups,
  grids,
  groupsForTheme,
  hoverModes,
  pins,
  projections,
  sampleSource,
  scopes,
  themes,
  viewOptions,
} from "./presence";

export function App() {
  const [grid, setGrid] = useState<GridTopology>("diagonal");
  const [projection, setProjection] = useState<ProjectionName>("robinson");
  const [spacing, setSpacing] = useState(11);
  const [theme, setTheme] = useState<ThemePreset>("paper");
  const [hoverMode, setHoverMode] = useState<HoverMode>("country");
  const [scope, setScope] = useState<ScopeId>("world");
  const [colorMode, setColorMode] = useState<ColorMode>("presence");
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);
  const [lockedGroup, setLockedGroup] = useState<string | null>(null);
  const groups = groupsForTheme(theme, scope === "world" ? colorMode : "presence");

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "midnight" ? "dark" : "light";
  }, [theme]);

  useEffect(() => {
    setHoverGroup(null);
    setLockedGroup(null);
  }, [scope, colorMode]);

  const { snapshot, vienna, elapsed } = useMemo(() => {
    const started = performance.now();
    const map = createMap({
      geojson: world,
      width: 1100,
      height: 540,
      spacing,
      grid,
      projection,
      padding: 28,
      ...viewOptions(scope),
    });
    const coloring =
      scope === "world" && colorMode === "continents"
        ? { continentGroups: continentGroupMap, countryGroups: { RUS: "asia" } }
        : { countryGroups };
    const mappedPins =
      scope === "world" && colorMode === "continents"
        ? pins.map((pin) => ({ ...pin, group: undefined }))
        : pins;
    const next = map.compute({
      pins: mappedPins,
      groups,
      ...coloring,
      labels: { connector: "elbow", fontSize: 12, gap: 20 },
    });
    return {
      snapshot: next,
      vienna: map.latLngToGrid(48.2082, 16.3738),
      elapsed: Math.round(performance.now() - started),
    };
  }, [grid, projection, spacing, groups, scope, colorMode]);

  const activeGroup = hoverGroup ?? lockedGroup;
  const land = snapshot.landDots.length;
  const title = scope === "world" ? "Global Presence" : scopes.find((item) => item.id === scope)?.label;

  return (
    <div className="app" data-theme={theme === "midnight" ? "dark" : "light"}>
      <header className="topbar">
        <div>
          <p className="eyebrow">
            DotMap.js · drop-in framework · <a href="/element.html">web component</a>
          </p>
          <h1>{title}</h1>
        </div>
        <div className="chip-row">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={["chip", theme === item.id ? "is-on" : ""].filter(Boolean).join(" ")}
              onClick={() => setTheme(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="layout">
        <section className="stage card">
          <div className="stage__map">
            <DotMap
              snapshot={snapshot}
              theme={theme}
              hoverMode={hoverMode}
              highlight={activeGroup ? { group: activeGroup } : null}
            />
          </div>
          <div className="stage__footer">
            <Legend
              items={snapshot.legend}
              activeId={lockedGroup}
              onHover={setHoverGroup}
              onSelect={setLockedGroup}
            />
            <p className="stats">
              {land.toLocaleString("en-US")} land dots · {snapshot.pins.length}{" "}
              {snapshot.pins.length === 1 ? "pin" : "pins"} · {elapsed} ms
              {scope === "world" && vienna ? ` · Wien → ${vienna.country}` : ""}
            </p>
          </div>
        </section>

        <aside className="sidebar">
          <section className="card controls">
            <h2>Hover</h2>
            <div className="choice-grid">
              {hoverModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={["choice", hoverMode === item.id ? "is-on" : ""].filter(Boolean).join(" ")}
                  onClick={() => setHoverMode(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </button>
              ))}
            </div>

            <h2 className="subhead">Scope</h2>
            <div className="chip-row">
              {scopes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={["chip", scope === item.id ? "is-on" : ""].filter(Boolean).join(" ")}
                  onClick={() => setScope(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {scope === "world" ? (
              <label className="field">
                <span>Color by</span>
                <select value={colorMode} onChange={(event) => setColorMode(event.target.value as ColorMode)}>
                  <option value="presence">Locations & countries</option>
                  <option value="continents">Continents</option>
                </select>
              </label>
            ) : null}

            <h2 className="subhead">Grid topology</h2>
            <div className="choice-grid">
              {grids.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={["choice", grid === item.id ? "is-on" : ""].filter(Boolean).join(" ")}
                  onClick={() => setGrid(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </button>
              ))}
            </div>

            <label className="field">
              <span>Projection</span>
              <select value={projection} onChange={(event) => setProjection(event.target.value as ProjectionName)}>
                {projections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Spacing · {spacing}px</span>
              <input
                type="range"
                min={8}
                max={18}
                value={spacing}
                onChange={(event) => setSpacing(Number(event.target.value))}
              />
            </label>
          </section>

          <section className="card code-card">
            <h2>Drop-in</h2>
            <pre>
              <code>{sampleSource(grid, projection, scope, theme, hoverMode)}</code>
            </pre>
          </section>
        </aside>
      </main>
    </div>
  );
}
