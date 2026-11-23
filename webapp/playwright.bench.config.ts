import { defineConfig, devices } from "@playwright/test";

const check = Boolean(process.env.WEBAPP_BENCH_CHECK);
const url = check ? "http://localhost:5173" : "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "text-diff.bench.ts",
  outputDir: check
    ? "../target/webapp-check-results"
    : "../target/webapp-bench-results",
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: url,
    serviceWorkers: "block",
  },
  webServer: check
    ? undefined
    : {
        command:
          "pnpm preview --mode benchmark --outDir ../target/webapp-bench-dist --host 127.0.0.1 --port 4174 --strictPort",
        url,
      },
});
