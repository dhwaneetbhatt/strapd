import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export type DataFormat = "json" | "yaml" | "unknown";

export function detectFormat(input: string): DataFormat {
  const trimmed = input.trim();

  if (!trimmed) {
    return "unknown";
  }

  // XML detection: starts with < or <?
  // Note: XML is detected but returned as unknown since conversion not supported
  if (trimmed.startsWith("<")) {
    return "unknown";
  }

  // JSON detection: starts with { or [
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return "json";
  }

  // YAML detection: has key: value patterns, no braces
  if (/^[\w-]+\s*:/.test(trimmed) && !trimmed.includes("{")) {
    return "yaml";
  }

  return "unknown";
}

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

  jsonToYaml: (input: string): ToolResult => {
    return wasmWrapper.json_to_yaml(input);
  },

  yamlToJson: (input: string): ToolResult => {
    return wasmWrapper.yaml_to_json(input);
  },

  // Conversion router based on source and target formats
  convert: (
    input: string,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
  ): ToolResult => {
    // Same format: beautify
    if (sourceFormat === targetFormat) {
      switch (sourceFormat) {
        case "json":
          return dataFormatsOperations.jsonBeautify(input, false, 2);
        case "yaml":
          // YAML doesn't have a beautify function, just return input
          return { success: true, result: input };
        default:
          return { success: false, error: "Unknown format" };
      }
    }

    // JSON ↔ YAML
    if (sourceFormat === "json" && targetFormat === "yaml") {
      return dataFormatsOperations.jsonToYaml(input);
    }
    if (sourceFormat === "yaml" && targetFormat === "json") {
      return dataFormatsOperations.yamlToJson(input);
    }

    return { success: false, error: "Unsupported conversion" };
  },
};
