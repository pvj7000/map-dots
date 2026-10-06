import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(
    new URL("../packages/toolkit/package.json", import.meta.url),
    "utf8",
  ),
);

assert.notEqual(
  manifest.name,
  "@dotmap/toolkit",
  "Choose a confirmed, controlled npm scope before publishing; @dotmap/toolkit is provisional.",
);
assert.match(manifest.name, /^@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/);
assert.match(manifest.version, /^\d+\.\d+\.\d+-beta\.\d+$/);
assert.equal(manifest.publishConfig?.access, "public");
assert.equal(manifest.publishConfig?.tag, "beta");
console.log(`Beta release identity: ${manifest.name}@${manifest.version}`);
