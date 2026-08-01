import { describe, expect, it } from "vitest";
import { TOOL_REGISTRY } from "../../tools";
import {
  FIRST_STEP_ID,
  validCollectionFixture,
  validDocumentFixture,
  validPipeFixture,
  validSourcePipeFixture,
} from "./__fixtures__/pipe-fixtures";
import {
  isPipeCollection,
  isPipeDocument,
  validatePipe,
  validatePipeCollection,
  validatePipeDocument,
  validatePipeDocumentStructure,
} from "./validation";

describe("pipe validation", () => {
  it("accepts valid input-driven and generator-led fixtures", () => {
    expect(validatePipe(validPipeFixture(), TOOL_REGISTRY)).toEqual({
      valid: true,
      runnable: true,
      issues: [],
    });
    expect(validatePipe(validSourcePipeFixture(), TOOL_REGISTRY).valid).toBe(
      true,
    );
    expect(isPipeDocument(validDocumentFixture())).toBe(true);
    expect(isPipeCollection(validCollectionFixture())).toBe(true);
  });

  it("rejects invalid source topology and frozen configuration", () => {
    const invalid = validPipeFixture();
    invalid.steps[1] = {
      ...invalid.steps[1],
      toolId: "identifier-ulid-generator",
      config: { count: 0, text: "runtime values are not configuration" },
    };

    const result = validatePipe(invalid, TOOL_REGISTRY);
    expect(result.valid).toBe(false);
    expect(result.runnable).toBe(false);
    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["source-position", "invalid-config"]),
    );
  });

  it("rejects duplicate step and pipe identities", () => {
    const duplicateSteps = validPipeFixture();
    duplicateSteps.steps[1].id = FIRST_STEP_ID;
    expect(
      validatePipe(duplicateSteps, TOOL_REGISTRY).issues.map(
        ({ code }) => code,
      ),
    ).toContain("duplicate-step-id");

    const duplicatePipes = validCollectionFixture();
    duplicatePipes.pipes.push({ ...validPipeFixture() });
    expect(
      validatePipeCollection(duplicatePipes, TOOL_REGISTRY).issues.map(
        ({ code }) => code,
      ),
    ).toContain("duplicate-pipe-id");
  });

  it("preserves unavailable and unsupported tools as non-runnable", () => {
    const unavailable = validPipeFixture();
    unavailable.steps[0].toolId = "missing-tool";
    const unavailableResult = validatePipe(unavailable, TOOL_REGISTRY);
    expect(unavailableResult.valid).toBe(true);
    expect(unavailableResult.runnable).toBe(false);
    expect(unavailableResult.issues[0]).toMatchObject({
      code: "tool-unavailable",
      severity: "compatibility",
      stepIndex: 0,
    });

    const unsupported = validPipeFixture();
    unsupported.steps[0].toolVersion = 99;
    const unsupportedResult = validatePipe(unsupported, TOOL_REGISTRY);
    expect(unsupportedResult.valid).toBe(true);
    expect(unsupportedResult.runnable).toBe(false);
    expect(unsupportedResult.issues[0]?.code).toBe("unsupported-tool-version");
  });

  it("rejects unsupported document schema versions", () => {
    const document = {
      ...validDocumentFixture(),
      schemaVersion: 99,
    };
    expect(
      validatePipeDocumentStructure(document).issues.map(({ code }) => code),
    ).toContain("unsupported-schema-version");
    expect(validatePipeDocument(document, TOOL_REGISTRY).valid).toBe(false);
  });
});
