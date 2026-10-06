import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@dotmap/core": path.resolve(
        __dirname,
        "../../packages/core/src/index.ts",
      ),
      "@dotmap/world": path.resolve(
        __dirname,
        "../../packages/world/src/index.ts",
      ),
      "@dotmap/theme": path.resolve(
        __dirname,
        "../../packages/theme/src/index.ts",
      ),
    },
  },
  esbuild: { jsx: "automatic" },
  test: { environment: "node", include: ["test/**/*.test.ts"] },
});
