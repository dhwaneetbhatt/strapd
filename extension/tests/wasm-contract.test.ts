import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ALL_PII_CATEGORIES,
  ALL_SECRET_CATEGORIES,
  aggregatePiiFindings,
  aggregateSecretFindings,
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
