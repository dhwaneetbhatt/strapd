import { describe, expect, it } from "vitest";
import { createUuid, deepCloneJson, isJsonValue, isUuid } from "./utils";

describe("pipe JSON and identity utilities", () => {
  it("creates UUID identities", () => {
    expect(isUuid(createUuid())).toBe(true);
  });

  it("deep-copies JSON-safe values", () => {
    const original = { nested: { values: ["a", 1, true, null] } };
    const copy = deepCloneJson(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.nested).not.toBe(original.nested);
  });

  it("rejects non-JSON and non-finite data", () => {
    expect(isJsonValue({ value: Number.NaN })).toBe(false);
    expect(() => deepCloneJson({ value: undefined })).toThrow("JSON-safe data");
  });
});
