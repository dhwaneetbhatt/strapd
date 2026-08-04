import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmMocks = vi.hoisted(() => ({
  base64Decode: vi.fn(),
  jwtDecode: vi.fn(),
  jwtDecodeWithAnalysis: vi.fn(),
  jwtHeader: vi.fn(),
  jwtPayload: vi.fn(),
  jwtVerify: vi.fn(),
  jwtSign: vi.fn(),
}));

vi.mock("strapd_wasm", () => ({
  base64_decode: wasmMocks.base64Decode,
  jwt_decode: wasmMocks.jwtDecode,
  jwt_decode_with_analysis: wasmMocks.jwtDecodeWithAnalysis,
  jwt_header: wasmMocks.jwtHeader,
  jwt_payload: wasmMocks.jwtPayload,
  jwt_verify: wasmMocks.jwtVerify,
  jwt_sign: wasmMocks.jwtSign,
}));
vi.unmock("./index");

import { wasmWrapper } from "./index";

describe("WasmWrapper", () => {
  beforeEach(() => {
    wasmMocks.base64Decode.mockReset();
    wasmMocks.jwtDecode.mockReset();
    wasmMocks.jwtDecodeWithAnalysis.mockReset();
    wasmMocks.jwtHeader.mockReset();
    wasmMocks.jwtPayload.mockReset();
    wasmMocks.jwtVerify.mockReset();
    wasmMocks.jwtSign.mockReset();
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

  it("returns serialized JWT output without interpreting it", () => {
    const decoded = '{"header":{"alg":"HS256"},"payload":{"sub":"123"}}';
    wasmMocks.jwtDecode.mockReturnValue(decoded);

    expect(wasmWrapper.jwt_decode("token")).toEqual({
      success: true,
      result: decoded,
    });
  });

  it.each([
    ["structure", "Invalid JWT structure: expected 3 segments, found 2", () => wasmWrapper.jwt_decode("bad")],
    ["signature", "Signature verification failed: secret key mismatch", () => wasmWrapper.jwt_verify("token", "wrong")],
    ["payload", "JWT payload must be a JSON object", () => wasmWrapper.jwt_sign("[]", "secret", "HS256")],
  ])("preserves %s errors from WASM", (_category, message, operation) => {
    const wasmFunction =
      _category === "structure"
        ? wasmMocks.jwtDecode
        : _category === "signature"
          ? wasmMocks.jwtVerify
          : wasmMocks.jwtSign;
    wasmFunction.mockImplementation(() => {
      throw `Error: ${message}`;
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(operation()).toEqual({ success: false, error: message });
  });

  it("converts optional expiration seconds to a WASM bigint", () => {
    wasmMocks.jwtSign.mockReturnValue("token");

    wasmWrapper.jwt_sign("{}", "secret", "HS512", 3600);

    expect(wasmMocks.jwtSign).toHaveBeenCalledWith(
      "{}",
      "secret",
      "HS512",
      3600n,
    );
  });
});
