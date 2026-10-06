import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/core.ts",
      core: "src/core.ts",
      react: "src/react.ts",
      element: "src/element.ts",
      theme: "src/theme.ts",
      world: "src/world.ts",
    },
    format: ["esm"],
    target: "es2022",
    splitting: true,
    clean: false,
    dts: { resolve: ["@dotmap/core", "@dotmap/theme", "@dotmap/world"] },
    external: ["react", "react/jsx-runtime", "@types/geojson"],
    noExternal: [/^@dotmap\//, /^d3-/],
    sourcemap: true,
  },
  {
    entry: { browser: "src/element.ts" },
    format: ["iife"],
    target: "es2022",
    outExtension: () => ({ js: ".js" }),
    globalName: "DotMapToolkit",
    minify: true,
    splitting: false,
    clean: false,
    noExternal: [/.*/],
    sourcemap: true,
  },
]);
