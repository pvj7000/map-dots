import type { GroupDef, LabelAnchor, PinInput } from "@dotmap/core";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

const ANCHORS: { value: LabelAnchor; label: string }[] = [
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
];

interface LocationDraft {
  id: string;
  label: string;
  lat: string;
  lng: string;
  group: string;
  color: string;
  preferredAnchor: LabelAnchor;
}

interface PlaceHit {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
}

export interface LocationEditorProps {
  locations: PinInput[];
  groups: GroupDef[];
  selectedId: string | null;
  onChange: (locations: PinInput[]) => void;
  onPreview: (location: PinInput | null) => void;
  onSelect: (id: string | null) => void;
}

export function LocationEditor({
  locations,
  groups,
  selectedId,
  onChange,
  onPreview,
  onSelect,
}: LocationEditorProps) {
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceHit[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [activePlace, setActivePlace] = useState(-1);
  const [manualOpen, setManualOpen] = useState(false);
  const skipQuery = useRef("");

  useEffect(() => {
    const term = query.trim();
    if (!draft || term.length < 2 || term === skipQuery.current) {
      setPlaces([]);
      setSearchState("idle");
      setActivePlace(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState("loading");
      try {
        const next = await searchPlaces(term, controller.signal);
        setPlaces(next);
        setActivePlace(next.length ? 0 : -1);
        setSearchState(next.length ? "idle" : "empty");
      } catch {
        if (controller.signal.aborted) return;
        setPlaces([]);
        setSearchState("error");
        setManualOpen(true);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [draft, query]);

  const startNew = () => {
    const next: LocationDraft = {
      id: uniqueId("location", locations),
      label: "",
      lat: "",
      lng: "",
      group: groups[0]?.id ?? "",
      color: "",
      preferredAnchor: "right",
    };
    setDraft(next);
    setError("");
    setQuery("");
    setPlaces([]);
    setManualOpen(false);
    skipQuery.current = "";
    onPreview(null);
    onSelect(null);
  };

  const startEdit = (location: PinInput) => {
    const next: LocationDraft = {
      id: location.id ?? uniqueId("location", locations),
      label: location.label ?? "",
      lat: String(location.lat),
      lng: String(location.lng),
      group: location.group ?? "",
      color: location.color ?? "",
      preferredAnchor: location.preferredAnchor ?? "right",
    };
    setDraft(next);
    setError("");
    setQuery(location.label ?? "");
    setPlaces([]);
    setManualOpen(false);
    skipQuery.current = location.label ?? "";
    onPreview(nextPin(next));
    onSelect(next.id);
  };

  const updateDraft = (patch: Partial<LocationDraft>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    setError("");
    onPreview(nextPin(next));
  };

  const choosePlace = (place: PlaceHit) => {
    skipQuery.current = place.name;
    setQuery(place.name);
    setPlaces([]);
    setSearchState("idle");
    setActivePlace(-1);
    updateDraft({
      label: place.name,
      lat: place.lat.toFixed(6),
      lng: place.lng.toFixed(6),
    });
  };

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!places.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActivePlace((index) => (index + 1) % places.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActivePlace((index) => (index <= 0 ? places.length - 1 : index - 1));
    } else if (event.key === "Enter" && activePlace >= 0) {
      event.preventDefault();
      const place = places[activePlace];
      if (place) choosePlace(place);
    } else if (event.key === "Escape") {
      setPlaces([]);
    }
  };

  const closeEditor = () => {
    setDraft(null);
    setError("");
    setQuery("");
    setPlaces([]);
    skipQuery.current = "";
    onPreview(null);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const location = nextPin(draft);
    if (!location) {
      setError("Add a label and valid coordinates (latitude −90…90, longitude −180…180).");
      return;
    }

    const exists = locations.some((item) => item.id === location.id);
    onChange(
      exists
        ? locations.map((item) => (item.id === location.id ? location : item))
        : [...locations, location],
    );
    onSelect(location.id ?? null);
    closeEditor();
  };

  const remove = (id: string) => {
    onChange(locations.filter((location) => location.id !== id));
    if (selectedId === id) onSelect(null);
    if (draft?.id === id) closeEditor();
  };

  return (
    <section className="card location-editor">
      <div className="section-head">
        <div>
          <p className="section-kicker">Map content</p>
          <h2>Locations <span className="count-badge">{locations.length}</span></h2>
        </div>
        <button className="btn btn--small" type="button" onClick={startNew}>
          + Add location
        </button>
      </div>

      {locations.length ? (
        <ul className="location-list">
          {locations.map((location) => {
            const id = location.id ?? `${location.lat}:${location.lng}`;
            const group = groups.find((item) => item.id === location.group);
            const color = location.color ?? group?.color ?? "var(--land)";
            return (
              <li
                key={id}
                className={["location-row", selectedId === id ? "is-selected" : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button className="location-main" type="button" onClick={() => onSelect(selectedId === id ? null : id)}>
                  <span className="location-swatch" style={{ background: color }} />
                  <span className="location-copy">
                    <strong>{location.label || "Untitled location"}</strong>
                    <small>
                      {formatCoordinate(location.lat)}, {formatCoordinate(location.lng)}
                      {group ? ` · ${group.label}` : ""}
                    </small>
                  </span>
                </button>
                <div className="location-actions">
                  <button className="icon-btn" type="button" onClick={() => startEdit(location)} aria-label={`Edit ${location.label}`}>
                    Edit
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    type="button"
                    onClick={() => remove(id)}
                    aria-label={`Remove ${location.label}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty-state">No locations yet. Search for a place, or enter coordinates.</p>
      )}

      {draft ? (
        <form className="location-form" onSubmit={save}>
          <div className="form-title">
            <strong>{locations.some((item) => item.id === draft.id) ? "Edit location" : "New location"}</strong>
            <span>Search a city or address. The pin updates as soon as coordinates are set.</span>
          </div>

          <div className="place-search">
            <label className="field" htmlFor="place-query">
              <span>Find a place</span>
            </label>
            <div className="place-search__control">
              <input
                id="place-query"
                autoFocus
                type="search"
                role="combobox"
                aria-expanded={places.length > 0}
                aria-controls="place-results"
                aria-autocomplete="list"
                value={query}
                placeholder="Vienna, Tokyo, Cape Town…"
                onChange={(event) => {
                  skipQuery.current = "";
                  setQuery(event.target.value);
                }}
                onKeyDown={onSearchKeyDown}
              />
              {places.length ? (
                <ul id="place-results" className="place-results" role="listbox">
                  {places.map((place, index) => (
                    <li key={place.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === activePlace}
                        className={index === activePlace ? "is-active" : ""}
                        onMouseEnter={() => setActivePlace(index)}
                        onClick={() => choosePlace(place)}
                      >
                        <strong>{place.name}</strong>
                        <small>{place.detail}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {searchState === "loading" ? <p className="coordinate-hint">Searching OpenStreetMap…</p> : null}
            {searchState === "empty" ? (
              <p className="coordinate-hint">No places found. Try another name, or enter coordinates below.</p>
            ) : null}
            {searchState === "error" ? (
              <p className="form-error" role="alert">
                Place search is unavailable. Enter the coordinates manually.
              </p>
            ) : null}
          </div>

          <label className="field">
            <span>Label</span>
            <input
              type="text"
              value={draft.label}
              placeholder="Shown on the map"
              onChange={(event) => updateDraft({ label: event.target.value })}
            />
          </label>

          <details className="manual-coords" open={manualOpen} onToggle={(event) => setManualOpen(event.currentTarget.open)}>
            <summary>
              {draft.lat && draft.lng
                ? `Coordinates · ${draft.lat}, ${draft.lng}`
                : "Enter coordinates manually"}
            </summary>
            <div className="coordinate-grid">
              <label className="field">
                <span>Latitude</span>
                <input
                  type="number"
                  min="-90"
                  max="90"
                  step="any"
                  inputMode="decimal"
                  value={draft.lat}
                  placeholder="48.2082"
                  onChange={(event) => updateDraft({ lat: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Longitude</span>
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="any"
                  inputMode="decimal"
                  value={draft.lng}
                  placeholder="16.3738"
                  onChange={(event) => updateDraft({ lng: event.target.value })}
                />
              </label>
            </div>
            <p className="coordinate-hint">Use negative values for south and west.</p>
          </details>

          <div className="coordinate-grid">
            <label className="field">
              <span>Group</span>
              <select value={draft.group} onChange={(event) => updateDraft({ group: event.target.value })}>
                <option value="">No group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Label anchor</span>
              <select
                value={draft.preferredAnchor}
                onChange={(event) => updateDraft({ preferredAnchor: event.target.value as LabelAnchor })}
              >
                {ANCHORS.map((anchor) => (
                  <option key={anchor.value} value={anchor.value}>
                    {anchor.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="color-field">
            <label>
              <span>Pin color</span>
              <input
                type="color"
                value={draft.color || groups.find((item) => item.id === draft.group)?.color || "#0f766e"}
                onChange={(event) => updateDraft({ color: event.target.value })}
              />
            </label>
            <button
              type="button"
              className="text-btn"
              disabled={!draft.color}
              onClick={() => updateDraft({ color: "" })}
            >
              Use group color
            </button>
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="form-actions">
            <button className="btn" type="submit">Save location</button>
            <button className="btn btn--ghost" type="button" onClick={closeEditor}>Cancel</button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function nextPin(draft: LocationDraft): PinInput | null {
  const lat = Number(draft.lat);
  const lng = Number(draft.lng);
  if (!draft.label.trim() || draft.lat === "" || draft.lng === "") return null;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  return {
    id: draft.id,
    label: draft.label.trim(),
    lat,
    lng,
    group: draft.group || undefined,
    color: draft.color || undefined,
    preferredAnchor: draft.preferredAnchor,
  };
}

function uniqueId(seed: string, locations: PinInput[]): string {
  const existing = new Set(locations.map((location) => location.id));
  let index = locations.length + 1;
  let id = `${seed}-${index}`;
  while (existing.has(id)) {
    index += 1;
    id = `${seed}-${index}`;
  }
  return id;
}

function formatCoordinate(value: number): string {
  return Number(value.toFixed(4)).toString();
}

async function searchPlaces(query: string, signal: AbortSignal): Promise<PlaceHit[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lang", "en");
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  const body = (await response.json()) as {
    features?: {
      geometry?: { coordinates?: [number, number] };
      properties?: {
        osm_type?: string;
        osm_id?: number;
        osm_key?: string;
        osm_value?: string;
        type?: string;
        name?: string;
        city?: string;
        state?: string;
        county?: string;
        country?: string;
      };
    }[];
  };

  return (body.features ?? [])
    .flatMap((feature) => {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      const properties = feature.properties;
      if (!properties?.name || lat === undefined || lng === undefined) return [];
      const where = [properties.city, properties.county, properties.state, properties.country]
        .filter((part, index, parts): part is string => Boolean(part) && part !== properties.name && parts.indexOf(part) === index)
        .join(", ");
      const kind = PLACE_KINDS[properties.osm_value ?? ""] ?? PLACE_KINDS[properties.type ?? ""];
      return [
        {
          id: `${properties.osm_type ?? "place"}:${properties.osm_id ?? properties.name}`,
          name: properties.name,
          detail: [kind, where].filter(Boolean).join(" · ") || "OpenStreetMap",
          lat,
          lng,
          rank: placeRank(properties),
        },
      ];
    })
    .sort((a, b) => a.rank - b.rank)
    .map(({ rank: _rank, ...place }) => place);
}

const PLACE_KINDS: Record<string, string> = {
  city: "City",
  town: "Town",
  village: "Village",
  hamlet: "Hamlet",
  suburb: "Suburb",
  locality: "Locality",
  administrative: "Administrative area",
  county: "County",
  state: "State",
  country: "Country",
};

function placeRank(properties: { osm_key?: string; osm_value?: string; type?: string }): number {
  const kind = properties.osm_value ?? properties.type ?? "";
  const preferred = ["city", "town", "village", "hamlet", "suburb", "locality"];
  const preferredIndex = preferred.indexOf(kind);
  if (properties.osm_key === "place" && preferredIndex >= 0) return preferredIndex;
  if (properties.osm_key === "place") return 20;
  if (properties.osm_key === "boundary") return 80;
  return 40;
}
