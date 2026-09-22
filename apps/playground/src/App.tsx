import {
  createMap,
  type GridTopology,
  type HoverMode,
  type PinInput,
  type ProjectionName,
} from "@dotmap/core";
import { DotMap, Legend } from "@dotmap/react";
import type { ThemePreset } from "@dotmap/theme";
import world from "@dotmap/world";
import { useEffect, useMemo, useState } from "react";
import { ExportCard } from "./ExportCard";
import { LocationEditor } from "./LocationEditor";
import {
  type ColorMode,
  type ScopeId,
  continentGroupMap,
  countryGroups,
  grids,
  groupsForTheme,
  hoverModes,
  pins as initialPins,
  projections,
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
  const [locations, setLocations] = useState<PinInput[]>(() => initialPins.map((pin) => ({ ...pin })));
  const [previewLocation, setPreviewLocation] = useState<PinInput | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const locationGroups = groupsForTheme(theme, "presence");
  const mapGroups = groupsForTheme(theme, scope === "world" ? colorMode : "presence");
  const groups =
    scope === "world" && colorMode === "continents"
      ? [...mapGroups, ...locationGroups]
      : mapGroups;
  const displayedLocations = previewLocation
    ? [...locations.filter((pin) => pin.id !== previewLocation.id), previewLocation]
    : locations;
  const coloring =
    scope === "world" && colorMode === "continents"
      ? { continentGroups: continentGroupMap, countryGroups: { RUS: "asia" } }
      : { continentGroups: {}, countryGroups };

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "midnight" ? "dark" : "light";
  }, [theme]);

  useEffect(() => {
    setHoverGroup(null);
    setLockedGroup(null);
    setSelectedLocation(null);
    setPreviewLocation(null);
  }, [scope, colorMode]);

  const { snapshot, elapsed } = useMemo(() => {
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
    const next = map.compute({
      pins: displayedLocations,
      groups,
      ...coloring,
      labels: { connector: "elbow", fontSize: 12, gap: 20 },
    });
    return {
      snapshot: next,
      elapsed: Math.round(performance.now() - started),
    };
  }, [grid, projection, spacing, groups, scope, colorMode, displayedLocations]);

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
              highlight={
                selectedLocation
                  ? { pin: selectedLocation }
                  : activeGroup
                    ? { group: activeGroup }
                    : null
              }
            />
          </div>
          <div className="stage__footer">
            <Legend
              items={snapshot.legend}
              activeId={lockedGroup}
              onHover={setHoverGroup}
              onSelect={(id) => {
                setSelectedLocation(null);
                setLockedGroup(id);
              }}
            />
            <p className="stats">
              {land.toLocaleString("en-US")} land dots · {snapshot.pins.length}{" "}
              {snapshot.pins.length === 1 ? "pin" : "pins"} · {elapsed} ms
            </p>
          </div>
        </section>

        <aside className="sidebar">
          <LocationEditor
            locations={locations}
            groups={locationGroups}
            selectedId={selectedLocation}
            onChange={setLocations}
            onPreview={setPreviewLocation}
            onSelect={(id) => {
              setSelectedLocation(id);
              setLockedGroup(null);
            }}
          />

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

          <ExportCard
            pins={locations}
            groups={groups}
            countryGroups={coloring.countryGroups}
            continentGroups={coloring.continentGroups}
            grid={grid}
            projection={projection}
            spacing={spacing}
            scope={scope}
            theme={theme}
            hoverMode={hoverMode}
          />
        </aside>
      </main>
    </div>
  );
}
