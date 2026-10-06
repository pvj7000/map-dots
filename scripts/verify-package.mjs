import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const repository = process.cwd();
const root = await mkdtemp(path.join(os.tmpdir(), "dotmap-consumers-"));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (command, args, cwd = repository) =>
  execFileSync(command, args, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    maxBuffer: 10_000_000,
  });
try {
  const [packed] = JSON.parse(
    run(npm, [
      "pack",
      "--ignore-scripts",
      "--json",
      "-w",
      "@dotmap/toolkit",
      "--pack-destination",
      root,
    ]),
  );
  const names = packed.files.map((file) => file.path);
  for (const file of [
    "dist/core.js",
    "dist/core.d.ts",
    "dist/react.js",
    "dist/react.d.ts",
    "dist/element.js",
    "dist/browser.js",
    "dist/styles.css",
    "LICENSE",
    "NOTICE.md",
    "dist/THIRD_PARTY_LICENSES.txt",
  ])
    assert(names.includes(file), `Package lacks ${file}`);
  assert(
    !names.some((name) => name.startsWith("src/")),
    "Source workspace leaked into the package",
  );
  const tarball = path.join(root, packed.filename);
  const core = path.join(root, "core-only"),
    react = path.join(root, "react-consumer");
  for (const directory of [core, react]) {
    await mkdir(directory);
    await writeFile(
      path.join(directory, "package.json"),
      '{"private":true,"type":"module"}',
    );
  }
  run(
    npm,
    ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
    core,
  );
  await assert.rejects(
    access(path.join(core, "node_modules/react")),
    "Core-only installation pulled in React",
  );
  await writeFile(
    path.join(core, "verify.mjs"),
    `import assert from 'node:assert/strict';
import { createMap, parsePreset, clusterPins, renderSVG } from '@dotmap/toolkit/core';
import world from '@dotmap/toolkit/world';
import { PRESETS } from '@dotmap/toolkit/theme';
const snapshot = createMap({ geojson: world, spacing: 12 }).compute({ pins: [
  { id: 'a', lat: 48.21, lng: 16.37, label: 'One', color: '#00aabb' },
  { id: 'b', lat: 48.21, lng: 16.37, label: 'Two', color: '#cc2244' }] });
assert.equal(clusterPins(snapshot.pins)[0].pins.length, 2);
assert(renderSVG(snapshot).includes('data-pin-count="2"'));
assert.equal(PRESETS.paper.land, '#8d8679');
assert.equal(parsePreset({ version: 1, map: {}, content: {}, display: {} }).version, 1);
assert.equal(typeof globalThis.document, 'undefined');`,
  );
  run(process.execPath, ["verify.mjs"], core);
  run(
    npm,
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarball,
      "react@18.3.1",
      "react-dom@18.3.1",
      "@types/react@18",
      "@types/react-dom@18",
      "typescript@5.9.3",
      "vite@6.3.5",
    ],
    react,
  );
  run(path.join(repository, "node_modules/.bin/tsx"), [
    "scripts/create-consumer-fixtures.ts",
    react,
  ]);
  await writeFile(
    path.join(react, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
      },
      include: ["*.tsx", "*.ts"],
    }),
  );
  await writeFile(
    path.join(react, "main.tsx"),
    `import { createRoot } from 'react-dom/client'; import CustomMap from './CustomMap'; createRoot(document.getElementById('root')!).render(<CustomMap />);`,
  );
  await writeFile(
    path.join(react, "index.html"),
    '<div id="root"></div><script type="module" src="./main.tsx"></script>',
  );
  await writeFile(
    path.join(react, "core-types.ts"),
    `import { createMap, parsePreset } from '@dotmap/toolkit'; import { DotMapElement } from '@dotmap/toolkit/element'; import world from '@dotmap/toolkit/world'; const map = createMap({ geojson: world }); const preset = parsePreset({ version: 1, map: {}, content: {}, display: {} }); let element: DotMapElement; void map; void preset;`,
  );
  run(path.join(react, "node_modules/.bin/tsc"), ["--noEmit"], react);
  run(path.join(react, "node_modules/.bin/vite"), ["build"], react);
  await writeFile(
    path.join(react, "verify-react.mjs"),
    `import assert from 'node:assert/strict';
import { build } from 'esbuild'; import { createElement } from 'react'; import { renderToStaticMarkup } from 'react-dom/server';
await build({ entryPoints: ['CustomMap.tsx'], outfile: 'ssr-map.mjs', bundle: true, platform: 'node', format: 'esm', external: ['react', 'react/jsx-runtime'], loader: { '.css': 'empty' } });
const { default: CustomMap } = await import('./ssr-map.mjs');
const html = renderToStaticMarkup(createElement(CustomMap));
assert(html.includes('data-pin-count="2"')); assert(html.includes('Vienna Lab')); assert(html.includes('fill="#00aabb"'));`,
  );
  run(process.execPath, ["verify-react.mjs"], react);
  const source = await readFile(path.join(react, "CustomMap.tsx"), "utf8");
  assert(source.includes("@dotmap/toolkit/styles.css"));
  console.log(
    `Packed distribution verified: core without React, strict public declarations, generated React/Vite example, and standalone HTML/bundle.\nConsumer fixtures: ${root}`,
  );
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
}
