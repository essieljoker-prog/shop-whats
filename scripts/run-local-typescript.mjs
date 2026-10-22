import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const entries = new Set([
  "db/seed.ts",
  "db/seed-catalog-options.ts",
  "init-admin.ts",
  "reset-admin.ts",
]);
const [entry, ...args] = process.argv.slice(2);
if (!entry || !entries.has(entry)) {
  throw new Error("Select one of the approved local database scripts.");
}

const projectRoot = process.cwd();
const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "smg-pluq-script-"));
const outputPath = path.join(tempDirectory, "script.mjs");

try {
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: outputPath,
    banner: {
      js: `import { createRequire } from "node:module"; import { pathToFileURL } from "node:url"; const require = createRequire(pathToFileURL(${JSON.stringify(path.join(projectRoot, "package.json"))}));`,
    },
  });

  const result = spawnSync(process.execPath, [outputPath, ...args], {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
