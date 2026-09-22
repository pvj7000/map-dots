# DotMap

A headless TypeScript engine for **dotted / matrix world maps**. It turns GeoJSON into a grid of coordinates you can render in React, SVG, Canvas, or anything else.

Existing libraries mostly return a baked SVG string. DotMap returns data: dots, snapped pins, collision-aware labels, and legend metadata.

## Recommended stack

| Layer | Package | Why |
| --- | --- | --- |
| Engine | `@dotmap/core` | Headless. `createMap` once, `compute()` is cheap. Framework-agnostic. |
| Display tokens | `@dotmap/theme` | One CSS file. Every look — color, size, hover — is a `--dotmap-*` variable. |
| Any website | `@dotmap/element` | `<dot-map>` custom element. No React required. |
| React / Next | `@dotmap/react` | Thin wrapper over the same tokens and hover API. |
| Data | `@dotmap/world` | Compact Natural Earth 110m countries. Swap your own GeoJSON anytime. |

Do not bake colors into the engine. Sites override the map by setting CSS variables on the host, a parent, or via the `theme` prop.

```html
<script type="module" src="./node_modules/@dotmap/element/src/index.ts"></script>
<dot-map
  grid="diagonal"
  projection="robinson"
  theme="paper"
  hover-mode="country"
></dot-map>
```

```css
/* Override any token on the host or the svg. Named presets stay in CSS. */
dot-map,
.dotmap {
  --dotmap-land: #8d8679;
  --dotmap-hover-scale: 1.8;
  --dotmap-hover-duration: 140ms;
}
```

```tsx
import { DotMap } from '@dotmap/react';

<DotMap snapshot={snapshot} theme="midnight" hoverMode="group" />
```

## Packages

- `@dotmap/core` — projections, grid topologies, pin snapping, labels, legend, optional SVG string
- `@dotmap/theme` — CSS variables, presets (`paper`, `ink`, `midnight`), hover styles
- `@dotmap/element` — drop-in `<dot-map>` web component
- `@dotmap/react` — `<DotMap>`, `<Legend>`, `useDotMap`
- `@dotmap/world` — Natural Earth 110m countries
- `@dotmap/playground` — interactive demo (`/` React, `/element.html` web component)

## The API we wanted

```ts
import { createMap } from '@dotmap/core';
import { DotMap, Legend } from '@dotmap/react';
import world from '@dotmap/world';

const map = createMap({
  geojson: world,
  grid: 'diagonal',          // square | diagonal | hex
  projection: 'robinson',    // mercator, equalEarth, naturalEarth, ...
  width: 1100,
  spacing: 11,
});

const vienna = map.latLngToGrid(48.2082, 16.3738);
// → nearest land dot, with country ISO and pixel x/y

const snapshot = map.compute({
  groups: [
    { id: 'teams', label: 'Teams', color: '#0f766e' },
    { id: 'targets', label: 'Zielländer', color: '#7d8694' },
  ],
  countryGroups: { AUT: 'teams', COL: 'teams', DEU: 'targets' },
  pins: [
    { lat: 48.2082, lng: 16.3738, label: 'Wien', group: 'teams' },
    { lat: 4.7110, lng: -74.0721, label: 'Bogotá', group: 'teams' },
  ],
});

// Headless: map these in any framework
snapshot.dots.map((dot) => /* <circle cx={dot.x} cy={dot.y} /> */);
snapshot.labels;  // anchor, box, connector polyline
snapshot.legend;  // hover a group, highlight those dots
snapshot.matrix;  // 2D 1/0 land vs ocean

<DotMap snapshot={snapshot} />
<Legend items={snapshot.legend} />
```

`createMap` does the expensive geography once. `compute()` is cheap and can change pins, groups, and labels on the fly.

## Marking locations, countries, and continents

Three layers, all optional, and they stack:

```ts
const snapshot = map.compute({
  // 1. Specific places — snapped onto the grid, with labels
  pins: [
    { lat: 48.2082, lng: 16.3738, label: 'Wien', group: 'teams' },
  ],

  // 2. Whole countries (ISO A3)
  countryGroups: { AUT: 'teams', DEU: 'targets' },

  // 3. Whole continents (Natural Earth names or ids like 'europe')
  continentGroups: { europe: 'eu-market', asia: 'apac' },

  groups: [
    { id: 'teams', label: 'Teams', color: '#0f766e' },
    { id: 'targets', label: 'Zielländer', color: '#5c6b7a' },
    { id: 'eu-market', label: 'Europe', color: '#3d6b8c' },
  ],
});
```

Hover or lock a legend item with the React highlight API:

```tsx
<DotMap
  snapshot={snapshot}
  highlight={{ group: 'teams' }}       // or country: 'AUT' / continent: 'europe' / pin: 'vie'
  hoverMode="country"                  // none | dot | country | group | continent
/>
```

`hoverMode` is the interactive counterpart to `highlight`. CSS can scale a single dot; lighting a whole country or group on hover is a data lookup, so the engine maps the hovered cell to a `MapHighlight` and the stylesheet dims everything else.

| `hoverMode` | Pointer on a cell |
| --- | --- |
| `none` | No hover chrome |
| `dot` | Scale / recolor that one cell |
| `country` | Related dots share the same ISO code |
| `group` | Related dots share the pin/country/continent group |
| `continent` | Related dots share the Natural Earth continent |

## Display variables

Import `@dotmap/theme/dotmap.css` (or use `<dot-map>`, which ships the same sheet). Override any of these on `:root`, `.dotmap`, or the host element.

| Variable | Controls | Default (`paper`) |
| --- | --- | --- |
| `--dotmap-bg` | Map background | `transparent` |
| `--dotmap-land` | Unmarked land dots | `#8d8679` |
| `--dotmap-ocean` | Ocean dots when shown | `transparent` |
| `--dotmap-ink` | Legend / chrome text | `#1b1915` |
| `--dotmap-muted` | Secondary chrome | `#6d675c` |
| `--dotmap-font` | Labels and legend | `Manrope, system-ui` |
| `--dotmap-dot-size` | Land-dot radius | `2.15` |
| `--dotmap-pin-size` | Pinned-dot radius | `3.8` |
| `--dotmap-pin-stroke` | Pin halo | `var(--dotmap-label-halo)` |
| `--dotmap-pin-stroke-width` | Pin halo width | `1.6` |
| `--dotmap-label-color` | Label fill | `#1b1915` |
| `--dotmap-label-size` | Label type size | `12px` |
| `--dotmap-label-weight` | Label weight | `650` |
| `--dotmap-label-halo` | Label knockout stroke | `#fffaf1` |
| `--dotmap-connector` | Elbow / line color | `currentColor` |
| `--dotmap-connector-width` | Connector stroke | `1` |
| `--dotmap-connector-opacity` | Connector opacity | `0.7` |
| `--dotmap-filter-dim` | Opacity of unselected dots | `0.2` |
| `--dotmap-hover-scale` | Dot scale on hover | `1.55` |
| `--dotmap-hover-opacity` | Hovered-dot opacity | `1` |
| `--dotmap-hover-fill` | Hovered-dot fill | current dot color |
| `--dotmap-pin-hover-scale` | Pinned-dot hover scale | `1.85` |
| `--dotmap-hover-duration` | Hover transition | `160ms` |
| `--dotmap-enter-duration` | First-paint rise | `520ms` |

Presets set the same tokens in JS:

```ts
import { applyTheme, themeToCssVars } from '@dotmap/theme';

applyTheme(element, 'midnight');
applyTheme(element, { land: '#0f766e', hoverScale: '2' });
```

## Continent view

Crop and fit the map to one continent. Siberia is kept in Asia (Russia is Europe in Natural Earth, so it is added explicitly). Europe is framed to continental Europe so Siberia does not dominate.

```ts
import { continentView, createMap } from '@dotmap/core';

const map = createMap({
  geojson: world,
  ...continentView('europe'),  // africa | asia | europe | north-america | south-america | oceania
  grid: 'diagonal',
});
```

Pins outside that frame are dropped automatically. You can still pass `countries`, `continents`, or `region` yourself if you want a custom crop.

## Grid topologies

| `grid` | Layout |
| --- | --- |
| `square` | Orthogonal rows and columns |
| `diagonal` | Staggered rows (the usual corporate dotted map) |
| `hex` | Same stagger with true hex vertical spacing |

## Playground builder

The playground is also a no-code configuration builder. Its **Locations** panel lets you:

- search a city or address (OpenStreetMap via Photon) and fill its coordinates
- enter latitude and longitude manually when search is not enough
- edit or remove existing pins
- choose a group, custom pin color, and label anchor
- select a location to isolate it on the map
- copy or download the result as JSON, React, or custom-element HTML

Run `npm run dev`, then open `http://localhost:5173`.

## What V1 does not do

No deep zoom, no pan, no street-level tiles. This is a country / continent visualization, not a Mapbox replacement.

## Develop

```bash
npm install
npm test
npm run matrix          # ASCII 1/0 world
npm run dev             # playground at http://localhost:5173
```

World data is Natural Earth 110m, compacted to ISO code, name, and continent.
