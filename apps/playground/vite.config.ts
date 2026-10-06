import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.DOTMAP_BASE_PATH ?? "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        element: path.resolve(__dirname, "element.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@dotmap/core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts",
      ),
      "@dotmap/react": path.resolve(
        __dirname,
        "../../packages/react/src/index.ts",
      ),
      "@dotmap/world": path.resolve(
        __dirname,
        "../../packages/world/src/index.ts",
      ),
      "@dotmap/theme/dotmap.css": path.resolve(
        __dirname,
        "../../packages/theme/src/dotmap.css",
      ),
      "@dotmap/theme": path.resolve(
        __dirname,
        "../../packages/theme/src/index.ts",
      ),
      "@dotmap/element": path.resolve(
        __dirname,
        "../../packages/element/src/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
