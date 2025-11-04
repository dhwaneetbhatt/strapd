import * as wasm from 'strapd_wasm';
import { ToolResult } from '../../types';

export interface WasmModule {
  string_to_uppercase: (input: string) => string;
  string_to_lowercase: (input: string) => string;
  string_to_capitalcase: (input: string) => string;
}

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
  public string_to_uppercase(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_to_uppercase(input),
      'string_to_uppercase'
    );
  }

  public string_to_lowercase(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_to_lowercase(input),
      'string_to_lowercase'
    );
  }

  public string_to_capitalcase(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_to_capitalcase(input),
      'string_to_capitalcase'
    );
  }

}

// Export singleton instance
export const wasmWrapper = WasmWrapper.getInstance();