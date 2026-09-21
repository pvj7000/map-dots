import { createMap, formatMatrix } from "../packages/core/src/index.ts";
import { world } from "../packages/world/src/index.ts";

const rows = Number(process.argv.find((arg) => arg.startsWith("--rows="))?.slice(7) ?? 36);
const grid = (process.argv.find((arg) => arg.startsWith("--grid="))?.slice(7) ?? "square") as
  | "square"
  | "diagonal"
  | "hex";

const height = rows;
const spacing = 1;
const map = createMap({
  geojson: world,
  width: Math.round(height * 2.05),
  height,
  spacing,
  padding: 0,
  grid,
  projection: "equirectangular",
});

const art = formatMatrix(map.matrix, { land: "#", ocean: " " });
const land = map.matrix.flat().filter(Boolean).length;
const total = map.matrix.flat().length;

process.stdout.write(`${art}\n\n`);
process.stdout.write(
  `${map.matrix.length}×${map.matrix[0]?.length ?? 0} ${grid} matrix · ${land}/${total} land cells\n`,
);
