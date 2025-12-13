import type { ToolResult } from "../../types";
import { wasmWrapper } from "../wasm";

export const hashOperations = {
  /**
   * Calculate MD5 hash
   */
  md5: (input: string): ToolResult => {
    if (!input) return { success: true, result: "" };
    return wasmWrapper.hash_md5(input);
  },

  /**
   * Calculate SHA1 hash
   */
  sha1: (input: string): ToolResult => {
    if (!input) return { success: true, result: "" };
    return wasmWrapper.hash_sha1(input);
  },

  /**
   * Calculate SHA256 hash
   */
  sha256: (input: string): ToolResult => {
    if (!input) return { success: true, result: "" };
    return wasmWrapper.hash_sha256(input);
  },

  /**
   * Calculate SHA512 hash
   */
  sha512: (input: string): ToolResult => {
    if (!input) return { success: true, result: "" };
    return wasmWrapper.hash_sha512(input);
  },
};

export const hmacOperations = {
  /**
   * Calculate HMAC SHA256
   */
  sha256: (input: string, key: string): ToolResult => {
    if (!input) return { success: true, result: "" };
    return wasmWrapper.hmac_sha256(input, key);
  },

  /**
   * Calculate HMAC SHA512
   */
  sha512: (input: string, key: string): ToolResult => {
    if (!input) return { success: true, result: "" };
    return wasmWrapper.hmac_sha512(input, key);
  },
};

export const securityUtils = {
  hash: hashOperations,
  hmac: hmacOperations,
};
