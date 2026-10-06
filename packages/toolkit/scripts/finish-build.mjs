import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

await copyFile("../theme/src/dotmap.css", "dist/styles.css");
await copyFile("../../LICENSE", "LICENSE");
const bundled = ["d3-geo", "d3-geo-projection", "d3-array", "internmap"];
const notices = await Promise.all(
  bundled.map(
    async (name) =>
      `${name}\n${await readFile(`../../node_modules/${name}/LICENSE`, "utf8")}`,
  ),
);
await writeFile("dist/THIRD_PARTY_LICENSES.txt", notices.join("\n\n"));
await mkdir("../../apps/playground/public", { recursive: true });
await copyFile("dist/browser.js", "../../apps/playground/public/dotmap.js");
