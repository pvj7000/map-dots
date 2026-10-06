# Local release and hosting

## Verify and pack

```sh
npm ci
npm run build:pages
npm test
npm run verify:package
npx playwright install chromium
npm run test:browser
npm run pack:toolkit
```

`verify:package` installs the actual tarball in temporary consumer projects. It checks an engine-only installation without React, public type declarations, and the actual generated React component in a fresh React 18/Vite app. Browser checks exercise JSON import, local restoration, invalid-file handling, clusters, standalone HTML, and assets served under the Pages path.

The resulting `dotmap-toolkit-0.1.0-beta.1.tgz` can be installed with `npm install /path/to/the/file.tgz`. Builds and packed archives are ignored by Git. `npm ci` alone does not produce distributable files; run a build before consuming the workspace toolkit.

## npm publication

`@dotmap/toolkit` is provisional. No ownership of `@dotmap` is assumed. Confirm a controlled scope and settle the public name before publishing. Update the public manifest, generated examples, documentation, root scripts, and verification fixtures together if the identifier changes; internal source workspace names can remain unchanged.

The public package is `packages/toolkit`, version `0.1.0-beta.1`. Other library workspaces are private, preventing accidental publication. Verify the packed tarball after any release change. Both the version and `publishConfig.tag: beta` keep this trial release separate from `latest`. Publishing still requires the correct npm identity and namespace permissions. No credentials or publishing tokens are stored in this repository.

After choosing the controlled package name, a signed-in maintainer can publish the first release from the verified checkout:

```sh
node scripts/check-beta-release.mjs
npm login
npm publish -w ./packages/toolkit --tag beta --access public
```

Confirm the release with `npm view <confirmed-package-name>@beta version`, then install that name with the `@beta` tag in a fresh project. Update the site's Get started section to the confirmed install command after the package is available. The release identity check refuses the provisional namespace.

The manual **Publish npm beta** workflow repeats the production, unit, browser, and packed-consumer checks before publication, using the `beta` tag and package provenance. It runs only from `main`. Configure npm trusted publishing for `pvj7000/map-dots`, workflow `npm-beta.yml`, once the package supports that setup; the workflow uses Node 24 and an OIDC identity. For a first publication that requires a token, configure a publish-capable `NPM_TOKEN` through GitHub's encrypted Actions secrets. Do not paste credentials into chat or commit them. A locally authenticated first publish is also supported by the commands above.

The **Checks** workflow uploads the verified tarball as a `dotmap-beta-<commit>` artifact, so early testers can install a build before npm publication. The artifact is a package archive, not a registry release.

## GitHub Pages

The production URL for the current repository is expected to be `https://pvj7000.github.io/map-dots/` after deployment. `npm run build:pages` builds both HTML entry points, prefixes assets with `/map-dots/`, and includes the standalone `dotmap.js` bundle.

In **Settings → Pages**, select **GitHub Actions** as the source. Commit the implementation and workflow files, then push to `main` or manually run the **GitHub Pages** workflow. The workflow builds and tests the project, uploads `apps/playground/dist`, and deploys through the `github-pages` environment. The separate Checks workflow also validates packed consumers and browser flows on pushes and pull requests.

The deployment job uses `actions/configure-pages` to read the enabled site's configuration. Initial activation requires a repository administrator to select the source in Settings; the default workflow token cannot enable a disabled Pages site.

For a custom domain at its root, build with `npm run build` instead of `build:pages`; the default Vite base is `/`. `DOTMAP_BASE_PATH` can set a different base for development or builds. Deployment requires the repository's Pages setting and workflow/environment permissions. No deployment is performed by local build commands.

## Standalone maps

HTML exported from a hosted customizer references that customizer's bundle URL. Downloaded maps need network access to that URL. For self-contained site hosting, copy `node_modules/@dotmap/toolkit/dist/browser.js` to your assets and point the HTML script tag to your copy. The bundle includes geometry, styles, and component registration; it needs no React, bundler, account, or map API key.

## Developer trials

Use the [five-minute trial guide](beta-testing.md) with three independent developers once the hosted page and package are available. Their first obstacles and time to embed should determine the next release priorities. Feedback is collected through the repository's beta issue form.
