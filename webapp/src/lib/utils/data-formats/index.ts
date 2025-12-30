import type { ToolResult } from "../../../types";
import { wasmWrapper } from "../../wasm";

export type DataFormat = "json" | "yaml" | "xml" | "unknown";

export function detectFormat(input: string): DataFormat {
  const trimmed = input.trim();

  if (!trimmed) {
    return "unknown";
  }

  // XML detection: starts with < or <?
  if (trimmed.startsWith("<")) {
    return "xml";
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

  jsonToXml: (input: string, root?: string): ToolResult => {
    return wasmWrapper.json_to_xml(input, root || null);
  },

  xmlToJson: (input: string): ToolResult => {
    return wasmWrapper.xml_to_json(input);
  },

  // Conversion router based on source and target formats
  convert: (
    input: string,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options?: { rootName?: string; minify?: boolean },
  ): ToolResult => {
    const minify = options?.minify ?? false;

    if (sourceFormat === targetFormat) {
      switch (sourceFormat) {
        case "json":
          return minify
            ? dataFormatsOperations.jsonMinify(input, false)
            : dataFormatsOperations.jsonBeautify(input, false, 2);
        case "yaml":
          // YAML doesn't have a beautify/minify function, just return input
          return { success: true, result: input };
        case "xml":
          return minify
            ? dataFormatsOperations.xmlMinify(input)
            : dataFormatsOperations.xmlBeautify(input, 2);
        default:
          return { success: false, error: "Unknown format" };
      }
    }

    // JSON ↔ YAML
    if (sourceFormat === "json" && targetFormat === "yaml") {
      const result = dataFormatsOperations.jsonToYaml(input);
      return result;
    }
    if (sourceFormat === "yaml" && targetFormat === "json") {
      const result = dataFormatsOperations.yamlToJson(input);
      if (result.success && !minify && result.result) {
        return dataFormatsOperations.jsonBeautify(result.result, false, 2);
      }
      return result;
    }

    // JSON → XML
    if (sourceFormat === "json" && targetFormat === "xml") {
      const result = dataFormatsOperations.jsonToXml(input, options?.rootName);
      if (result.success && !minify && result.result) {
        return dataFormatsOperations.xmlBeautify(result.result, 2);
      }
      return result;
    }

    // XML → JSON
    if (sourceFormat === "xml" && targetFormat === "json") {
      const result = dataFormatsOperations.xmlToJson(input);
      if (result.success && !minify && result.result) {
        return dataFormatsOperations.jsonBeautify(result.result, false, 2);
      }
      return result;
    }

    return { success: false, error: "Unsupported conversion" };
  },
};
