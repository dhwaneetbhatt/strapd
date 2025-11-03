// WASM module wrapper
import * as wasm from 'strapd_wasm';
import { ToolResult } from '../../types';

// WASM module interface
export interface WasmModule {
  uppercase: (input: string) => string;
  lowercase: (input: string) => string;
  // Add more WASM functions as they become available
}

// Wrapper class for WASM operations with error handling
export class WasmWrapper {
  private static instance: WasmWrapper;
  private wasmModule: WasmModule;

  private constructor() {
    this.wasmModule = wasm as WasmModule;
  }

  public static getInstance(): WasmWrapper {
    if (!WasmWrapper.instance) {
      WasmWrapper.instance = new WasmWrapper();
    }
    return WasmWrapper.instance;
  }

  // Safe wrapper for WASM functions
  private safeWasmCall<T>(
    fn: () => T,
    functionName: string
  ): ToolResult {
    try {
      const result = fn();
      return {
        success: true,
        result: String(result)
      };
    } catch (error) {
      console.error(`WASM ${functionName} error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Unknown error in ${functionName}`
      };
    }
  }

  // String operations
  public uppercase(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.uppercase(input),
      'uppercase'
    );
  }

  public lowercase(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.lowercase(input),
      'lowercase'
    );
  }

  // Add more operations as they become available
  // public base64Encode(input: string): ToolResult { ... }
}

// Export singleton instance
export const wasmWrapper = WasmWrapper.getInstance();