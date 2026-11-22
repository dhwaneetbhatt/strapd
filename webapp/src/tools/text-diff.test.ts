import { describe, expect, it, vi } from "vitest";
import { stringUtils } from "../lib/utils/string";
import { wasmWrapper } from "../lib/wasm";
import { stringToolsGroup, TOOL_REGISTRY } from "./string-tools";

vi.mock("../lib/wasm", () => ({
  wasmWrapper: { text_diff: vi.fn(), text_diff_unified: vi.fn() },
}));

describe("Text Diff tool definition", () => {
  const tool = TOOL_REGISTRY["string-diff"];

  it("registers Text Diff in search and does not expose a pipe contract", () => {
    expect(stringToolsGroup.tools).toContainEqual(tool);
    expect(tool.name).toBe("Text Diff");
    expect(tool.aliases).toEqual([
      "diff",
      "compare",
      "delta",
      "patch",
      "text diff",
    ]);
    expect(tool.pipe).toBeUndefined();
    expect(tool.sensitiveInputs).toEqual(["original", "changed"]);
  });

  it("passes both inputs verbatim, and uses the selected context", () => {
    const diff = { hunks: [], added: 0, removed: 0 };
    vi.mocked(wasmWrapper.text_diff).mockReturnValue({ success: true, diff });
    expect(tool.operation({ original: " \r\n", changed: " \n" })).toEqual({
      success: true,
      diff,
    });
    expect(wasmWrapper.text_diff).toHaveBeenLastCalledWith(" \r\n", " \n", 3);
    tool.operation({ changed: "x", context: 0xffffffff });
    expect(wasmWrapper.text_diff).toHaveBeenLastCalledWith("", "x", 0xffffffff);
  });

  it("requests the unified patch with fixed labels", () => {
    const patch = { success: true, result: "--- original\n+++ changed\n" };
    vi.mocked(wasmWrapper.text_diff_unified).mockReturnValue(patch);
    expect(stringUtils.diff.unified("x\n", "x", 10)).toBe(patch);
    expect(wasmWrapper.text_diff_unified).toHaveBeenLastCalledWith(
      "x\n",
      "x",
      10,
      "original",
      "changed",
    );
  });
});
