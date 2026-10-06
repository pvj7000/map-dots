# Brand and distribution research

Checked: 2026-10-05. Intended launch markets: US, EU, and UK.

## Recommendation

Current direction: retain **DotMap as the working name**, reflecting the user's preference for a short, simple, descriptive name. The alternative shortlist below was not selected. Public brand clearance remains unresolved: there are close exact-name uses in map components and mapping products, and the unscoped npm package `dotmap` is occupied. These findings do not establish that this project infringes a particular trademark, but they also do not support calling the name available or safe to adopt publicly.

No dominant exact-name framework was identified in the research. That is a limited search finding, not a market-share conclusion. The closest exact-name React package belongs to a small repository and has an old published release; it still overlaps with the core purpose. Keeping DotMap provisionally is a product decision, while public release under the name needs an assessment of the existing uses and US/EU/UK rights. A different npm scope or an added descriptor can clarify installation and positioning; neither establishes trademark clearance.

Publish the library on the public npm registry. Keep the website/customizer on GitHub Pages. For developer adoption, favor one public package with integration subpaths and a browser bundle; the existing internal workspace structure can remain modular.

## What is already using the name?

| Existing use | Verified facts | Relevance to this project |
| --- | --- | --- |
| [`@datalith/dotmap`](https://www.npmjs.com/package/@datalith/dotmap) | React SVG mapping components including `DotMap`, `DotMapUs`, and `DotMapWorld`; accepts GeoJSON, projections, coordinates, and styling. Registry version checked: 0.12.1, first published in 2019. | Very close developer audience and product category; the strongest practical confusion concern. |
| [DotMap map builder](https://dotmapapp.com/create-map) | A browser map builder offering markers, lines, zones, CSV/JSON input, sharing, and website embeds. | Exact brand used for another map creation product, overlapping with the customizer's purpose. |
| [`dotmap` on npm](https://registry.npmjs.org/dotmap) | An existing dot-notation accessor package, version 0.1.0, published in 2013. | The exact unscoped package name is occupied. Its age does not make the name available for registration by someone else. |
| [Dotmap at dotmap.co](https://www.dotmap.co/) | A floor-plan photo documentation product using location markers and exports. | Exact brand used by another spatial software product. The domain is in use. |
| [Dotmap at dotmap.app](https://dotmap.app/) | The retrieved page title identifies a service for finding nearby professionals; its privacy page also uses DotMap branding. | Additional exact-name web use. Functionality was not independently tested. |
| [DotMap on PyPI](https://pypi.org/project/dotmap/) | An established Python dictionary utility with dot-access syntax. | A different function, but another developer package with the same name; additional search/discovery noise. |
| [Dot Map QGIS plugin](https://plugins.qgis.org/plugins/DotMap/) | A GIS plugin listed in the official QGIS plugin directory. | Another map-software use, including the spaced version of the name. |
| [Dotmap font family](https://www.myfonts.com/collections/dotmap-font-type-associates/) | Its commercial listing explicitly identifies Dotmap as a trademark of Type Associates; MyFonts debut is listed as January 2010. | An asserted trademark in a different product category. The listing does not establish a particular US/EU/UK registration, current registration status, or infringement by this project. |

There are also nearby competing names: [`dotted-map`](https://github.com/NTag/dotted-map) generates dotted/hexagonal geographic maps and supplies SVG output, raw points, and precomputation; [`react-dotted-map`](https://github.com/jackall3n/react-dotted-map) is a React dotted-map component. A small variation such as adding “React,” “JS,” or a hyphen would still need a separate similarity check.

The product's clearest positioning is its visual customizer, portable presets, location/label controls, and integration adapters. A useful descriptor for a new brand is “Custom dotted maps for the web.”

## Closest overlap and visible activity

Rechecked on 2026-10-05 in response to the preference to retain DotMap.

| Project | Functional overlap | Visible scale / activity | Interpretation |
| --- | --- | --- | --- |
| [`@datalith/dotmap`](https://github.com/lucafalasco/datalith/tree/master/packages/datalith-dotmap) | React SVG map components with coordinates, projections, grid size, colors, and tooltips; includes world and US adapters. | Latest public npm release: 0.12.1 on 2021-04-09. The [entire Datalith repository](https://github.com/lucafalasco/datalith) has 30 stars and 4 forks; GitHub reports its last push in June 2024. These are repository-wide figures, not DotMap package usage. | A close functional and exact-name overlap, with limited visible activity. Its docs do not establish an equivalent hosted preset customizer. Age and low visibility do not establish abandonment of naming rights. |
| [Vaadin DotMap](https://vaadin.com/directory/component/dotmap) | A dotted world-map component with latitude/longitude highlights and customizable map imagery. | Documentation refers to Vaadin 7 and links source code on Google Code. Current adoption and maintenance were not established. | Another exact-name component serving a similar basic display purpose, in a different development ecosystem. |
| [DotMap at dotmapapp.com](https://dotmapapp.com/create-map) | Browser map creation and website embedding, with event markers, media, shapes, and timelines. | A functioning product website and published guides were retrieved. No reliable customer-count or market-share figures were found. | A different rendering/product focus, but related mapping services under the exact name. |
| [`dotted-map`](https://github.com/NTag/dotted-map) | SVG dotted maps, location pins, colors, regions, projections, and JSON precomputation. | 239 stars and 36 forks; latest npm release 3.1.0 on 2026-02-25. GitHub reports a push in April 2026. | Direct functional competition under a similar, different name. The customizer and integration experience can differentiate this project, but the rendering purpose is already served by another library. |

GitHub metadata was read through the public repository API. npm release dates were read from the public registry. Weekly-download requests were blocked, so no download totals or market-share estimates are asserted. Stars and release dates are limited visibility/activity signals, not proof of commercial scale or legal rights.

The test “no major competitor doing exactly the same thing” is not enough to establish brand clearance. The [USPTO's likelihood-of-confusion guidance](https://www.uspto.gov/trademarks/search/likelihood-confusion) explains that related goods/services and similar marks can matter; identical features are not required. This is a general screening principle, not a finding about any particular DotMap owner's enforceable rights. US/EU/UK records remain unverified as described below.

If DotMap remains the public choice after clearance, use a package such as `@your-scope/dotmap` under a controlled npm scope, and position the page as **“DotMap — custom dotted maps for the web.”** This is an illustrative package identifier, not a published package or a checked namespace.

## Trademark status: not cleared

This screen establishes existing public uses and naming overlap. It does **not** establish that DotMap is legally available or that any particular use is infringement.

- The [USPTO search portal](https://tmsearch.uspto.gov/) returned a JavaScript application without inspectable search results through the research tool.
- [TMview](https://www.tmdn.org/tmview/) likewise returned no inspectable result records.
- The [UK IPO word search](https://trademarks.ipo.gov.uk/ipo-tmtext) returned HTTP 403 through the research tool.
- Indexed searches for exact and spaced names did not yield a verified registration record suitable for a clearance conclusion. This is **not** evidence that there are no relevant registrations.

An actual clearance search must examine exact and similar marks, owners, territories, status, priority dates, and the goods/services covered, as well as unregistered use. The USPTO explicitly includes [common-law use in a comprehensive search](https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks); an empty federal search alone would not settle US availability. EUIPO's [availability guidance](https://www.euipo.europa.eu/en/trade-marks/before-applying/availability) and the [UK search guidance](https://www.gov.uk/search-for-trademark) likewise call for checking similar names.

For a shortlisted replacement, begin with downloadable software and online software services: [Nice Class 9](https://www.wipo.int/classifications/nice/nclpub/en/fr/?class_number=9) and [Nice Class 42](https://www.wipo.int/classifications/nice/nclpub/en/fr/?class_number=42). Related goods/services can cross class boundaries; classes are not a guarantee of separation. A trademark professional can complete and interpret the US/EU/UK clearance before investment in a name.

Do not equate any of the following:

- an unused npm package identifier;
- ownership of an npm scope;
- an available domain;
- permission to use a product brand;
- eligibility to register a trademark.

No claim is made about availability of `dotmap.com`, any untested domain, or any replacement brand.

## Earlier replacement-name shortlist (not selected)

Screened on 2026-10-05. These are candidate names, not cleared trademarks or reserved namespaces.

| Rank | Candidate | Why it fits | Tradeoff |
| --- | --- | --- | --- |
| 1 | **SpeckAtlas** | “Speck” suggests dots; “atlas” makes the mapping purpose clear. Easy to read, say, and use as a package name. | A playful tone; the two component words are common, so similar marks still need review. |
| 2 | **TerraStipple** | Combines earth/geography with stippling, the technique of drawing with dots. Fits a visual design tool. | Longer, and some developers may not know “stipple.” |
| 3 | **Puncterra** | A coined name inspired by *punctum* (point) and *terra* (earth). Suitable for a distinct product identity. | Its purpose and pronunciation are less obvious; use a descriptor alongside it. |

The user prefers retaining DotMap rather than these alternatives. This table records the earlier screen, not the current product direction.

Checks completed:

- Exact-name public web searches found no indexed matches for `SpeckAtlas`, `TerraStipple`, or `Puncterra`. Additional searches included `Speck Atlas`, `Terra Stipple`, hyphenated forms, and `Punctera`, plus GitHub-focused and software/trademark queries. These searches do not cover every similar spelling, pronunciation, unindexed product, or unregistered use.
- GitHub repository searches returned no matching repositories for `speckatlas`, `terrastipple`, or `puncterra`. This describes the search response, not a guarantee that no matching code or private project exists.
- Direct npm registry requests returned HTTP 404 for [`speckatlas`](https://registry.npmjs.org/speckatlas), [`speck-atlas`](https://registry.npmjs.org/speck-atlas), [`terrastipple`](https://registry.npmjs.org/terrastipple), [`terra-stipple`](https://registry.npmjs.org/terra-stipple), and [`puncterra`](https://registry.npmjs.org/puncterra). No public package record was returned; npm can impose additional naming restrictions, so these identifiers are not confirmed registrable or reserved for this project.
- `.com` and `.dev` RDAP registration checks were attempted for all three candidates. The web tool could not access the `.com` registry endpoints, and direct network requests to the registry endpoints were blocked. **Domain registration status is unverified.**
- US/EU/UK trademark result records remain unverified for these candidates. The register-access limitations and clearance requirements above still apply; empty indexed searches cannot establish legal availability.

Several alternatives were excluded because searches already showed exact-name uses: [PointWeave](https://zvict.github.io/pointweave/) is a 3D/AI research project, [Pointloom](https://alteregomykonos.com/product/clays-midi-dress/) is used for a fashion brand, and [MapPollen](https://recette.namr.com/biodiversity-open-data-environmental-protection/) has been used for a geographic allergy application.

No replacement name has been selected, registered, published, or applied to the repository.

## npm namespace checks

Direct public registry requests returned existing records for `dotmap` and `@datalith/dotmap`. Requests for all five current workspace package names returned HTTP 404:

- [`@dotmap/core`](https://registry.npmjs.org/@dotmap%2Fcore)
- [`@dotmap/react`](https://registry.npmjs.org/@dotmap%2Freact)
- [`@dotmap/element`](https://registry.npmjs.org/@dotmap%2Felement)
- [`@dotmap/theme`](https://registry.npmjs.org/@dotmap%2Ftheme)
- [`@dotmap/world`](https://registry.npmjs.org/@dotmap%2Fworld)

A 404 means no public package record was returned. It does **not** establish that the `@dotmap` user/organization scope is available, that we control it, or that private packages do not exist. npm scopes belong to the corresponding user or organization; see [npm's scope documentation](https://docs.npmjs.com/about-scopes/).

## How developers should get the product

| Audience | Recommended experience |
| --- | --- |
| Trying the customizer | Open the GitHub Pages website; no installation or npm account. Download a preset or integration example. |
| React, Next.js, Vite, and other JavaScript projects | Install a public npm package locally using npm, pnpm, or Yarn. Import the relevant integration and use the exported preset/code. |
| Plain HTML / CMS integrations | Load a compiled standalone custom-element bundle with a script tag, from a versioned CDN URL or a self-hosted copy. |
| Advanced developers | Import the engine separately from the React adapter and world dataset; render the snapshot themselves. |

One public package with subpaths keeps the first installation simple. Illustrative names only; this package does not exist:

```sh
npm install @your-scope/mapkit
# Equivalent package managers:
pnpm add @your-scope/mapkit
yarn add @your-scope/mapkit
```

Suggested public entry points, also proposals rather than existing APIs:

```ts
import { DotMap } from '@your-scope/mapkit/react';
import '@your-scope/mapkit/element';
import { createMap } from '@your-scope/mapkit/core';
import world from '@your-scope/mapkit/world';
```

Consumers select their integration rather than importing all of these together. React stays a peer dependency for the React adapter. The engine and custom element should remain usable without React. Keep browser entry points independent so importing the core does not execute custom-element registration or require a DOM.

Public packages can be installed without a registry login. npm, pnpm, and Yarn can all consume the same npm registry package. A [jsDelivr npm URL](https://www.jsdelivr.com/documentation#id-npm) can serve the explicitly built browser bundle after publication. Use a pinned version in documented production script examples.

The browser bundle matters: a bare import such as `import '@dotmap/element'` does not resolve in a plain HTML page without a bundler or an appropriately configured import map. Serving the existing TypeScript source from a CDN would not solve this.

## Release readiness of this repository

**Implementation update:** the original source workspaces are now private. `packages/toolkit` builds a single public distribution with JavaScript, generated declarations, CSS, a standalone browser bundle, package documentation, license text, and dependency/data notices. Packed-consumer and browser verification passed; see [the completed work packages](implementation-plan.md) and [release instructions](releasing.md). No public npm publication or Pages deployment has occurred. The original audit below records the state before these changes.

Ran `npm pack --dry-run --json` for the five library workspaces. Every package currently includes source `.ts` or `.tsx` files and no compiled `.js` files. Their `main`, `types`, and `exports` entries point to `src/index.ts`. Some packages contain declaration **shims**, but they do not contain generated declarations for their public entry points. The package inventories also omit package-level README and LICENSE files.

The website's production build is successful, but building the website does not produce distributable library artifacts.

Before publishing:

1. Choose and clear a distinctive brand, and confirm control of its npm namespace.
2. Produce compiled JavaScript and generated public type declarations. Publish explicit entry points for the core, React, custom element, optional world data, and CSS. ESM is a sensible default; provide other formats only where supported consumer requirements justify them.
3. Build a standalone browser bundle for the script-tag installation route.
4. Include README, license text, and required data/third-party notices in the actual published package; correctly declare dependencies needed by emitted code and declarations.
5. Install the packed tarball in fresh consumer projects. Check React/Vite, a plain-browser example, and core-only use independently of workspace aliases and hoisted dependencies.
6. Make the customizer exports and setup examples use the actual published name and entry points.
7. Publish the package publicly under the controlled scope and automate later releases. npm supports [scoped public publishing](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) and [trusted publishing from GitHub Actions](https://docs.npmjs.com/trusted-publishers/).

No npm package was published, no namespace/domain was registered, and no project rename was made as part of this research.
