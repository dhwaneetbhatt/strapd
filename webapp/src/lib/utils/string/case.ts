// String case operations

import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const stringCaseOperations = {
  /**
   * Convert string to uppercase
   */
  uppercase: (input: string): ToolResult => {
    if (!input.trim()) {
      return { success: false, error: "Input is required" };
    }
    return wasmWrapper.string_to_uppercase(input);
  },

  /**
   * Convert string to lowercase
   */
  lowercase: (input: string): ToolResult => {
    if (!input.trim()) {
      return { success: false, error: "Input is required" };
    }
    return wasmWrapper.string_to_lowercase(input);
  },

  /**
   * Convert string to capital case (first letter of each word capitalized)
   */
  capitalcase: (input: string): ToolResult => {
    if (!input.trim()) {
      return { success: false, error: "Input is required" };
    }
    return wasmWrapper.string_to_capitalcase(input);
  },
};
