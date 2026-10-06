import { writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { exportSource } from "../apps/playground/src/export-source";
import { fixturePreset } from "../tests/fixtures/preset";

async function main() {
  const destination = process.argv[2];
  await writeFile(
    path.join(destination, "CustomMap.tsx"),
    exportSource("react", fixturePreset),
  );
  await writeFile(
    path.join(destination, "standalone.html"),
    exportSource("html", fixturePreset),
  );
  await writeFile(
    path.join(destination, "preset.json"),
    JSON.stringify(fixturePreset),
  );
  await mkdir(path.join(destination, "public"), { recursive: true });
  await copyFile(
    "packages/toolkit/dist/browser.js",
    path.join(destination, "public/dotmap.js"),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
