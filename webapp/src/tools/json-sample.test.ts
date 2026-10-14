import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmMocks = vi.hoisted(() => ({
  jsonSample: vi.fn(),
  jsonMinify: vi.fn(),
}));

vi.mock("../lib/wasm", () => ({
  wasmWrapper: {
    json_sample: wasmMocks.jsonSample,
    json_minify: wasmMocks.jsonMinify,
  },
}));

import { executePipe } from "../lib/pipes/executor";
import { getPipeToolById, getPipeTransformTools } from "./index";

const ids = {
  pipe: "11111111-1111-4111-8111-111111111111",
  sample: "22222222-2222-4222-8222-222222222222",
  minify: "33333333-3333-4333-8333-333333333333",
};

describe("JSON Sample tool and Pipes contract", () => {
  beforeEach(() => {
    wasmMocks.jsonSample.mockReset();
    wasmMocks.jsonMinify.mockReset();
  });

  it("exposes a versioned transform with validated defaults", () => {
    const tool = getPipeToolById("data-formats-json-sample");
    expect(tool).toBeDefined();
    expect(getPipeTransformTools().map(({ id }) => id)).toContain(tool?.id);
    expect(tool?.pipe?.version).toBe(1);
    expect(tool?.pipe?.input).toEqual({ kind: "transform", key: "text" });
    expect(tool?.pipe?.defaults).toEqual({ size: 3, seed: "0" });
    expect(tool?.pipe?.validateConfig({ size: 0, seed: "0" }).valid).toBe(
      false,
    );
    expect(tool?.pipe?.validateConfig({ size: 1.5, seed: "0" }).valid).toBe(
      false,
    );
    expect(
      tool?.pipe?.validateConfig({ size: 3, seed: "0", output: "json" }).valid,
    ).toBe(false);
    expect(tool?.operation({ text: "[]", size: 3, seed: "-1" })).toMatchObject({
      success: false,
    });
  });

  it("passes only raw JSON to the next Pipe step", async () => {
    const input = '{"items":[null,1,2,3,4,5],"unused":null}';
    wasmMocks.jsonSample.mockReturnValue({
      success: true,
      result: '{"items":[1,3,5],"unused":null}',
      filtered: { nulls: 1, emptyArrays: 0 },
      sampling: { omittedTotal: 2, arrays: [{ path: "/items", omitted: 2 }] },
    });
    wasmMocks.jsonMinify.mockReturnValue({
      success: true,
      result: '{"items":[1,3,5],"unused":null}',
    });

    const result = await executePipe(
      {
        id: ids.pipe,
        name: "Sample then minify",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: ids.sample,
            toolId: "data-formats-json-sample",
            toolVersion: 1,
            config: { size: 3, seed: "0" },
          },
          {
            id: ids.minify,
            toolId: "data-formats-json",
            toolVersion: 1,
            config: { sort: false, minify: true, indentSize: 2 },
          },
        ],
      },
      input,
    );

    expect(result).toEqual({
      success: true,
      output: '{"items":[1,3,5],"unused":null}',
    });
    expect(wasmMocks.jsonSample).toHaveBeenCalledWith(input, 3, 0n);
    expect(wasmMocks.jsonMinify).toHaveBeenCalledWith(
      '{"items":[1,3,5],"unused":null}',
      false,
    );
  });

  it("stops on invalid JSON without forwarding a result", async () => {
    wasmMocks.jsonSample.mockReturnValue({
      success: false,
      error: "Invalid JSON input",
    });
    const result = await executePipe(
      {
        id: ids.pipe,
        name: "Sample",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: ids.sample,
            toolId: "data-formats-json-sample",
            toolVersion: 1,
            config: { size: 3, seed: "0" },
          },
        ],
      },
      "{",
    );
    expect(result).toMatchObject({
      success: false,
      failure: { code: "operation-failed", message: "Invalid JSON input" },
    });
    expect(wasmMocks.jsonMinify).not.toHaveBeenCalled();
  });
});
