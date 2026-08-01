import { describe, expect, it, vi } from "vitest";
import type { PipeJsonObject, PipeToolContract } from "../../types";
import { executePipe, type PipeExecutableTool } from "./executor";
import type { Pipe } from "./types";

const ids = {
  pipe: "11111111-1111-4111-8111-111111111111",
  one: "22222222-2222-4222-8222-222222222222",
  two: "33333333-3333-4333-8333-333333333333",
  three: "44444444-4444-4444-8444-444444444444",
};

const contract = (
  input: PipeToolContract["input"],
  outputKey = "result",
): PipeToolContract => ({
  version: 1,
  input,
  output: { key: outputKey },
  config: [],
  defaults: {},
  validateConfig: () => ({ valid: true }),
});

const pipe = (steps: Pipe["steps"]): Pipe => ({
  id: ids.pipe,
  name: "Test pipe",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  steps,
});

const resolver = (tools: PipeExecutableTool[]) => (toolId: string) =>
  tools.find(({ id }) => id === toolId);

describe("executePipe", () => {
  it("injects a non-text runtime key without mutating frozen configuration", async () => {
    const config: PipeJsonObject = { suffix: "!" };
    const operation = vi.fn((inputs: Record<string, unknown>) => ({
      success: true,
      result: `${String(inputs.value)}${String(inputs.suffix)}`,
    }));
    const testPipe = pipe([
      {
        id: ids.one,
        toolId: "append",
        toolVersion: 1,
        config,
      },
    ]);

    await expect(
      executePipe(
        testPipe,
        "hello",
        resolver([
          {
            id: "append",
            name: "Append",
            pipe: contract({ kind: "transform", key: "value" }),
            operation,
          },
        ]),
      ),
    ).resolves.toEqual({ success: true, output: "hello!" });
    expect(operation).toHaveBeenCalledWith({ value: "hello", suffix: "!" });
    expect(testPipe.steps[0].config).toEqual({ suffix: "!" });
  });

  it("supports generator-led pipes and awaits mixed operations strictly in order", async () => {
    const events: string[] = [];
    const tools: PipeExecutableTool[] = [
      {
        id: "source",
        name: "Source",
        pipe: contract({ kind: "source" }),
        operation: () => {
          events.push("source");
          return { success: true, result: "seed" };
        },
      },
      {
        id: "async",
        name: "Async",
        pipe: contract({ kind: "transform", key: "text" }),
        operation: async ({ text }) => {
          await Promise.resolve();
          events.push(`async:${String(text)}`);
          return { success: true, result: `${String(text)}-async` };
        },
      },
      {
        id: "last",
        name: "Last",
        pipe: contract({ kind: "transform", key: "input" }, "canonical"),
        operation: ({ input }) => {
          events.push(`last:${String(input)}`);
          return { success: true, canonical: `${String(input)}-last` };
        },
      },
    ];

    const result = await executePipe(
      pipe([
        { id: ids.one, toolId: "source", toolVersion: 1, config: {} },
        { id: ids.two, toolId: "async", toolVersion: 1, config: {} },
        { id: ids.three, toolId: "last", toolVersion: 1, config: {} },
      ]),
      undefined,
      resolver(tools),
    );

    expect(result).toEqual({ success: true, output: "seed-async-last" });
    expect(events).toEqual(["source", "async:seed", "last:seed-async"]);
  });

  it("stops at the first unsuccessful step and returns no stale output", async () => {
    const later = vi.fn(() => ({ success: true, result: "stale" }));
    const result = await executePipe(
      pipe([
        { id: ids.one, toolId: "fail", toolVersion: 1, config: {} },
        { id: ids.two, toolId: "later", toolVersion: 1, config: {} },
      ]),
      "input",
      resolver([
        {
          id: "fail",
          name: "Fail",
          pipe: contract({ kind: "transform", key: "text" }),
          operation: () => ({ success: false, error: "bad input" }),
        },
        {
          id: "later",
          name: "Later",
          pipe: contract({ kind: "transform", key: "text" }),
          operation: later,
        },
      ]),
    );

    expect(result).toEqual({
      success: false,
      failure: {
        code: "operation-failed",
        message: "bad input",
        stepId: ids.one,
        stepIndex: 0,
        toolId: "fail",
      },
    });
    expect("output" in result).toBe(false);
    expect(later).not.toHaveBeenCalled();
  });

  it("preserves successful output that legitimately begins with Error", async () => {
    const result = await executePipe(
      pipe([{ id: ids.one, toolId: "literal", toolVersion: 1, config: {} }]),
      "input",
      resolver([
        {
          id: "literal",
          name: "Literal",
          pipe: contract({ kind: "transform", key: "text" }),
          operation: () => ({
            success: true,
            result: "Error: legitimate data",
          }),
        },
      ]),
    );

    expect(result).toEqual({ success: true, output: "Error: legitimate data" });
  });

  it.each([
    {
      name: "thrown errors",
      tool: {
        id: "bad",
        name: "Bad",
        pipe: contract({ kind: "transform", key: "text" }),
        operation: () => {
          throw new Error("boom");
        },
      },
      code: "operation-threw",
    },
    {
      name: "missing canonical outputs",
      tool: {
        id: "bad",
        name: "Bad",
        pipe: contract({ kind: "transform", key: "text" }, "canonical"),
        operation: () => ({ success: true, result: "wrong key" }),
      },
      code: "missing-output",
    },
    {
      name: "non-string canonical outputs",
      tool: {
        id: "bad",
        name: "Bad",
        pipe: contract({ kind: "transform", key: "text" }),
        operation: () => ({ success: true, result: 42 }),
      },
      code: "non-string-output",
    },
  ])("attributes $name to the failed step", async ({ tool, code }) => {
    const result = await executePipe(
      pipe([{ id: ids.one, toolId: "bad", toolVersion: 1, config: {} }]),
      "input",
      resolver([tool as PipeExecutableTool]),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.failure).toMatchObject({
        code,
        stepId: ids.one,
        stepIndex: 0,
        toolId: "bad",
      });
    }
  });

  it("reports missing tools, incompatible versions, and missing input", async () => {
    const testPipe = pipe([
      { id: ids.one, toolId: "transform", toolVersion: 1, config: {} },
    ]);
    const tool: PipeExecutableTool = {
      id: "transform",
      name: "Transform",
      pipe: contract({ kind: "transform", key: "text" }),
      operation: () => ({ success: true, result: "ok" }),
    };

    await expect(
      executePipe(testPipe, "input", resolver([])),
    ).resolves.toMatchObject({
      success: false,
      failure: { code: "tool-unavailable", stepIndex: 0 },
    });
    await expect(
      executePipe(testPipe, undefined, resolver([tool])),
    ).resolves.toMatchObject({
      success: false,
      failure: { code: "input-required", stepIndex: 0 },
    });
    await expect(
      executePipe(
        pipe([{ ...testPipe.steps[0], toolVersion: 2 }]),
        "input",
        resolver([tool]),
      ),
    ).resolves.toMatchObject({
      success: false,
      failure: { code: "unsupported-tool-version", stepIndex: 0 },
    });
  });
});
