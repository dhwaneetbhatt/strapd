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
    return wasmWrapper.uppercase(input);
  },

  /**
   * Convert string to lowercase
   */
  lowercase: (input: string): ToolResult => {
    if (!input.trim()) {
      return { success: false, error: "Input is required" };
    }
    return wasmWrapper.lowercase(input);
  },

  // capitalCase: (input: string): ToolResult => {
  //   return wasmWrapper.capitalCase(input);
  // },
};
