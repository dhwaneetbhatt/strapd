import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export const dataFormatsOperations = {
  jsonBeautify: (input: string, sort: boolean, spaces: number): ToolResult => {
    return wasmWrapper.json_beautify(input, sort, spaces);
  },

  jsonMinify: (input: string, sort: boolean): ToolResult => {
    return wasmWrapper.json_minify(input, sort);
  },

  xmlBeautify: (input: string, spaces: number): ToolResult => {
    return wasmWrapper.xml_beautify(input, spaces);
  },

  xmlMinify: (input: string): ToolResult => {
    return wasmWrapper.xml_minify(input);
  },
};
