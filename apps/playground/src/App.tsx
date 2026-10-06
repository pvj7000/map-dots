import {
  createMap,
  type GridTopology,
  type MapOptions,
  type MapPreset,
  type HoverMode,
  type PinInput,
  type ProjectionName,
} from "@dotmap/core";
import { DotMap, Legend } from "@dotmap/react";
import { resolveTheme, type ThemePreset } from "@dotmap/theme";
import world from "@dotmap/world";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  importPreset,
  loadDraft,
  saveDraft,
  presetScope,
  presetTheme,
  starterPreset,
  type Starter,
} from "./customizer-state";
import { ExportCard } from "./ExportCard";
import { LocationEditor } from "./LocationEditor";
import { ProductPage } from "./ProductPage";
import {
  appearanceForTheme,
  buildPreset,
  type Appearance,
} from "./export-source";
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

type Panel = "design" | "locations" | "export";
const starters: { id: Starter; label: string; hint: string; symbol: string }[] =
  [
    {
      id: "presence",
      label: "Global presence",
      hint: "Offices & markets",
      symbol: "◎",
    },
    {
      id: "continents",
      label: "A colorful world",
      hint: "Continents at a glance",
      symbol: "◈",
    },
    {
      id: "blank",
      label: "A clean canvas",
      hint: "Start with just the dots",
      symbol: "⠿",
    },
  ];

export function App() {
  return (
    <ProductPage>
      <MapCustomizer />
    </ProductPage>
  );
}

function MapCustomizer() {
  const [loaded] = useState(() => loadDraft(starterPreset("presence")));
  const [preset, setPreset] = useState<MapPreset>(loaded.preset);
  const [theme, setThemeChoice] = useState<ThemePreset>(() =>
    presetTheme(loaded.preset),
  );
  const [starter, setStarter] = useState<Starter | null>(
    loaded.restored ? null : "presence",
  );
  const [panel, setPanel] = useState<Panel>("design");
  const [status, setStatus] = useState(loaded.message);
  const lastSaved = useRef(loaded.preset);
  const importInput = useRef<HTMLInputElement>(null);
  const [hoverGroup, setHoverGroup] = useState<string | null>(null);
  const [lockedGroup, setLockedGroup] = useState<string | null>(null);
  const [previewLocation, setPreviewLocation] = useState<PinInput | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);
  const grid = preset.map.grid ?? "diagonal";
  const projection =
    typeof preset.map.projection === "object"
      ? preset.map.projection.name
      : (preset.map.projection ?? "robinson");
  const spacing = preset.map.spacing ?? 8;
  const hoverMode = preset.display.hoverMode ?? "country";
  const scope = presetScope(preset.map);
  const colorMode = Object.keys(preset.content.continentGroups ?? {}).length
    ? "continents"
    : "presence";
  const locations = preset.content.pins ?? [];
  const groups = preset.content.groups ?? [];
  const locationGroups = groups;
  const groupColors = Object.fromEntries(
    groups.map((group) => [group.id, group.color]),
  );
  const appearanceOf = (p: MapPreset): Appearance => {
    const display = resolveTheme(p.display.theme);
    return {
      background: display.bg ?? "transparent",
      land: display.land ?? "#8d8679",
      dotSize: Number(display.dotSize ?? 2.15),
    };
  };
  const appearance = appearanceOf(preset);
  const updateMap = (patch: Partial<MapOptions>) =>
    setPreset((prev) => ({ ...prev, map: { ...prev.map, ...patch } }));
  const setGrid = (grid: GridTopology) => updateMap({ grid });
  const setProjection = (projection: ProjectionName) =>
    updateMap({ projection });
  const setSpacing = (spacing: number) => updateMap({ spacing });
  const setHoverMode = (hoverMode: HoverMode) =>
    setPreset((prev) => ({ ...prev, display: { ...prev.display, hoverMode } }));
  const setLocations = (pins: PinInput[]) =>
    setPreset((prev) => ({ ...prev, content: { ...prev.content, pins } }));
  const setGroupColors = (colors: Record<string, string>) =>
    setPreset((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        groups: (prev.content.groups ?? []).map((group) => ({
          ...group,
          color: colors[group.id] ?? group.color,
        })),
      },
    }));
  const setAppearance = (next: Appearance) =>
    setPreset((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        theme: {
          ...resolveTheme(prev.display.theme),
          bg: next.background,
          land: next.land,
          dotSize: String(next.dotSize),
          pinStroke: next.background,
          labelHalo: next.background,
        },
      },
    }));
  const setScope = (scope: ScopeId) =>
    setPreset((prev) => {
      const {
        countries: _countries,
        continents: _continents,
        region: _region,
        ...map
      } = prev.map;
      return { ...prev, map: { ...map, ...viewOptions(scope) } };
    });
  const setColorMode = (mode: ColorMode) =>
    setPreset((prev) => {
      const baseGroups = [
        ...groupsForTheme(theme, "presence"),
        ...(prev.content.groups ?? []).filter(
          (group) => !Object.keys(continentGroupMap).includes(group.id),
        ),
      ];
      const unique = [
        ...new Map(baseGroups.map((group) => [group.id, group])).values(),
      ];
      return {
        ...prev,
        content: {
          ...prev.content,
          groups:
            mode === "continents"
              ? [...groupsForTheme(theme, "continents"), ...unique]
              : unique,
          countryGroups:
            mode === "continents" ? { RUS: "asia" } : countryGroups,
          continentGroups: mode === "continents" ? continentGroupMap : {},
        },
      };
    });
  const map = useMemo(
    () => createMap({ geojson: world, ...preset.map }),
    [preset.map],
  );
  const snapshot = useMemo(
    () =>
      map.compute({
        ...preset.content,
        pins: previewLocation
          ? [
              ...locations.filter((pin) => pin.id !== previewLocation.id),
              previewLocation,
            ]
          : locations,
      }),
    [map, preset.content, previewLocation],
  );

  useEffect(() => {
    if (preset === lastSaved.current) return;
    const error = saveDraft(preset);
    if (error) setStatus(error);
    lastSaved.current = preset;
  }, [preset]);
  useEffect(() => {
    setHoverGroup(null);
    setLockedGroup(null);
    setSelectedLocation(null);
    setPreviewLocation(null);
    setEditorVersion((version) => version + 1);
  }, [scope, colorMode]);
  useEffect(() => {
    if (panel !== "locations") {
      setPreviewLocation(null);
      setSelectedLocation(null);
      setEditorVersion((version) => version + 1);
    }
  }, [panel]);

  const chooseTheme = (next: ThemePreset) => {
    setThemeChoice(next);
    const palette = [
      ...groupsForTheme(next, "presence"),
      ...groupsForTheme(next, "continents"),
    ];
    setPreset((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        theme: {
          ...resolveTheme(next),
          ...{ bg: appearanceForTheme(next).background },
        },
      },
      content: {
        ...prev.content,
        groups: (prev.content.groups ?? []).map((group) => ({
          ...group,
          color:
            palette.find((item) => item.id === group.id)?.color ?? group.color,
        })),
      },
    }));
  };
  const clearSelection = () => {
    setPreviewLocation(null);
    setSelectedLocation(null);
    setHoverGroup(null);
    setLockedGroup(null);
    setEditorVersion((version) => version + 1);
  };
  const chooseStarter = (next: Starter) => {
    setStarter(next);
    setPreset(starterPreset(next));
    setThemeChoice(next === "blank" ? "ink" : "paper");
    clearSelection();
    setPanel("design");
    setStatus("New starter loaded. Your changes are saved in this browser.");
  };
  const readPreset = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Preset file exceeds 2 MB.");
      const imported = importPreset(await file.text());
      setPreset(imported);
      setThemeChoice(presetTheme(imported));
      setStarter(null);
      clearSelection();
      setPanel("design");
      setStatus(`Imported ${file.name}.`);
    } catch (error) {
      setStatus(
        `Import failed: ${error instanceof Error ? error.message : "Could not read this file."}`,
      );
    } finally {
      if (importInput.current) importInput.current.value = "";
    }
  };
  const activeGroup = hoverGroup ?? lockedGroup;
  const scopeName =
    scopes.find((item) => item.id === scope)?.label ?? "Custom view";

  return (
    <section
      className="customizer-section"
      id="customize"
      aria-labelledby="customizer-title"
    >
      <div className="page-width">
        <div className="customizer-heading">
          <div>
            <p className="eyebrow">The map is the starting point</p>
            <h2 id="customizer-title">A few clicks. Your kind of world.</h2>
            <p>
              Choose a starting point, make it your own, then take the code with
              you.
            </p>
          </div>
          <span className="interactive-badge">
            <span className="status-dot" /> Interactive customizer
          </span>
        </div>
        <div className="preset-actions">
          <input
            ref={importInput}
            type="file"
            accept=".json,application/json"
            aria-label="Import JSON preset"
            hidden
            onChange={(event) => void readPreset(event.target.files?.[0])}
          />
          <button
            className="btn btn--small btn--ghost"
            type="button"
            onClick={() => importInput.current?.click()}
          >
            Import JSON preset
          </button>
          <p role="status">{status}</p>
        </div>
        <div className="starter-presets" aria-label="Starting presets">
          {starters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={starter === item.id}
              className={starter === item.id ? "is-on" : ""}
              onClick={() => chooseStarter(item.id)}
            >
              <span
                className={`starter-symbol starter-symbol--${item.id}`}
                aria-hidden="true"
              >
                {item.symbol}
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              <span className="starter-arrow" aria-hidden="true">
                ↗︎
              </span>
            </button>
          ))}
        </div>

        <div className="builder-layout">
          <div className="preview-column">
            <section className="stage card" aria-label="Live map preview">
              <div className="preview-header">
                <span className="preview-label">
                  <span className="status-dot" /> Live preview
                </span>
                <span>
                  {scopeName} / {projection}
                </span>
              </div>
              <div
                className="stage__map"
                style={{ background: appearance.background }}
              >
                <DotMap
                  snapshot={snapshot}
                  theme={preset.display.theme}
                  hoverMode={hoverMode}
                  shape={preset.display.shape}
                  showOcean={preset.display.showOcean}
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
                  {snapshot.landDots.length.toLocaleString("en-US")} dots ·{" "}
                  {snapshot.pins.length}{" "}
                  {snapshot.pins.length === 1 ? "location" : "locations"}
                </p>
              </div>
            </section>
            <div className="preview-note">
              <span aria-hidden="true">↳</span>
              <p>
                Hover over the map to explore. Click a legend item to focus on a
                group.
              </p>
              <button
                type="button"
                className="inline-link"
                onClick={() => setPanel("export")}
              >
                Get the code <span aria-hidden="true">→</span>
              </button>
            </div>
            {snapshot.pins.length < locations.length ? (
              <p className="scope-notice" role="status">
                {locations.length - snapshot.pins.length}{" "}
                {locations.length - snapshot.pins.length === 1
                  ? "location is"
                  : "locations are"}{" "}
                outside this view. All saved locations are included in the
                export.
              </p>
            ) : null}
          </div>

          <aside className="builder-panel" aria-label="Map settings">
            <div
              className="builder-tabs"
              role="tablist"
              aria-label="Customizer steps"
            >
              {(["design", "locations", "export"] as const).map(
                (item, index) => (
                  <button
                    key={item}
                    id={`tab-${item}`}
                    type="button"
                    role="tab"
                    aria-selected={panel === item}
                    aria-controls={`panel-${item}`}
                    tabIndex={panel === item ? 0 : -1}
                    onClick={() => setPanel(item)}
                    onKeyDown={(event) => {
                      const tabs: Panel[] = ["design", "locations", "export"];
                      const next =
                        event.key === "ArrowRight"
                          ? tabs[(index + 1) % 3]
                          : event.key === "ArrowLeft"
                            ? tabs[(index + 2) % 3]
                            : event.key === "Home"
                              ? tabs[0]
                              : event.key === "End"
                                ? tabs[2]
                                : null;
                      if (next) {
                        event.preventDefault();
                        setPanel(next);
                        document.getElementById(`tab-${next}`)?.focus();
                      }
                    }}
                  >
                    <span>0{index + 1}</span>
                    {item === "design"
                      ? "Design"
                      : item === "locations"
                        ? "Locations"
                        : "Export"}
                  </button>
                ),
              )}
            </div>

            <div
              id="panel-design"
              role="tabpanel"
              aria-labelledby="tab-design"
              hidden={panel !== "design"}
            >
              <section className="card controls">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">Make it yours</p>
                    <h3>The look & feel</h3>
                  </div>
                  <button
                    className="text-btn"
                    type="button"
                    onClick={() => chooseStarter(starter ?? "presence")}
                  >
                    Reset preset
                  </button>
                </div>
                <fieldset className="control-group">
                  <legend>Theme</legend>
                  <div className="theme-choices">
                    {themes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={theme === item.id}
                        className={theme === item.id ? "is-on" : ""}
                        onClick={() => chooseTheme(item.id)}
                      >
                        <span
                          className={`theme-swatch theme-swatch--${item.id}`}
                          aria-hidden="true"
                        />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="palette-fields">
                  <label>
                    <span>Background</span>
                    <span>
                      <input
                        aria-label="Map background color"
                        type="color"
                        value={appearance.background}
                        onChange={(event) =>
                          setAppearance({
                            ...appearance,
                            background: event.target.value,
                          })
                        }
                      />
                      <code>{appearance.background}</code>
                    </span>
                  </label>
                  <label>
                    <span>Land dots</span>
                    <span>
                      <input
                        aria-label="Land dot color"
                        type="color"
                        value={appearance.land}
                        onChange={(event) =>
                          setAppearance({
                            ...appearance,
                            land: event.target.value,
                          })
                        }
                      />
                      <code>{appearance.land}</code>
                    </span>
                  </label>
                </div>
                <div className="control-pair">
                  <label className="field">
                    <span>Map view</span>
                    <select
                      aria-label="Map view"
                      value={scope}
                      onChange={(event) =>
                        setScope(event.target.value as ScopeId)
                      }
                    >
                      {scope === "custom" && (
                        <option value="custom">Custom view</option>
                      )}
                      {scopes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Projection</span>
                    <select
                      aria-label="Projection"
                      value={projection}
                      onChange={(event) =>
                        setProjection(event.target.value as ProjectionName)
                      }
                    >
                      {projections.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <fieldset className="control-group">
                  <legend>Dot grid</legend>
                  <div className="segment-control">
                    {grids.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        title={item.hint}
                        aria-pressed={grid === item.id}
                        className={grid === item.id ? "is-on" : ""}
                        onClick={() => setGrid(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="field range-field">
                  <span>
                    Spacing <output>{spacing}px</output>
                  </span>
                  <input
                    type="range"
                    aria-label="Spacing"
                    min={6}
                    max={18}
                    value={spacing}
                    onChange={(event) => setSpacing(Number(event.target.value))}
                  />
                </label>
                <label className="field range-field">
                  <span>
                    Dot radius <output>{appearance.dotSize}px</output>
                  </span>
                  <input
                    type="range"
                    aria-label="Dot radius"
                    min={1}
                    max={3.5}
                    step={0.05}
                    value={appearance.dotSize}
                    onChange={(event) =>
                      setAppearance({
                        ...appearance,
                        dotSize: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <div className="control-pair">
                  <label className="field">
                    <span>Color by</span>
                    <select
                      aria-label="Color by"
                      value={colorMode}
                      onChange={(event) =>
                        setColorMode(event.target.value as ColorMode)
                      }
                    >
                      <option value="presence">Locations & countries</option>
                      <option value="continents">Continents</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Hover effect</span>
                    <select
                      aria-label="Hover effect"
                      value={hoverMode}
                      onChange={(event) =>
                        setHoverMode(event.target.value as HoverMode)
                      }
                    >
                      {hoverModes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <fieldset className="control-group">
                  <legend>Group colors</legend>
                  <div className="group-colors">
                    {groups.map((group) => (
                      <label key={group.id}>
                        <input
                          type="color"
                          aria-label={`${group.label} color`}
                          value={group.color}
                          onChange={(event) =>
                            setGroupColors({
                              ...groupColors,
                              [group.id]: event.target.value,
                            })
                          }
                        />
                        <span>{group.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button
                  className="btn btn--panel"
                  type="button"
                  onClick={() => setPanel("locations")}
                >
                  Next: add your locations <span aria-hidden="true">→</span>
                </button>
              </section>
            </div>
            <div
              id="panel-locations"
              role="tabpanel"
              aria-labelledby="tab-locations"
              hidden={panel !== "locations"}
            >
              <LocationEditor
                key={editorVersion}
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
              <button
                className="btn btn--panel panel-next"
                type="button"
                onClick={() => {
                  setPreviewLocation(null);
                  setPanel("export");
                }}
              >
                Next: export your map <span aria-hidden="true">→</span>
              </button>
            </div>
            <div
              id="panel-export"
              role="tabpanel"
              aria-labelledby="tab-export"
              hidden={panel !== "export"}
            >
              <ExportCard preset={preset} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
