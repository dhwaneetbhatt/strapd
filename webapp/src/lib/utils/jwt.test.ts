import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmMocks = vi.hoisted(() => ({
  decode: vi.fn(),
  decodeWithAnalysis: vi.fn(),
  verify: vi.fn(),
  sign: vi.fn(),
  header: vi.fn(),
  payload: vi.fn(),
}));

vi.mock("../wasm", () => ({
  wasmWrapper: {
    jwt_decode: wasmMocks.decode,
    jwt_decode_with_analysis: wasmMocks.decodeWithAnalysis,
    jwt_verify: wasmMocks.verify,
    jwt_sign: wasmMocks.sign,
    jwt_header: wasmMocks.header,
    jwt_payload: wasmMocks.payload,
  },
}));

import { jwtOperations } from "./jwt";

describe("jwtOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses structured decoded output from WASM", () => {
    wasmMocks.decode.mockReturnValue({
      success: true,
      result: '{"header":{"alg":"HS256"},"payload":{"sub":"123"}}',
    });

    expect(jwtOperations.decode("token")).toMatchObject({
      success: true,
      value: {
        header: { alg: "HS256" },
        payload: { sub: "123" },
      },
    });
  });

  it("uses the analyzed core operation only when requested", () => {
    wasmMocks.decodeWithAnalysis.mockReturnValue({
      success: true,
      result:
        '{"header":{},"payload":{},"analysis":{"expiration":{"status":"NOT_PRESENT"},"signature":{"status":"UNVERIFIED"}}}',
    });

    const result = jwtOperations.decode("token", true);

    expect(wasmMocks.decodeWithAnalysis).toHaveBeenCalledWith("token");
    expect(result.value?.analysis?.expiration.status).toBe("NOT_PRESENT");
  });

  it("rejects malformed serialized output", () => {
    wasmMocks.verify.mockReturnValue({ success: true, result: "not-json" });

    expect(jwtOperations.verify("token", "secret")).toEqual({
      success: false,
      error: "JWT operation returned invalid JSON",
    });
  });

  it("does not invoke signing without required inputs", () => {
    expect(jwtOperations.sign("", "secret", "HS256")).toMatchObject({
      success: false,
    });
    expect(jwtOperations.sign("{}", "", "HS256")).toMatchObject({
      success: false,
    });
    expect(wasmMocks.sign).not.toHaveBeenCalled();
  });
});
