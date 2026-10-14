import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const cli = fileURLToPath(
  new URL("../../target/release/strapd", import.meta.url),
);
const cases = [
  {
    name: "array filtering",
    input: '{"keep":null,"rows":[null,[],[null,[]],0,false,"",{}]}',
    size: 9,
    seed: "0",
  },
  {
    name: "alternating nesting",
    input:
      '{"outer":[{"middle":{"items":[{"values":[1,2,3,4]},{"values":[5,6,7,8]},{"values":[9,10,11,12]},{"values":[13,14,15,16]}]}}]}',
    size: 2,
    seed: "7",
  },
  {
    name: "direct nested arrays",
    input: "[[1,2,3,4,5],[],[10,11,12,13,14],[20,21,22,23,24]]",
    size: 2,
    seed: "42",
  },
  {
    name: "escaped key",
    input: '{"a/b~c":[1,2,3,4,5,6,7],"debug":{"empty":null}}',
    size: 3,
    seed: "0",
  },
  { name: "empty root", input: "[]", size: 3, seed: "0" },
];

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:5173/#/tool/data-formats-json-sample");

  for (const testCase of cases) {
    const args = [
      "json",
      "sample",
      "--output",
      "json",
      "--size",
      String(testCase.size),
      "--seed",
      testCase.seed,
      testCase.input,
    ];
    const expected = JSON.parse(execFileSync(cli, args, { encoding: "utf8" }));
    const web = await page.evaluate(async ({ input, size, seed }) => {
      const { dataFormatsOperations } = await import(
        "/src/lib/utils/data-formats/index.ts"
      );
      return dataFormatsOperations.jsonSample(input, size, BigInt(seed));
    }, testCase);
    assert.equal(web.success, true, testCase.name);
    assert.deepEqual(JSON.parse(web.result), expected.data, testCase.name);
    assert.deepEqual(web.filtered, expected.metadata.filtered, testCase.name);
    assert.deepEqual(web.sampling, expected.metadata.sampling, testCase.name);
    console.log(`${testCase.name}: CLI and WebApp agree`);
  }

  const nested = cases[1];
  const pipe = await page.evaluate(async ({ input, size, seed }) => {
    const { executePipe } = await import("/src/lib/pipes/executor.ts");
    return executePipe(
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "JSON Sample parity",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            toolId: "data-formats-json-sample",
            toolVersion: 1,
            config: { size, seed },
          },
        ],
      },
      input,
    );
  }, nested);
  const expectedPipeOutput = execFileSync(
    cli,
    ["json", "sample", "--size", "2", "--seed", "7", nested.input],
    { encoding: "utf8" },
  ).trim();
  assert.deepEqual(pipe, { success: true, output: expectedPipeOutput });
  console.log("Pipe: forwards raw CLI-equivalent JSON");

  await page.getByLabel("Entries per array").fill("2");
  await page.getByLabel("Seed").fill("7");
  await page.getByTestId("tool-default-input").fill(nested.input);
  await page.locator('[aria-label="Sampling summary"]').waitFor();
  assert.equal(await page.getByText("Sampled JSON").count(), 1);
  assert.equal(
    await page.getByText("6 array entries omitted by sampling").count(),
    1,
  );
  console.log("WebApp: sampling controls and summary render");

  const invalid = await page.evaluate(async () => {
    const { dataFormatsOperations } = await import(
      "/src/lib/utils/data-formats/index.ts"
    );
    return dataFormatsOperations.jsonSample("{", 3, 0n);
  });
  assert.equal(invalid.success, false);
  assert.match(invalid.error, /Invalid JSON input/);
  console.log("invalid JSON: WebApp returns an error");
} finally {
  await browser.close();
}
