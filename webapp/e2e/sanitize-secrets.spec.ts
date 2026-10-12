import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const syntheticInput = "apiKey=synthetic_api_key; password=synthetic_password";
const apiOnlyOutput = "apiKey=[REDACTED_API_KEY]; password=synthetic_password";
const allCategoriesOutput =
  "apiKey=[REDACTED_API_KEY]; password=[REDACTED_PASSWORD]";
const sanitizerCli = fileURLToPath(
  new URL("../../target/release/strapd", import.meta.url),
);

const categoryFixtures = [
  {
    name: "API keys and provider keys",
    mask: 1,
    flags: ["--api-keys"],
    placeholder: "[REDACTED_API_KEY]",
    input:
      "café 🦀 openAIAPIKey=also-short ghp_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNTAIL0123456789 tail 🚀\n",
  },
  {
    name: "quoted curl authorization header",
    mask: 2,
    flags: ["--auth"],
    placeholder: "[REDACTED_AUTH]",
    input:
      "café 🦀 curl -H 'Authorization: Bearer opaque-value' \\\n  -H 'X-Trace: public' tail 🚀\n",
  },
  {
    name: "quoted curl cookie header",
    mask: 4,
    flags: ["--cookies"],
    placeholder: "[REDACTED_COOKIE]",
    input: "café 🦀 curl -H 'Cookie: sid=one; theme=dark' tail 🚀\n",
  },
  {
    name: "libpq and SQL Server semicolon tails",
    mask: 8,
    flags: ["--databases"],
    placeholder: "[REDACTED_DATABASE]",
    input:
      "café 🦀 host=db.example dbname=app user='alice smith' password='p\\'q' sslmode=require\nServer=db.example;Database=app;User Id=alice;Password={p;ass}}word};Encrypt=true tail 🚀\n",
  },
  {
    name: "escaped JWK and private-key block",
    mask: 16,
    flags: ["--crypto-keys"],
    placeholder: "[REDACTED_CRYPTO_KEY]",
    input:
      '{"kty":"R\\u0053A","d":"private-value","n":"public-value"}\n-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----\n尾 🚀\n',
  },
  {
    name: "passwords with quoted UTF-8 values",
    mask: 32,
    flags: ["--passwords"],
    placeholder: "[REDACTED_PASSWORD]",
    input: 'café 🦀 password: "a, b; π\\"c"; passphrase=\'x y\' tail 🚀\n',
  },
  {
    name: "labeled access and refresh tokens",
    mask: 64,
    flags: ["--tokens"],
    placeholder: "[REDACTED_TOKEN]",
    input:
      'before café access_token=tok; refresh-token: "two words"; after 🧑🏽‍💻\n',
  },
  {
    name: "AWS signed URL",
    mask: 128,
    flags: ["--signed-urls"],
    placeholder: "[REDACTED_SIGNED_URL]",
    input:
      "https://s3.example/object?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=scope&X-Amz-Signature=signature&expires=30#section-1 café 🚀\n",
  },
] as const;

const combinedGrammarInput = categoryFixtures
  .map(({ input }) => input)
  .join("");

const stripCliFinalNewline = (stdout: string): string => {
  if (!stdout.endsWith("\n")) {
    throw new Error(
      "sanitize secrets CLI output did not end with its final newline",
    );
  }
  return stdout.slice(0, -1);
};

const runNativeSanitizer = (input: string, flags: readonly string[]) =>
  stripCliFinalNewline(
    execFileSync(sanitizerCli, ["sanitize", "secrets", ...flags, input], {
      encoding: "utf8",
    }),
  );

const expectNoHorizontalOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
};

const openSanitizerFromSearch = async (page: Page) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#/");
  await page.getByRole("button", { name: "Search tools" }).click();
  const search = page.getByRole("combobox", { name: "Search all tools" });
  await search.fill("sanitize secrets");
  await page.getByRole("option", { name: /Sanitize Secrets/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sanitize Secrets" }),
  ).toBeVisible();
};

const activateCheckbox = async (page: Page, name: string) => {
  await page
    .getByRole("checkbox", { name })
    .evaluate((element) => (element as HTMLInputElement).click());
};

test("discovers sanitizer in Security and applies all, selected, and no categories", async ({
  page,
}) => {
  await openSanitizerFromSearch(page);
  await expect(page.getByRole("group", { name: "Categories" })).toBeVisible();
  await page.getByLabel("Input text").fill(syntheticInput);
  const output = page.getByLabel("Sanitized result");
  await expect(output).toHaveValue(allCategoriesOutput);
  const cliOutput = runNativeSanitizer(syntheticInput, ["--all"]);
  expect(await output.inputValue()).toBe(cliOutput);

  await activateCheckbox(page, "Passwords");
  await expect(page.getByLabel("Sanitized result")).toHaveValue(apiOnlyOutput);
  await activateCheckbox(page, "API keys");
  await expect(page.getByLabel("Sanitized result")).toHaveValue(syntheticInput);

  await activateCheckbox(page, "All categories");
  await expect(page.getByLabel("Sanitized result")).toHaveValue(
    allCategoriesOutput,
  );
});

test("matches native CLI for every sanitizer category and supported mask", async ({
  page,
}) => {
  await page.goto("/#/");
  const unionInput =
    "apiKey=xy; password=short; access_token=tok; Authorization: Bearer opaque; Cookie: sid=secret; café 🦀\n";
  const cases = [
    ...categoryFixtures.map(({ name, input, mask }) => ({ name, input, mask })),
    { name: "all categories", input: combinedGrammarInput, mask: 255 },
    { name: "no categories", input: combinedGrammarInput, mask: 0 },
    {
      name: "API keys, passwords, and tokens union",
      input: unionInput,
      mask: 97,
    },
  ];
  const wasmResults = await page.evaluate(async (sanitizerCases) => {
    const { wasmWrapper } = await import("/src/lib/wasm/index.ts");
    return sanitizerCases.map(({ input, mask }) => {
      const result = wasmWrapper.sanitize_secrets(input, mask);
      if (!result.success) throw new Error(result.error);
      return result.result;
    });
  }, cases);

  for (const [index, fixture] of categoryFixtures.entries()) {
    expect(wasmResults[index], fixture.name).toBe(
      runNativeSanitizer(fixture.input, fixture.flags),
    );
    expect(wasmResults[index], fixture.name).toContain(fixture.placeholder);
  }

  const allIndex = categoryFixtures.length;
  const allNative = runNativeSanitizer(combinedGrammarInput, ["--all"]);
  expect(wasmResults[allIndex], "all categories").toBe(allNative);
  for (const { placeholder } of categoryFixtures) {
    expect(wasmResults[allIndex]).toContain(placeholder);
  }

  const noneIndex = allIndex + 1;
  expect(
    wasmResults[noneIndex],
    "no categories preserves the complete UTF-8 input",
  ).toBe(combinedGrammarInput);

  const unionIndex = noneIndex + 1;
  expect(wasmResults[unionIndex], "selected category union").toBe(
    runNativeSanitizer(unionInput, ["--api-keys", "--passwords", "--tokens"]),
  );
  expect(wasmResults[unionIndex]).toContain("Authorization: Bearer opaque");
  expect(wasmResults[unionIndex]).toContain("Cookie: sid=secret");
});

test("keeps typed input out of URL state while categories synchronize", async ({
  page,
}) => {
  await page.goto("/#/tool/security-sanitize-secrets");
  const input = page.getByLabel("Input text");
  await input.fill(syntheticInput);
  await activateCheckbox(page, "API keys");

  await expect(input).toHaveValue(syntheticInput);
  await expect
    .poll(() => page.evaluate(() => location.hash))
    .toContain("apiKeys=false");
  expect(
    decodeURIComponent(await page.evaluate(() => location.hash)),
  ).not.toContain("synthetic_api_key");

  // Hydrating another category from URL must preserve the text already typed.
  await page.evaluate(() => {
    location.hash =
      "#/tool/security-sanitize-secrets?apiKeys=false&passwords=false";
  });
  await expect(input).toHaveValue(syntheticInput);
  await expect(
    page.getByRole("checkbox", { name: "Passwords" }),
  ).not.toBeChecked();
});

test("supports keyboard use, read-only output, accessible copy, reset, and both color modes", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/tool/security-sanitize-secrets");
  await page.getByLabel("Input text").fill(syntheticInput);
  const output = page.getByLabel("Sanitized result");
  await expect(output).toHaveAttribute("readonly");

  const apiKeys = page.getByRole("checkbox", { name: "API keys" });
  await apiKeys.focus();
  await page.keyboard.press("Space");
  await expect(output).toHaveValue(
    "apiKey=synthetic_api_key; password=[REDACTED_PASSWORD]",
  );
  await page.keyboard.press("Space");
  await expect(output).toHaveValue(allCategoriesOutput);

  await page.getByRole("button", { name: "Copy" }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(allCategoriesOutput);

  for (const mode of ["dark", "light"] as const) {
    await page.getByRole("button", { name: "Toggle color mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
    await expectNoHorizontalOverflow(page);
  }

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Input text")).toHaveValue("");
  await expect(
    page.getByRole("checkbox", { name: "All categories" }),
  ).toBeChecked();
});

test("runs the API-only frozen sanitizer step through Pipes using real WASM", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "strapd-pipes",
      JSON.stringify({
        schemaVersion: 1,
        pipes: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Sanitize synthetic fixture",
            createdAt: "2026-10-12T00:00:00.000Z",
            updatedAt: "2026-10-12T00:00:00.000Z",
            steps: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                toolId: "security-sanitize-secrets",
                toolVersion: 1,
                config: {
                  apiKeys: true,
                  auth: false,
                  cookies: false,
                  databases: false,
                  cryptoKeys: false,
                  passwords: false,
                  tokens: false,
                  signedUrls: false,
                },
              },
            ],
          },
        ],
      }),
    );
  });
  await page.goto("/#/pipes");
  await page.getByLabel("Pipe input").fill(syntheticInput);
  await page.getByRole("button", { name: "Run pipe" }).click();
  await expect(page.getByLabel("Final pipe output")).toHaveValue(apiOnlyOutput);
});

test("renders without horizontal overflow at desktop and 375px and captures review screenshots", async ({
  page,
}) => {
  const screenshots = "/private/tmp/strapd-gh33-screenshots";
  await mkdir(screenshots, { recursive: true });
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 375, height: 812 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/#/tool/security-sanitize-secrets");
    if (name === "mobile") {
      const navigation = page.getByRole("navigation", {
        name: "Developer tools navigation",
      });
      if ((await navigation.getAttribute("aria-expanded")) === "true") {
        await page.getByRole("button", { name: "Close navigation" }).click();
      }
      await expect(navigation).toHaveAttribute("aria-expanded", "false");
      await expect
        .poll(() =>
          navigation.evaluate(
            (element) => element.getBoundingClientRect().width,
          ),
        )
        .toBeLessThanOrEqual(1);

      const layout = await page.evaluate(() => {
        const box = (element: Element | null) => {
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            x: rect.x,
            right: rect.right,
            width: rect.width,
            position: style.position,
            overflowX: style.overflowX,
          };
        };
        const navigation = document.querySelector(
          '[aria-label="Developer tools navigation"]',
        );
        const title = [
          ...document.querySelectorAll('[role="heading"], h1, h2, h3, h4'),
        ].find((element) => element.textContent?.includes("Sanitize Secrets"));
        const input = document.querySelector(
          '[data-testid="tool-default-input"]',
        );
        const fieldset = document.querySelector("fieldset");
        const tool = document.querySelector('[data-scroll-mode="page"]');
        return {
          viewportWidth: innerWidth,
          rootFontSize: getComputedStyle(document.documentElement).fontSize,
          mdMediaMatches: matchMedia("(min-width: 48em)").matches,
          navigationExpanded: navigation?.getAttribute("aria-expanded"),
          navigation: box(navigation),
          navigationParent: box(navigation?.parentElement ?? null),
          tool: box(tool),
          heading: box(title ?? null),
          categories: box(fieldset),
          input: box(input),
        };
      });
      console.log(`375px sanitizer layout: ${JSON.stringify(layout)}`);
      expect(
        layout.navigation?.width,
        JSON.stringify(layout),
      ).toBeLessThanOrEqual(1);
      for (const [name, item] of Object.entries({
        heading: layout.heading,
        categories: layout.categories,
        input: layout.input,
      })) {
        expect(
          item?.x,
          `${name} overlaps navigation: ${JSON.stringify(layout)}`,
        ).toBeGreaterThanOrEqual(layout.navigation?.right ?? 0);
        expect(
          item?.x,
          `${name} falls outside tool content: ${JSON.stringify(layout)}`,
        ).toBeGreaterThanOrEqual(layout.tool?.x ?? 0);
        expect(
          item?.x,
          `${name} clipped: ${JSON.stringify(layout)}`,
        ).toBeGreaterThanOrEqual(0);
        expect(
          item?.right,
          `${name} exceeds viewport: ${JSON.stringify(layout)}`,
        ).toBeLessThanOrEqual(layout.viewportWidth);
        expect(
          item?.right,
          `${name} exceeds tool content: ${JSON.stringify(layout)}`,
        ).toBeLessThanOrEqual(layout.tool?.right ?? layout.viewportWidth);
      }
    }
    await page.getByLabel("Input text").fill(syntheticInput);
    await expect(page.getByLabel("Sanitized result")).toHaveValue(
      allCategoriesOutput,
    );
    await expectNoHorizontalOverflow(page);

    const inputBounds = await page.getByLabel("Input text").boundingBox();
    const outputBounds = await page
      .getByLabel("Sanitized result")
      .boundingBox();
    const privacyHintBounds = await page
      .getByText(
        "Input stays in this browser and is excluded from shareable URLs.",
      )
      .boundingBox();
    expect(inputBounds).not.toBeNull();
    expect(outputBounds).not.toBeNull();
    expect(privacyHintBounds).not.toBeNull();
    expect(privacyHintBounds?.y).toBeGreaterThanOrEqual(
      Math.max(
        (inputBounds?.y ?? 0) + (inputBounds?.height ?? 0),
        (outputBounds?.y ?? 0) + (outputBounds?.height ?? 0),
      ),
    );

    await page.screenshot({
      path: path.join(screenshots, `sanitize-secrets-${name}.png`),
      fullPage: true,
    });
  }
});
