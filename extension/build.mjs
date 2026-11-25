import { copyFile, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "dist");

const shared = {
  bundle: true,
  platform: "browser",
  target: "chrome120",
  sourcemap: true,
  logLevel: "info",
};

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all([
  build({
    ...shared,
    entryPoints: [join(root, "src/background.ts")],
    outfile: join(dist, "background.js"),
    format: "esm",
  }),
  build({
    ...shared,
    entryPoints: [join(root, "src/content.ts")],
    outfile: join(dist, "content.js"),
    format: "iife",
  }),
  build({
    ...shared,
    entryPoints: [join(root, "src/popup.ts")],
    outfile: join(dist, "popup.js"),
    format: "iife",
  }),
  build({
    ...shared,
    entryPoints: [join(root, "src/test-harness.ts")],
    outfile: join(dist, "test.js"),
    format: "esm",
  }),
]);

await Promise.all([
  copyFile(join(root, "manifest.json"), join(dist, "manifest.json")),
  copyFile(join(root, "src/popup.html"), join(dist, "popup.html")),
  copyFile(join(root, "test.html"), join(dist, "test.html")),
  copyFile(join(root, "wasm/strapd_wasm_bg.wasm"), join(dist, "strapd_wasm_bg.wasm")),
]);
