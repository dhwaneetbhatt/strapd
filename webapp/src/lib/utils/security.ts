import type { ToolResult } from "../../types";
import { wasmWrapper } from "../wasm";

export const securityOperations = {
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

export const securityUtils = {
  hash: securityOperations,
};
