import type { ToolResult } from "../../types";
import { wasmWrapper } from "../wasm";

export type JwtAlgorithm = "HS256" | "HS384" | "HS512";
export type JwtExpirationStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "NOT_PRESENT"
  | "INVALID";

export interface JwtExpirationAnalysis {
  status: JwtExpirationStatus;
  expires_at?: string;
  seconds_remaining?: number;
}

export interface JwtAnalysis {
  expiration: JwtExpirationAnalysis;
  signature: { status: "UNVERIFIED" };
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  analysis?: JwtAnalysis;
}

export interface JwtVerification {
  algorithm: JwtAlgorithm;
}

type StructuredJwtResult<T> = ToolResult<{ value?: T }>;

const parseResult = <T>(result: ToolResult): StructuredJwtResult<T> => {
  if (!result.success || result.result === undefined) return result;
  try {
    return {
      success: true,
      result: result.result,
      value: JSON.parse(result.result) as T,
    };
  } catch {
    return { success: false, error: "JWT operation returned invalid JSON" };
  }
};

export const jwtOperations = {
  decode: (
    input: string,
    includeAnalysis = false,
  ): StructuredJwtResult<DecodedJwt> => {
    if (!input.trim()) return { success: true, result: "", value: undefined };
    const result = includeAnalysis
      ? wasmWrapper.jwt_decode_with_analysis(input)
      : wasmWrapper.jwt_decode(input);
    return parseResult<DecodedJwt>(result);
  },

  header: (input: string): ToolResult => wasmWrapper.jwt_header(input),

  payload: (input: string): ToolResult => wasmWrapper.jwt_payload(input),

  verify: (
    input: string,
    secret: string,
  ): StructuredJwtResult<JwtVerification> => {
    if (!input.trim() || !secret) {
      return { success: false, error: "A JWT and secret are required" };
    }
    return parseResult<JwtVerification>(wasmWrapper.jwt_verify(input, secret));
  },

  sign: (
    payload: string,
    secret: string,
    algorithm: JwtAlgorithm,
    expiresInSeconds?: number,
  ): ToolResult => {
    if (!payload.trim())
      return { success: false, error: "A JSON payload is required" };
    if (!secret) return { success: false, error: "A secret is required" };
    return wasmWrapper.jwt_sign(payload, secret, algorithm, expiresInSeconds);
  },
};
