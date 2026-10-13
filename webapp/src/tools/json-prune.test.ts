import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmMocks = vi.hoisted(() => ({
  jsonPrune: vi.fn(),
  jsonMinify: vi.fn(),
}));

vi.mock("../lib/wasm", () => ({
  wasmWrapper: {
    json_prune: wasmMocks.jsonPrune,
    json_minify: wasmMocks.jsonMinify,
  },
}));

import { executePipe } from "../lib/pipes/executor";
import { getPipeToolById, getPipeTransformTools } from "./index";

const ids = {
  pipe: "11111111-1111-4111-8111-111111111111",
  prune: "22222222-2222-4222-8222-222222222222",
  minify: "33333333-3333-4333-8333-333333333333",
};

describe("JSON Prune tool and Pipes contract", () => {
  beforeEach(() => {
    wasmMocks.jsonPrune.mockReset();
    wasmMocks.jsonMinify.mockReset();
  });

  it("exposes a versioned transform with validated defaults", () => {
    const tool = getPipeToolById("data-formats-json-prune");
    expect(tool).toBeDefined();
    expect(getPipeTransformTools().map(({ id }) => id)).toContain(tool?.id);
    expect(tool?.pipe?.version).toBe(1);
    expect(tool?.pipe?.input).toEqual({ kind: "transform", key: "text" });
    expect(tool?.pipe?.defaults).toEqual({
      dropKeys: "",
      sample: false,
      sampleSize: 3,
    });
    expect(
      tool?.pipe?.validateConfig({
        dropKeys: "debug",
        sample: true,
        sampleSize: 0,
      }).valid,
    ).toBe(false);
    expect(
      tool?.pipe?.validateConfig({
        dropKeys: "",
        sample: true,
        sampleSize: 1.5,
      }).valid,
    ).toBe(false);
    expect(
      tool?.pipe?.validateConfig({
        dropKeys: "",
        sample: true,
        sampleSize: 3,
        output: "json",
      }).valid,
    ).toBe(false);
  });

  it("passes only raw JSON to the next Pipe step", async () => {
    const input = '{"items":[1,2,3,4,5,6,7],"unused":null}';
    wasmMocks.jsonPrune.mockReturnValue({
      success: true,
      result: '{"items":[1,2,3,7]}',
      pruned: {
        nulls: 1,
        emptyStrings: 0,
        emptyObjects: 0,
        emptyArrays: 0,
        droppedKeys: 0,
      },
      sampling: { omittedTotal: 3, arrays: [{ path: "/items", omitted: 3 }] },
    });
    wasmMocks.jsonMinify.mockReturnValue({
      success: true,
      result: '{"items":[1,2,3,7]}',
    });

    const result = await executePipe(
      {
        id: ids.pipe,
        name: "Prune then minify",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: ids.prune,
            toolId: "data-formats-json-prune",
            toolVersion: 1,
            config: { dropKeys: "", sample: true, sampleSize: 3 },
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

    expect(result).toEqual({ success: true, output: '{"items":[1,2,3,7]}' });
    expect(wasmMocks.jsonPrune).toHaveBeenCalledWith(input, "", 3);
    expect(wasmMocks.jsonMinify).toHaveBeenCalledWith(
      '{"items":[1,2,3,7]}',
      false,
    );
  });

  it("stops on invalid JSON without forwarding a result", async () => {
    wasmMocks.jsonPrune.mockReturnValue({
      success: false,
      error: "Invalid JSON input",
    });
    const result = await executePipe(
      {
        id: ids.pipe,
        name: "Prune",
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
        steps: [
          {
            id: ids.prune,
            toolId: "data-formats-json-prune",
            toolVersion: 1,
            config: { dropKeys: "", sample: false, sampleSize: 3 },
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
