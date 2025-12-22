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

  // Encoding
  base64_encode: (input: string) => string;
  base64_decode: (input: string) => string;
  url_encode: (input: string) => string;
  url_decode: (input: string) => string;
  hex_encode: (input: string) => string;
  hex_decode: (input: string) => string;

  // Identifiers
  uuid_generate_v4: (count: number) => string;
  uuid_generate_v7: (count: number) => string;
  ulid_generate: (count: number) => string;

  // Security
  hash_md5: (input: string) => string;
  hash_sha1: (input: string) => string;
  hash_sha256: (input: string) => string;
  hash_sha512: (input: string) => string;
  hmac_sha256: (input: string, key: string) => string;
  hmac_sha512: (input: string, key: string) => string;
  // Random
  random_string: (length: number, lowercase: boolean, uppercase: boolean, digits: boolean, symbols: boolean) => string;
  random_number: (min: bigint, max: bigint, count: number) => BigInt64Array;

  // Data Formats
  json_beautify: (input: string, sort: boolean, spaces: number) => string;
  json_minify: (input: string, sort: boolean) => string;
  xml_beautify: (input: string, spaces: number) => string;
  xml_minify: (input: string) => string;
  json_to_yaml: (input: string) => string;
  yaml_to_json: (input: string) => string;

  // Datetime
  datetime_now: (millis: boolean) => bigint;
  datetime_from_timestamp: (timestamp: bigint, format: string) => string;
  datetime_from_timestamp_millis: (timestamp: bigint, format: string) => string;
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

  // Encoding
  public base64_encode(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.base64_encode(input),
      'base64_encode'
    );
  }

  public base64_decode(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.base64_decode(input),
      'base64_decode'
    );
  }

  public url_encode(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.url_encode(input),
      'url_encode'
    );
  }

  public url_decode(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.url_decode(input),
      'url_decode'
    );
  }

  public hex_encode(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hex_encode(input),
      'hex_encode'
    );
  }

  public hex_decode(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hex_decode(input),
      'hex_decode'
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

  public ulid_generate(count: number): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.ulid_generate(count),
      'ulid_generate'
    );
  }

  // Security
  public hash_md5(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hash_md5(input),
      'hash_md5'
    );
  }

  public hash_sha1(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hash_sha1(input),
      'hash_sha1'
    );
  }

  public hash_sha256(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hash_sha256(input),
      'hash_sha256'
    );
  }

  public hash_sha512(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hash_sha512(input),
      'hash_sha512'
    );
  }

  public hmac_sha256(input: string, key: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hmac_sha256(input, key),
      'hmac_sha256'
    );
  }

  public hmac_sha512(input: string, key: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.hmac_sha512(input, key),
      'hmac_sha512'
    );
  }
  // Random
  public random_string(length: number, lowercase: boolean, uppercase: boolean, digits: boolean, symbols: boolean): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.random_string(length, lowercase, uppercase, digits, symbols),
      'random_string'
    );
  }

  public random_number(min: number, max: number, count: number): ToolResult {
    return this.safeWasmCall(
      () => {
        const result = this.wasmModule.random_number(BigInt(min), BigInt(max), count);
        // Convert BigInt array to string manually for display
        return Array.from(result).join(', ');
      },
      'random_number'
    );
  }

  // Data Formats
  public json_beautify(input: string, sort: boolean, spaces: number): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.json_beautify(input, sort, spaces),
      'json_beautify'
    );
  }

  public json_minify(input: string, sort: boolean): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.json_minify(input, sort),
      'json_minify'
    );
  }

  public xml_beautify(input: string, spaces: number): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.xml_beautify(input, spaces),
      'xml_beautify'
    );
  }

  public xml_minify(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.xml_minify(input),
      'xml_minify'
    );
  }

  // Format Conversions
  public json_to_yaml(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.json_to_yaml(input),
      'json_to_yaml'
    );
  }

  public yaml_to_json(input: string): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.yaml_to_json(input),
      'yaml_to_json'
    );
  }

  // Datetime
  public datetime_now(millis: boolean): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.datetime_now(millis).toString(),
      'datetime_now'
    );
  }

  public datetime_from_timestamp(timestamp: number, format: 'Human' | 'Iso'): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.datetime_from_timestamp(BigInt(timestamp), format),
      'datetime_from_timestamp'
    );
  }

  public datetime_from_timestamp_millis(timestamp: number, format: 'Human' | 'Iso'): ToolResult {
    return this.safeWasmCall(
      () => this.wasmModule.datetime_from_timestamp_millis(BigInt(timestamp), format),
      'datetime_from_timestamp_millis'
    );
  }
}

// Export singleton instance
export const wasmWrapper = WasmWrapper.getInstance();