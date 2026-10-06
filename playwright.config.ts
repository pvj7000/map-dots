import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173/map-dots/",
    headless: true,
    launchOptions: {
      executablePath: process.env.DOTMAP_CHROMIUM_PATH,
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command:
      "npm run preview -w @dotmap/playground -- --host 127.0.0.1 --port 4173 --base=/map-dots/",
    url: "http://127.0.0.1:4173/map-dots/",
    reuseExistingServer: !process.env.CI,
  },
});
