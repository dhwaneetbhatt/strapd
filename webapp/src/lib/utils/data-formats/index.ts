import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const dataFormatsOperations = {
  jsonBeautify: (input: string, sort: boolean): ToolResult => {
    return wasmWrapper.json_beautify(input, sort);
  },

  jsonMinify: (input: string, sort: boolean): ToolResult => {
    return wasmWrapper.json_minify(input, sort);
  },

  xmlBeautify: (input: string): ToolResult => {
    return wasmWrapper.xml_beautify(input);
  },

  xmlMinify: (input: string): ToolResult => {
    return wasmWrapper.xml_minify(input);
  },
};
