# DotMap

A headless TypeScript engine for **dotted / matrix world maps**. It turns GeoJSON into a grid of coordinates you can render in React, SVG, Canvas, or anything else.

DotMap returns a structured snapshot: country-aware dots, snapped pins, collision-aware labels, and legend metadata. Use its React component, custom element, or your own renderer.

## Install the development release

The public package is ready to pack but is not yet published. `@dotmap/toolkit` is a provisional identifier; confirm ownership of the final npm scope before publication.

```sh
git clone https://github.com/pvj7000/map-dots.git
cd map-dots
npm ci
npm run pack:toolkit
# In your own website project, install the generated tarball:
npm install /path/to/map-dots/dotmap-toolkit-0.1.0-beta.1.tgz
```

There is one installation with separate imports for core, React, custom elements, themes, and world data. React is an optional peer dependency; engine and plain HTML consumers do not install React.

Successful **Checks** workflow runs also provide a packed beta in their `dotmap-beta-<commit>` artifact. Download and extract it, then install the `.tgz` in your project. For plain HTML, the hosted customizer's HTML export includes the browser bundle URL and needs no npm installation. See the [release instructions](docs/releasing.md) and [developer trial guide](docs/beta-testing.md).

## Recommended stack

| Layer | Package | Why |
| --- | --- | --- |
| Engine | `@dotmap/toolkit/core` | Headless. `createMap` once, `compute()` is cheap. Framework-agnostic. |
| Display tokens | `@dotmap/toolkit/theme` | One CSS file. Every look — color, size, hover — is a `--dotmap-*` variable. |
| Any website | `@dotmap/toolkit/element` | `<dot-map>` custom element. No React required. |
| React / Next | `@dotmap/toolkit/react` | Thin wrapper over the same tokens and hover API. |
| Data | `@dotmap/toolkit/world` | Compact Natural Earth 110m countries. Swap your own GeoJSON anytime. |

Do not bake colors into the engine. Sites override the map by setting CSS variables on the host, a parent, or via the `theme` prop.

```html
<!-- Copy node_modules/@dotmap/toolkit/dist/browser.js to your site assets. -->
<script defer src="./assets/dotmap.js"></script>
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
import { DotMap } from '@dotmap/toolkit/react';
import '@dotmap/toolkit/styles.css';

<DotMap snapshot={snapshot} theme="midnight" hoverMode="group" />
```

## Public entry points

- `@dotmap/toolkit/core` (also the package root) — engine, groups, labels, serialization, preset validation, optional SVG output
- `@dotmap/toolkit/react` — `<DotMap>`, `<Legend>`, `useDotMap`; import `@dotmap/toolkit/styles.css` once
- `@dotmap/toolkit/element` — registers `<dot-map>` in a bundled browser project; styles are included
- `@dotmap/toolkit/theme` — CSS variables and theme helpers
- `@dotmap/toolkit/world` — optional Natural Earth world data
- `@dotmap/toolkit/browser.js` — standalone browser bundle with world data and styles; no bundler required

The original core, React, element, theme, and world workspaces are private implementation packages. `packages/toolkit` builds the public distribution with compiled ESM, bundled public declarations, styles, and license notices. The core entry does not import React, register elements, or include the world dataset.

## The API we wanted

```ts
import { createMap } from '@dotmap/toolkit/core';
import { DotMap, Legend } from '@dotmap/toolkit/react';
import world from '@dotmap/toolkit/world';

const map = createMap({
  geojson: world,
  grid: 'diagonal',          // square | diagonal | hex
  projection: 'robinson',    // mercator, equalEarth, naturalEarth, ...
  width: 1100,
  spacing: 8,
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

Import `@dotmap/toolkit/styles.css` (or use `<dot-map>`, which ships the same sheet). Override any of these on `:root`, `.dotmap`, or the host element.

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
import { applyTheme, themeToCssVars } from '@dotmap/toolkit/theme';

applyTheme(element, 'midnight');
applyTheme(element, { land: '#0f766e', hoverScale: '2' });
```

## Locations sharing a grid cell

Nearby locations can snap to the same dot. All pins and labels remain in the snapshot. React, the custom element, and SVG output show a segmented marker with a location count rather than choosing one pin's color. Each interactive segment has a title, accessible name, and keyboard focus. Hover callbacks expose the selected pin and the full `pins` array for that cell; hovering the shared cell in group mode highlights all of its location groups.

For full preset control, a custom element accepts `map.options` (geometry) and `map.labels` (label layout), alongside its existing pins, groups, and theme properties.

## Continent view

Crop and fit the map to one continent. Siberia is kept in Asia (Russia is Europe in Natural Earth, so it is added explicitly). Europe is framed to continental Europe so Siberia does not dominate.

```ts
import { continentView, createMap } from '@dotmap/toolkit/core';

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

## Product page & map customizer

Run `npm install` and `npm run dev`, then open `http://localhost:5173`. The product page explains where DotMap fits, shows integration examples, and includes a live map customizer.

Start with **Global presence**, **A colorful world**, or **A clean canvas**, then use the three builder steps:

1. **Design** — choose a theme, background and land colors, projection, world/continent view, grid, spacing, dot radius, hover behavior, and group colors.
2. **Locations** — search for places or enter coordinates, edit pins and label anchors, and preview changes on the map.
3. **Export** — copy or download a React component, a standalone custom-element HTML page, or a portable JSON preset. Exports include the same geometry, label settings, and colors used by the preview.

Use **Import JSON preset** to reopen an exported map. Committed settings are automatically saved in this browser; unsaved location previews are excluded. Import validates the preset version, coordinates, map resolution, and display settings before replacing the current map. Invalid files leave your work intact.

HTML exports load the standalone bundle from the customizer URL. For independent hosting, copy `browser.js` to your own assets and change the generated script URL. React exports consume the compiled toolkit and explicitly import its CSS. Public npm publication remains a separate release step.

The **Locations** panel lets you:

- search a city or address (OpenStreetMap via Photon) and fill its coordinates
- enter latitude and longitude manually when search is not enough
- edit or remove existing pins
- choose a group, custom pin color, and label anchor
- select a location to isolate it on the map
- copy or download the result as JSON, React, or custom-element HTML

JSON presets contain `map`, `content`, and `display` objects that map directly to the package APIs:

```tsx
import { createMap, type ComputeInput, type MapOptions } from '@dotmap/toolkit/core';
import { DotMap } from '@dotmap/toolkit/react';
import world from '@dotmap/toolkit/world';
import preset from './dotmap-preset.json';

const map = createMap({ geojson: world, ...preset.map as Omit<MapOptions, 'geojson'> });
const snapshot = map.compute(preset.content as ComputeInput);

// JSON imports widen string unions, so narrow the hover mode for TypeScript.
<DotMap snapshot={snapshot} theme={preset.display.theme}
  hoverMode={preset.display.hoverMode as 'none' | 'dot' | 'country' | 'group' | 'continent'} />;
```

For a typed component without these JSON casts, use the **React** export instead.

## What V1 does not do

No deep zoom, no pan, no street-level tiles. This is a country / continent visualization, not a Mapbox replacement.

## Develop

```bash
npm install
npm run build          # build the distribution and product page
npm test
npm run build:pages    # build under /map-dots/
npm run verify:package # fresh core-only + React/Vite consumers
npm run test:browser   # Playwright; run build:pages and install Chromium first
npm run matrix          # ASCII 1/0 world
npm run dev             # playground at http://localhost:5173
```

World data is Natural Earth 110m, compacted to ISO code, name, and continent. It is public-domain data; attribution and bundled dependency licenses ship in the package.

See [the work packages](docs/implementation-plan.md) and [release/deployment steps](docs/releasing.md).
