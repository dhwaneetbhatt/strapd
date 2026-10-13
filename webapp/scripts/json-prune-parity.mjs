import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const cli = fileURLToPath(
  new URL("../../target/release/strapd", import.meta.url),
);
const cases = [
  {
    name: "cascade",
    input: '{"keep":0,"outer":{"inner":null},"items":["",{},false]}',
    dropKeys: "",
    sampleSize: undefined,
  },
  {
    name: "alternating nesting",
    input: '{"outer":[{"middle":[{"items":[1,2,3,4,5,6,7]}]}],"unused":null}',
    dropKeys: "",
    sampleSize: 3,
  },
  {
    name: "direct nested arrays",
    input: "[[1,2,3,4,5,6,7],[],[10,11,12,13,14,15,16]]",
    dropKeys: "",
    sampleSize: 3,
  },
  {
    name: "escaped key and exact drop",
    input: '{"a/b~c":[1,2,3,4,5,6,7],"debug":{"empty":null},"Debug":1}',
    dropKeys: "debug",
    sampleSize: 3,
  },
  { name: "empty root", input: "[]", dropKeys: "", sampleSize: undefined },
];

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173/#/tool/data-formats-json-prune");

  for (const testCase of cases) {
    const args = ["json", "prune", "--output", "json"];
    if (testCase.dropKeys) args.push("--drop-keys", testCase.dropKeys);
    if (testCase.sampleSize !== undefined) {
      args.push("--sample-size", String(testCase.sampleSize));
    }
    args.push(testCase.input);
    const expected = JSON.parse(execFileSync(cli, args, { encoding: "utf8" }));
    const web = await page.evaluate(async ({ input, dropKeys, sampleSize }) => {
      const { dataFormatsOperations } = await import(
        "/src/lib/utils/data-formats/index.ts"
      );
      return dataFormatsOperations.jsonPrune(input, dropKeys, sampleSize);
    }, testCase);
    assert.equal(web.success, true, testCase.name);
    assert.deepEqual(JSON.parse(web.result), expected.data, testCase.name);
    assert.deepEqual(web.pruned, expected.metadata.pruned, testCase.name);
    assert.deepEqual(web.sampling, expected.metadata.sampling, testCase.name);
    console.log(`${testCase.name}: CLI and WebApp agree`);
  }

  const nested = cases[1];
  const pipe = await page.evaluate(async ({ input, dropKeys, sampleSize }) => {
    const { executePipe } = await import("/src/lib/pipes/executor.ts");
    return executePipe(
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "JSON Prune parity",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            toolId: "data-formats-json-prune",
            toolVersion: 1,
            config: { dropKeys, sample: true, sampleSize },
          },
        ],
      },
      input,
    );
  }, nested);
  const expectedPipeOutput = execFileSync(
    cli,
    ["json", "prune", "--sample-size", "3", nested.input],
    { encoding: "utf8" },
  ).trim();
  assert.deepEqual(pipe, { success: true, output: expectedPipeOutput });
  console.log("Pipe: forwards raw CLI-equivalent JSON");

  const invalid = await page.evaluate(async () => {
    const { dataFormatsOperations } = await import(
      "/src/lib/utils/data-formats/index.ts"
    );
    return dataFormatsOperations.jsonPrune("{", "", undefined);
  });
  assert.equal(invalid.success, false);
  assert.match(invalid.error, /Invalid JSON input/);
  console.log("invalid JSON: WebApp returns an error");
} finally {
  await browser.close();
}
