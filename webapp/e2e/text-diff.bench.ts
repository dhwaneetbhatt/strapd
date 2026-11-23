import { expect, type Locator, type Page, test } from "@playwright/test";
import type { WasmWrapper } from "../src/lib/wasm";

type Scenario =
  | "identical"
  | "localized"
  | "single_line"
  | "scattered_1pct"
  | "divergent";

declare global {
  interface Window {
    textDiffBenchmark: {
      wrapper: WasmWrapper;
      compareInModule: (
        from: string,
        to: string,
        context: number,
        iterations: number,
      ) => number;
    };
    makeDiffBenchInputs: typeof makeInputs;
    diffRenderInputs: ReturnType<typeof makeInputs>;
    diffRenderTimes: number[];
  }
}

// Runs in the page. Keep the deterministic fixtures in sync with the native suite.
function makeInputs({ size, scenario }: { size: number; scenario: Scenario }) {
  if (scenario === "single_line") {
    const item = '{"key":"value","number":12345},';
    const from = `[${item.repeat(Math.ceil((size - 1) / item.length))}{}]`;
    const position = from.indexOf("12345", Math.floor(from.length / 2));
    return {
      from,
      to: `${from.slice(0, position)}54321${from.slice(position + 5)}`,
    };
  }
  const oldLines: string[] = [];
  const newLines: string[] = [];
  let bytes = 0;
  let state = 0x12345678n;
  for (let index = 0; bytes < size; index++) {
    state = BigInt.asUintN(64, state ^ (state << 13n));
    state ^= state >> 7n;
    state = BigInt.asUintN(64, state ^ (state << 17n));
    const id = String(index).padStart(6, "0");
    const hex = state.toString(16).padStart(16, "0");
    const line = `let item_${id} = compute(0x${hex});\n`;
    let changed = line;
    if (scenario === "divergent") {
      const inverse = BigInt.asUintN(64, ~state).toString(16).padStart(16, "0");
      changed = `// unrelated record ${id}: ${inverse} !!!\n`;
    } else if (
      (scenario === "scattered_1pct" && index % 100 === 50) ||
      (scenario === "localized" &&
        bytes <= size / 2 &&
        bytes + line.length > size / 2)
    ) {
      changed = line.replace("compute", "resolve");
    }
    oldLines.push(line);
    newLines.push(changed);
    bytes += line.length;
  }
  return { from: oldLines.join(""), to: newLines.join("") };
}

function median(times: number[]) {
  const ordered = [...times].sort((a, b) => a - b);
  return (
    (ordered[Math.floor((ordered.length - 1) / 2)] +
      ordered[Math.floor(ordered.length / 2)]) /
    2
  );
}

async function fillForRender(input: Locator, side: "from" | "to") {
  await input.evaluate((element: HTMLTextAreaElement, side) => {
    // Use the native setter (not React's value tracker) and dispatch input as
    // the DOM would. This benchmark starts after debounce, not at paste.
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(element, window.diffRenderInputs[side]);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, side);
}

const check = Boolean(process.env.WEBAPP_BENCH_CHECK);
const toolPath = "/#/tool/string-diff";
const scenarios: Scenario[] = [
  "identical",
  "localized",
  "single_line",
  "scattered_1pct",
  "divergent",
];

test("reports browser diff medians (milliseconds)", async ({ page }) => {
  test.skip(check, "Use the production benchmark build for timings.");
  await page.context().addInitScript({
    content: `window.makeDiffBenchInputs = (${makeInputs.toString()});`,
  });
  page.on("pageerror", (error) => console.error(error.message));
  await page.goto(toolPath);
  await expect(page.getByRole("textbox", { name: "Original" })).toBeVisible();

  const table = [];
  for (const size of [1_000_000, 10_000_000]) {
    for (const scenario of scenarios) {
      const times = await page.evaluate(
        ({ size, scenario }) => {
          const { from, to } = window.makeDiffBenchInputs({ size, scenario });
          const { wrapper, compareInModule } = window.textDiffBenchmark;
          const fast =
            scenario !== "divergent" && scenario !== "scattered_1pct";
          const batch = fast ? 20 : 1;
          const runs = fast ? 15 : 7;
          const inModule: number[] = [];
          const endToEnd: number[] = [];
          compareInModule(from, to, 3, batch);
          wrapper.text_diff(from, to, 3);
          for (let i = 0; i < runs; i++) {
            inModule.push(compareInModule(from, to, 3, batch));
            const start = performance.now();
            const result = wrapper.text_diff(from, to, 3);
            endToEnd.push(performance.now() - start);
            if (
              !result.success ||
              !result.diff ||
              (scenario === "localized" &&
                result.diff.hunks[0]?.lines.length !== 8)
            ) {
              throw new Error("Unexpected structured diff result");
            }
          }
          return { inModule, endToEnd };
        },
        { size, scenario },
      );
      table.push({
        size: `${size / 1_000_000} MB`,
        scenario,
        inModule: median(times.inModule).toFixed(3),
        endToEnd: median(times.endToEnd).toFixed(3),
      });
    }
  }
  console.table(table);

  const timedPage = await page.context().newPage();
  await timedPage.goto(toolPath);
  const original = timedPage.getByRole("textbox", { name: "Original" });
  const changed = timedPage.getByRole("textbox", { name: "Changed" });
  const viewer = timedPage.getByRole("region", { name: "Diff" });
  await timedPage.evaluate(() => {
    window.diffRenderInputs = window.makeDiffBenchInputs({
      size: 1_000_000,
      scenario: "localized",
    });
    const { wrapper } = window.textDiffBenchmark;
    const compare = wrapper.text_diff.bind(wrapper);
    let start: number | undefined;
    wrapper.text_diff = (from, to, context) => {
      start =
        from.length >= 1_000_000 && to.includes("resolve")
          ? performance.now()
          : undefined;
      return compare(from, to, context);
    };
    window.diffRenderTimes = [];
    new MutationObserver(() => {
      if (start === undefined) return;
      const row = document.querySelector(".diff-added .diff-emphasis");
      if (
        !row?.textContent?.startsWith("resolve") ||
        !row.getBoundingClientRect().height
      )
        return;
      window.diffRenderTimes.push(performance.now() - start);
      start = undefined;
    }).observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  await fillForRender(original, "from");
  for (let i = 0; i < 11; i++) {
    await fillForRender(changed, "from");
    await expect(timedPage.getByText("No differences")).toBeVisible();
    await fillForRender(changed, "to");
    await expect(viewer.locator(".diff-row")).toHaveCount(8);
  }
  const times = await timedPage.evaluate(() => window.diffRenderTimes);
  expect(times).toHaveLength(11);
  console.info(
    `1 MB localized, processing to rendered layout: median ${median(times.slice(1)).toFixed(3)} ms; first ${times[0].toFixed(3)} ms`,
  );
});

async function paste(page: Page, input: Locator, value: string) {
  await page.evaluate((text) => navigator.clipboard.writeText(text), value);
  await input.focus();
  await page.keyboard.press("ControlOrMeta+V");
}

test("checks desktop, mobile, themes and a large paste in one pass", async ({
  browser,
}) => {
  test.skip(!check, "Run with WEBAPP_BENCH_CHECK=1 and make webapp-dev.");
  for (const [name, viewport] of [
    ["desktop", { width: 1366, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    for (const colorScheme of ["light", "dark"] as const) {
      const context = await browser.newContext({
        viewport,
        colorScheme,
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      await page.goto("http://localhost:5173/#/tool/string-diff");
      const original = page.getByRole("textbox", { name: "Original" });
      const changed = page.getByRole("textbox", { name: "Changed" });
      await expect(original).toBeVisible();
      if (
        (await page.locator("html").getAttribute("data-theme")) !== colorScheme
      ) {
        await page.getByRole("button", { name: "Toggle color mode" }).click();
      }
      await original.fill("[server]\nlet timeout = 30;\nlet retries = 3;\n");
      await changed.fill(
        "[server]\nlet timeout = 60;\nlet retries = 3;\nlet port = 80;",
      );
      const viewer = page.getByRole("region", { name: "Diff" });
      await expect(viewer.getByText("60")).toBeVisible();
      const split = page.getByRole("radio", { name: "Split" });
      if (name === "desktop") {
        const unified = page.getByRole("radio", { name: "Unified" });
        await unified.focus();
        await page.keyboard.press("ArrowRight");
        await expect(split).toBeChecked();
        await expect(viewer.locator(".diff-filler")).toHaveCount(1);
      } else {
        await expect(split).toBeDisabled();
        const originalBox = await original.boundingBox();
        const changedBox = await changed.boundingBox();
        expect(changedBox?.y).toBeGreaterThan(originalBox?.y ?? 0);
      }
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        colorScheme,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({
        path: `../target/text-diff-${name}-${colorScheme}.png`,
        fullPage: true,
      });

      if (name === "desktop" && colorScheme === "light") {
        await page.getByRole("button", { name: "Copy patch" }).click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
          "--- original\n+++ changed\n@@ -1,3 +1,4 @@\n [server]\n-let timeout = 30;\n+let timeout = 60;\n let retries = 3;\n+let port = 80;\n\\ No newline at end of file\n",
        );
        await page
          .getByRole("button", { name: "Swap original and changed" })
          .click();
        await expect(original).toHaveValue(/\nlet port = 80;$/);
        await expect(changed).toHaveValue(/\nlet retries = 3;\n$/);
        await split.press("ArrowLeft");
        await expect(
          page.getByRole("radio", { name: "Unified" }),
        ).toBeChecked();
        await original.fill("");
        await changed.fill("");
        const { from, to } = await page.evaluate(makeInputs, {
          size: 1_000_000,
          scenario: "localized",
        });
        await paste(page, original, from);
        await expect(original).toHaveValue(/^let item_000000 =/);
        await paste(page, changed, to);
        await expect(viewer.getByText("resolve")).toBeVisible();
        await expect(viewer.locator(".diff-hunk")).toHaveCount(1);
        await page.screenshot({
          path: "../target/text-diff-1mb-paste.png",
          fullPage: true,
        });
      }
      await context.close();
    }
  }
});
