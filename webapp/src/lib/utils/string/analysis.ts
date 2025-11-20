import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const stringAnalysisOperations = {
  countLines: (input: string): ToolResult => {
    return wasmWrapper.string_count_lines(input);
  },
  countWords: (input: string): ToolResult => {
    return wasmWrapper.string_count_words(input);
  },
  countChars: (input: string): ToolResult => {
    return wasmWrapper.string_count_chars(input);
  },
  countBytes: (input: string): ToolResult => {
    return wasmWrapper.string_count_bytes(input);
  },
};
