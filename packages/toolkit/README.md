# DotMap

Custom dotted maps for the web, with location labels, country and continent groups, and interactive highlights.

This package is not yet published. `@dotmap/toolkit` is the provisional package identifier; confirm a controlled scope before publication. For now, run `npm run pack:toolkit` in the repository and install the resulting tarball:

```sh
npm install ./dotmap-toolkit-0.1.0-beta.1.tgz
```

## React

```tsx
import { DotMap } from '@dotmap/toolkit/react';
import world from '@dotmap/toolkit/world';
import '@dotmap/toolkit/styles.css';

export function OfficeMap() {
  return <DotMap geojson={world} projection="robinson"
    pins={[{ lat: 48.21, lng: 16.37, label: 'Vienna' }]} />;
}
```

React 18 or later is required only for the React integration. Install the usual React TypeScript types when using TypeScript.

## Plain HTML

Copy `dist/browser.js` from the installed package to your site's assets. The standalone bundle includes the default world data, styles, and custom-element registration, and needs no bundler or React.

```html
<script defer src="./assets/dotmap.js"></script>
<dot-map projection="robinson" theme="paper"
  pins='[{"lat":48.21,"lng":16.37,"label":"Vienna"}]'></dot-map>
```

In a bundled project, import `@dotmap/toolkit/element` instead. The custom element includes its styles in its shadow root.

## Engine and data

```ts
import { createMap, renderSVG } from '@dotmap/toolkit/core';
import world from '@dotmap/toolkit/world';

const map = createMap({ geojson: world, projection: 'robinson' });
const snapshot = map.compute({ pins: [{ lat: 48.21, lng: 16.37, label: 'Vienna' }] });
const svg = renderSVG(snapshot);
```

Core and theme imports do not register a custom element or require a browser. World data is a separate entry point. See the repository README for presets, labels, highlighting, and custom geometry.
