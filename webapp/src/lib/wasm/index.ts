import * as wasm from 'strapd_wasm';
import { ToolResult } from '../../types';

export interface WasmModule {
  string_to_uppercase: (input: string) => string;
  string_to_lowercase: (input: string) => string;
  string_to_capitalcase: (input: string) => string;

  // Analysis
  string_count_lines: (input: string) => number;
  string_count_words: (input: string) => number;
  string_count_chars: (input: string) => number;
  string_count_bytes: (input: string) => number;

  // Transform
  string_reverse: (input: string) => string;
  string_replace: (input: string, search: string, replacement: string) => string;
  string_slugify: (input: string, separator: string) => string;

  // Whitespace
  string_trim: (input: string, left: boolean, right: boolean, all: boolean) => string;

  // Identifiers
  uuid_generate_v4: (count: number) => string;
  uuid_generate_v7: (count: number) => string;
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

  // Analysis
  public string_count_lines(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_count_lines(input).toString(),
      'string_count_lines'
    );
  }

  public string_count_words(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_count_words(input).toString(),
      'string_count_words'
    );
  }

  public string_count_chars(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_count_chars(input).toString(),
      'string_count_chars'
    );
  }

  public string_count_bytes(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_count_bytes(input).toString(),
      'string_count_bytes'
    );
  }

  // Transform
  public string_reverse(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_reverse(input),
      'string_reverse'
    );
  }

  public string_replace(input: string, search: string, replacement: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_replace(input, search, replacement),
      'string_replace'
    );
  }

  public string_slugify(input: string, separator: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_slugify(input, separator),
      'string_slugify'
    );
  }

  // Whitespace
  public string_trim(input: string, left: boolean, right: boolean, all: boolean): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.string_trim(input, left, right, all),
      'string_trim'
    );
  }

  // Identifiers
  public uuid_generate_v4(count: number): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.uuid_generate_v4(count),
      'uuid_generate_v4'
    );
  }

  public uuid_generate_v7(count: number): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.uuid_generate_v7(count),
      'uuid_generate_v7'
    );
  }
}

// Export singleton instance
export const wasmWrapper = WasmWrapper.getInstance();