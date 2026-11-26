import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_PII_CATEGORIES,
  ALL_SECRET_CATEGORIES,
  aggregatePiiFindings,
  aggregateSecretFindings,
  scanText,
} from "../src/scan";

const wasmPath = join(process.cwd(), "wasm", "strapd_wasm_bg.wasm");
const wasmBuilt = existsSync(wasmPath);

type WasmModule = typeof import("../wasm/strapd_wasm.js");

describe.skipIf(!wasmBuilt)("WASM contract", () => {
  let wasm: WasmModule;

  beforeAll(async () => {
    wasm = await import("../wasm/strapd_wasm.js");
    await wasm.default({ module_or_path: await readFile(wasmPath) });
  });

  it("uses the API key placeholder that the scanner counts", () => {
    const original = "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE";
    const scrubbed = wasm.sanitize_secrets(original, ALL_SECRET_CATEGORIES);

    expect(scrubbed).toBe("AWS_ACCESS_KEY_ID=[REDACTED_API_KEY]");
    expect(aggregateSecretFindings(original, scrubbed)).toEqual([
      { kind: "API key", count: 1 },
    ]);
  });

  it("leaves a bearer JWT unchanged when JWT detection is off", () => {
    const text =
      "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTg0MiJ9.dBjftJeZ4CVP";
    const response = scanText(wasm, text, {
      apiKey: true,
      jwt: false,
      email: true,
      ip: true,
    });

    expect(response.scrubbedText).toBe(text);
    expect(response.findings).toEqual([]);
  });

  it("counts a consumed placeholder alongside a fresh API key", () => {
    const response = scanText(
      wasm,
      "password=[REDACTED_PASSWORD]fresh AKIAIOSFODNN7EXAMPLE",
      { apiKey: true, jwt: false, email: false, ip: false },
    );

    expect(response.scrubbedText).toContain("[REDACTED_API_KEY]");
    expect(response.findings).toEqual([
      { kind: "API key", count: 1 },
      { kind: "Secret", count: 1 },
    ]);
  });

  it("uses the email category bit that the scanner maps", () => {
    const triples = wasm.detect_pii(
      "Contact dev@example.com",
      ALL_PII_CATEGORIES,
    );

    expect(triples[0]).toBe(2);
    expect(aggregatePiiFindings(triples)).toEqual([
      { kind: "Email", count: 1 },
    ]);
  });

  it("uses the email placeholder that the warning preview shows", () => {
    expect(
      wasm.sanitize_pii(
        "Contact dev@example.com",
        ALL_PII_CATEGORIES,
        false,
      ),
    ).toBe("Contact [REDACTED_EMAIL]");
  });
});

const metadataPath = join(process.cwd(), "src", "generated-meta.ts");
const manifestPath = join(process.cwd(), "manifest.json");

describe.skipIf(!wasmBuilt || !existsSync(metadataPath))("generated metadata", () => {
  it("matches the built WASM digest and CSP directive", async () => {
    const wasmBytes = await readFile(wasmPath);
    const digest = createHash("sha256").update(wasmBytes).digest("hex");
    const metadata = await import("../src/generated-meta");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      content_security_policy: { extension_pages: string };
    };
    const directive = manifest.content_security_policy.extension_pages
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("connect-src"));

    expect(metadata.WASM_SHA256).toBe(digest);
    expect(metadata.CSP_CONNECT_SRC).toBe(directive);
    expect(directive).toBe("connect-src 'none'");
  });
});
