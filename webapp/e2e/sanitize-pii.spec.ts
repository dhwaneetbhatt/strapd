import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const cli = fileURLToPath(
  new URL("../../target/release/strapd", import.meta.url),
);
const categories = [
  {
    bit: 1,
    flag: "--ip-addresses",
    input: "[2001:db8::1]:443 2001:0db8::1 192.168.1.1/24",
  },
  {
    bit: 2,
    flag: "--emails",
    input: "alice+tag@EXAMPLE.com alice+tag@example.com bob@example.com",
  },
  {
    bit: 4,
    flag: "--phone-numbers",
    input: "phone=9876543210; +91-98765-43210 ext. 9; +91 98765 43210 x9",
  },
  {
    bit: 8,
    flag: "--payment-cards",
    input:
      "4111111111111111; 4111-1111-1111-1111; card_number=4111111111111112",
  },
  {
    bit: 16,
    flag: "--aadhaar",
    input: "234567890124; 2345 6789 0124; aadhaar=234567890123; XXXX XXXX 0124",
  },
  {
    bit: 32,
    flag: "--pan",
    input: "ABCPD1234E abcpd1234e pan=ABCZD0000E pan_status=ABCZD0000E",
  },
];

test("real WASM equals release CLI for every category, mode, unions, and Unicode", async ({
  page,
}) => {
  await page.goto("/#/");
  const cases = [
    ...categories,
    {
      bit: 63,
      flag: "--all",
      input: categories.map((c) => c.input).join("; "),
    },
  ];
  for (const pseudonymize of [false, true]) {
    const results = await page.evaluate(
      async ({ cases, pseudonymize }) => {
        const { wasmWrapper } = await import("/src/lib/wasm/index.ts");
        return cases.map((c) =>
          wasmWrapper.sanitize_pii(`भारत\r\n${c.input}\n`, c.bit, pseudonymize),
        );
      },
      { cases, pseudonymize },
    );
    for (const [i, c] of cases.entries()) {
      const output = execFileSync(
        cli,
        [
          "sanitize",
          "pii",
          c.flag,
          ...(pseudonymize ? ["-p"] : []),
          `भारत\r\n${c.input}\n`,
        ],
        { encoding: "utf8" },
      ).slice(0, -1);
      expect(results[i]).toEqual({ success: true, result: output });
      expect(output).toContain(pseudonymize ? "_1]" : "[REDACTED_");
    }
  }
});

test("email apostrophes preserve prose suffixes and local parts in real WASM and CLI", async ({
  page,
}) => {
  await page.goto("/#/");
  const cases = [
    {
      input: "alice@example.com's alice@EXAMPLE.com’s o'connor@example.com's",
      mask: "[REDACTED_EMAIL]'s [REDACTED_EMAIL]’s [REDACTED_EMAIL]'s",
      pseudonym: "[EMAIL_1]'s [EMAIL_1]’s [EMAIL_2]'s",
    },
    {
      input: "'alice@example.com'bob@example.com'",
      mask: "'[REDACTED_EMAIL]'[REDACTED_EMAIL]'",
      pseudonym: "'[EMAIL_1]'[EMAIL_2]'",
    },
    {
      input: "alice@missing's alice@example..com's",
      mask: "alice@missing's alice@example..com's",
      pseudonym: "alice@missing's alice@example..com's",
    },
  ];
  for (const pseudonymize of [false, true]) {
    const results = await page.evaluate(
      async ({ cases, pseudonymize }) => {
        const { wasmWrapper } = await import("/src/lib/wasm/index.ts");
        return cases.map((c) =>
          wasmWrapper.sanitize_pii(c.input, 2, pseudonymize),
        );
      },
      { cases, pseudonymize },
    );
    for (const [i, c] of cases.entries()) {
      const expected = pseudonymize ? c.pseudonym : c.mask;
      expect(results[i]).toEqual({ success: true, result: expected });
      expect(
        execFileSync(
          cli,
          [
            "sanitize",
            "pii",
            "--emails",
            ...(pseudonymize ? ["-p"] : []),
            c.input,
          ],
          { encoding: "utf8" },
        ),
      ).toBe(`${expected}\n`);
    }
  }
});

test("discovers PII, supports keyboard/copy/reset, private URLs and both layouts/themes", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#/");
  await page.getByRole("button", { name: "Search tools" }).click();
  await page
    .getByRole("combobox", { name: "Search all tools" })
    .fill("aadhaar");
  await page.getByRole("option", { name: /Sanitize PII/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sanitize PII" }),
  ).toBeVisible();
  await page
    .getByLabel("Input text")
    .fill("aadhaar=234567890123; PAN=ABCPD1234E");
  const output = page.getByLabel("Sanitized result");
  await expect(output).toHaveValue(
    "aadhaar=[REDACTED_AADHAAR]; PAN=[REDACTED_PAN]",
  );
  await page.getByRole("radio", { name: "Pseudonymize" }).focus();
  await page.keyboard.press("Space");
  await expect(output).toHaveValue("aadhaar=[AADHAAR_1]; PAN=[PAN_1]");
  await expect(output).toHaveAttribute("readonly");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("aadhaar=[AADHAAR_1]; PAN=[PAN_1]");
  expect(decodeURIComponent(page.url())).not.toContain("234567890123");
  const all = page.getByRole("checkbox", { name: "All categories" });
  await all.focus();
  await page.keyboard.press("Space");
  await expect(output).toHaveValue("aadhaar=234567890123; PAN=ABCPD1234E");
  await page.keyboard.press("Space");
  await mkdir("/private/tmp/strapd-gh34-screenshots", { recursive: true });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const mode of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== mode)
        await page.getByRole("button", { name: "Toggle color mode" }).click();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: `/private/tmp/strapd-gh34-screenshots/pii-${width}-${mode}.png`,
        fullPage: true,
      });
    }
  }
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Input text")).toHaveValue("");
  await expect(page.getByRole("radio", { name: "Mask" })).toBeChecked();
});

test("saved Aadhaar/PAN pseudonyms compose with downstream Pipes using real WASM", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "strapd-pipes",
      JSON.stringify({
        schemaVersion: 1,
        pipes: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Indian PII",
            createdAt: "2026-10-12T00:00:00.000Z",
            updatedAt: "2026-10-12T00:00:00.000Z",
            steps: [
              {
                id: "44444444-4444-4444-8444-444444444444",
                toolId: "security-sanitize-pii",
                toolVersion: 1,
                config: {
                  mode: "Pseudonymize",
                  ipAddresses: false,
                  emails: false,
                  phoneNumbers: false,
                  paymentCards: false,
                  aadhaar: true,
                  pan: true,
                },
              },
              {
                id: "55555555-5555-4555-8555-555555555555",
                toolId: "string-case-converter",
                toolVersion: 1,
                config: { outputCase: "Lowercase" },
              },
            ],
          },
        ],
      }),
    ),
  );
  await page.goto("/#/pipes");
  await page
    .getByLabel("Pipe input")
    .fill("ABCPD1234E; 234567890124; alice@example.com");
  await page.getByRole("button", { name: "Run pipe" }).click();
  await expect(page.getByLabel("Final pipe output")).toHaveValue(
    "[pan_1]; [aadhaar_1]; alice@example.com",
  );
  const saved = await page.evaluate(() => localStorage.getItem("strapd-pipes"));
  expect(saved).not.toContain("alice@example.com");
  expect(saved).not.toContain("[pan_1]");
});
