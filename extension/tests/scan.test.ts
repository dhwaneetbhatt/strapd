import { describe, expect, it } from "vitest";
import {
  aggregatePiiFindings,
  aggregateSecretFindings,
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
  });

  it("reports clean text without findings", () => {
    const engine: WasmScanner = {
      detect_pii: () => new Uint32Array(),
      sanitize_secrets: (input) => input,
      sanitize_pii: (input) => input,
    };

    expect(scanText(engine, "ordinary text")).toEqual({
      ok: true,
      clean: true,
      findings: [],
      scrubbedText: "ordinary text",
    });
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
});
