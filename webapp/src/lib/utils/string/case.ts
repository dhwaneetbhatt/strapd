// String case operations
import { wasmWrapper } from '../../wasm';
import { ToolResult } from '../../../types';

export const stringCaseOperations = {
  /**
   * Convert string to uppercase
   */
  uppercase: (input: string): ToolResult => {
    if (!input.trim()) {
      return { success: false, error: 'Input is required' };
    }
    return wasmWrapper.uppercase(input);
  },

  // Placeholder for future operations
  // lowercase: (input: string): ToolResult => {
  //   return wasmWrapper.lowercase(input);
  // },

  // capitalCase: (input: string): ToolResult => {
  //   return wasmWrapper.capitalCase(input);
  // },
};