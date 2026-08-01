import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmMocks = vi.hoisted(() => ({
  base64Decode: vi.fn(),
}));

vi.mock("strapd_wasm", () => ({
  base64_decode: wasmMocks.base64Decode,
}));
vi.unmock("./index");

import { wasmWrapper } from "./index";

describe("WasmWrapper", () => {
  beforeEach(() => {
    wasmMocks.base64Decode.mockReset();
  });

  it("turns a thrown WASM error value into a failed ToolResult", () => {
    wasmMocks.base64Decode.mockImplementation(() => {
      throw "Error: Invalid Base64 input";
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(wasmWrapper.base64_decode("%%%" )).toEqual({
      success: false,
      error: "Invalid Base64 input",
    });
  });

  it("does not reinterpret successful data beginning with Error", () => {
    wasmMocks.base64Decode.mockReturnValue("Error: legitimate decoded text");

    expect(wasmWrapper.base64_decode("valid" )).toEqual({
      success: true,
      result: "Error: legitimate decoded text",
    });
  });
});
