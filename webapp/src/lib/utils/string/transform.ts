import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const stringTransformOperations = {
  reverse: (input: string): ToolResult => {
    return wasmWrapper.string_reverse(input);
  },
  replace: (input: string, search: string, replacement: string): ToolResult => {
    return wasmWrapper.string_replace(input, search, replacement);
  },
  slugify: (input: string, separator = "-"): ToolResult => {
    return wasmWrapper.string_slugify(input, separator);
  },
};
