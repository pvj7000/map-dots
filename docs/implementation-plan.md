# Productization work packages

Implemented and verified on 2026-10-05.

## 1. Installable distribution
- [x] Ship one package with core, React, custom-element, theme, and world-data entry points.
- [x] Build JavaScript, public declarations, CSS, and a standalone browser bundle.
- [x] Include package documentation, license, and data attribution.
- [x] Make generated examples consume the distribution.
- [x] Install the packed tarball in fresh React and plain-browser consumers.

## 2. Reusable presets
- [x] Define a versioned, validated preset format shared by preview and exports.
- [x] Import JSON presets and restore geometry, content, and display settings.
- [x] Autosave committed work locally and recover it after refresh.
- [x] Show useful errors for invalid files or unavailable storage.
- [x] Verify export/import round trips and browser restoration.

## 3. GitHub Pages
- [x] Support the repository URL base and a production site build.
- [x] Add CI checks and an explicit Pages deployment workflow.
- [x] Verify served assets and browser behavior under `/map-dots/`.
- [x] Document the repository setting and deployment steps.

## 4. Nearby location pins
- [x] Preserve all pins when multiple locations snap to one cell.
- [x] Use consistent cluster rendering and inspection in React and custom elements.
- [x] Keep labels, highlighting, and generated output consistent.
- [x] Cover shared-cell locations in renderer and browser verification.

Public package publication requires a controlled npm scope. `@dotmap/toolkit` is a provisional identifier, not a claim of namespace ownership. Deployment and publication are separate from local implementation and verification.

## Verification

- Production distribution and Pages build passed.
- 40 unit tests and 4 browser flows passed.
- The packed tarball passed fresh core-only installation without React, strict type checking, a React 18/Vite build, and server rendering of the generated React component.
- Standalone HTML matched the preview's geometry, labels, colors, clustered pins, and keyboard behavior under the Pages path.
- Local draft recovery, invalid imports, unavailable storage, and mobile layout passed browser checks.

## External release steps

- [ ] Confirm a controlled npm scope and the final package identifier, then publish the verified package.
- [ ] Commit/push the workflows and select GitHub Actions in the repository's Pages settings to activate hosting.
- [x] Prepare version `0.1.0-beta.1`, a manual npm publication workflow, and downloadable CI package artifacts.
- [x] Add a five-minute developer trial guide and structured beta feedback form.
- [ ] Complete three independent developer trials and record the results.

See [release instructions](releasing.md).
