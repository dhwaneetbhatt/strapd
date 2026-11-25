import { describe, expect, it } from "vitest";
import { buildDiffSegments } from "../src/diff";
import {
  aggregatePiiFindings,
  aggregateSecretFindings,
  detectorBits,
  scanText,
  type WasmScanner,
} from "../src/scan";

describe("aggregatePiiFindings", () => {
  it("counts packed category triples in category order", () => {
    const triples = new Uint32Array([
      2, 0, 5,
      2, 10, 15,
      1, 20, 25,
    ]);

    expect(aggregatePiiFindings(triples)).toEqual([
      { kind: "IP address", count: 1 },
      { kind: "Email", count: 2 },
    ]);
  });

  it("ignores a trailing incomplete triple", () => {
    expect(aggregatePiiFindings(new Uint32Array([2, 0]))).toEqual([]);
  });
});

describe("aggregateSecretFindings", () => {
  it("counts only placeholders added by sanitization", () => {
    const original = "token=[REDACTED_TOKEN] key=AKIAIOSFODNN7EXAMPLE";
    const scrubbed = "token=[REDACTED_TOKEN] key=[REDACTED_API_KEY]";

    expect(aggregateSecretFindings(original, scrubbed)).toEqual([
      { kind: "API key", count: 1 },
    ]);
  });
});

describe("detectorBits", () => {
  it("maps all four chips onto the existing WASM categories", () => {
    expect(detectorBits({ apiKey: true, jwt: true, email: true, ip: true })).toEqual({
      secrets: 255,
      pii: 63,
    });
  });

  it("maps only enabled chips", () => {
    expect(
      detectorBits({ apiKey: true, jwt: false, email: false, ip: true }),
    ).toEqual({ secrets: 191, pii: 1 });
    expect(
      detectorBits({ apiKey: false, jwt: false, email: false, ip: false }),
    ).toEqual({ secrets: 0, pii: 0 });
  });
});

describe("buildDiffSegments", () => {
  it("returns no segments for unchanged text", () => {
    expect(buildDiffSegments("hello", "hello")).toEqual([]);
  });

  it("pairs raw values with their redaction tags", () => {
    const segments = buildDiffSegments(
      "key=ABC email=a@b.com",
      "key=[REDACTED_API_KEY] email=[REDACTED_EMAIL]",
    );

    expect(segments.map(({ raw, tag }) => ({ raw, tag }))).toEqual([
      { raw: "ABC", tag: "[REDACTED_API_KEY]" },
      { raw: "a@b.com", tag: "[REDACTED_EMAIL]" },
    ]);
  });
});

describe("scanText", () => {
  it("combines secret and PII findings with scrubbed text", () => {
    const engine: WasmScanner = {
      detect_pii: () => new Uint32Array([2, 0, 5, 2, 6, 11]),
      sanitize_secrets: (input) =>
        input.replace("AKIAIOSFODNN7EXAMPLE", "[REDACTED_API_KEY]"),
      sanitize_pii: (input) => input.replaceAll("a@b.com", "[REDACTED_EMAIL]"),
    };

    const response = scanText(engine, "a@b.com AKIAIOSFODNN7EXAMPLE");

    expect(response.ok).toBe(true);
    expect(response.clean).toBe(false);
    expect(response.findings).toEqual([
      { kind: "API key", count: 1 },
      { kind: "Email", count: 2 },
    ]);
    expect(response.scrubbedText).toBe("[REDACTED_EMAIL] [REDACTED_API_KEY]");
    expect(response.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("reports clean text without findings", () => {
    const engine: WasmScanner = {
      detect_pii: () => new Uint32Array(),
      sanitize_secrets: (input) => input,
      sanitize_pii: (input) => input,
    };

    const response = scanText(engine, "ordinary text");

    expect(response).toMatchObject({
      ok: true,
      clean: true,
      findings: [],
      scrubbedText: "ordinary text",
    });
    expect(response.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it("does not report clean when text changed without a known finding", () => {
    const engine: WasmScanner = {
      detect_pii: () => new Uint32Array(),
      sanitize_secrets: (input) => input.replace("secret", "[REDACTED_UNKNOWN]"),
      sanitize_pii: (input) => input,
    };

    const response = scanText(engine, "secret");

    expect(response.clean).toBe(false);
    expect(response.findings).toEqual([]);
    expect(response.scrubbedText).toBe("[REDACTED_UNKNOWN]");
  });

  it("forwards detector flags to the WASM category arguments", () => {
    const secretBits: number[] = [];
    const piiBits: number[] = [];
    const engine: WasmScanner = {
      detect_pii: (_input, categories) => {
        piiBits.push(categories);
        return new Uint32Array();
      },
      sanitize_secrets: (input, categories) => {
        secretBits.push(categories);
        return input;
      },
      sanitize_pii: (input, categories) => {
        piiBits.push(categories);
        return input;
      },
    };

    scanText(engine, "text", { apiKey: true, jwt: false, email: false, ip: true });

    expect(secretBits).toEqual([191]);
    expect(piiBits).toEqual([1, 1]);
  });
});
