import {
  ConverterToolComponent,
  JsonToolComponent,
  XmlToolComponent,
} from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import type { DataFormat } from "../lib/utils/data-formats";
import { dataFormatsOperations } from "../lib/utils/data-formats";
import type { Tool, ToolGroup } from "../types";

// JSON Tool
const jsonToolDefinition: ToolDefinition = {
  id: "data-formats-json",
  name: "JSON",
  description: "Format, minify, and sort JSON",
  category: "dataFormats",
  aliases: ["json", "format", "beautify", "minify"],
  component: JsonToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const sort = Boolean(inputs.sort);
    const minify = Boolean(inputs.minify);
    const indentSize = Number(inputs.indentSize) || 2;

    // Return empty result if no input
    if (!text.trim()) {
      return { success: true, result: "" };
    }

    if (minify) {
      return dataFormatsOperations.jsonMinify(text, sort);
    }

    return dataFormatsOperations.jsonBeautify(text, sort, indentSize);
  },
};

export const jsonTool: Tool = {
  id: jsonToolDefinition.id,
  name: jsonToolDefinition.name,
  description: jsonToolDefinition.description,
  category: jsonToolDefinition.category,
  aliases: jsonToolDefinition.aliases,
  operation: (inputs) => jsonToolDefinition.operation(inputs),
};

// XML Tool
const xmlToolDefinition: ToolDefinition = {
  id: "data-formats-xml",
  name: "XML",
  description: "Format and minify XML data",
  category: "dataFormats",
  aliases: ["xml", "format"],
  component: XmlToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const minify = Boolean(inputs.minify);
    const indentSize = Number(inputs.indentSize) || 2;

    // Return empty result if no input
    if (!text.trim()) {
      return { success: true, result: "" };
    }

    if (minify) {
      return dataFormatsOperations.xmlMinify(text);
    }

    return dataFormatsOperations.xmlBeautify(text, indentSize);
  },
};

export const xmlTool: Tool = {
  id: xmlToolDefinition.id,
  name: xmlToolDefinition.name,
  description: xmlToolDefinition.description,
  category: xmlToolDefinition.category,
  aliases: xmlToolDefinition.aliases,
  operation: (inputs) => xmlToolDefinition.operation(inputs),
};

// Format Converter Tool
const converterToolDefinition: ToolDefinition = {
  id: "data-formats-converter",
  name: "Format Converter",
  description: "Convert between JSON, YAML, and XML formats",
  category: "dataFormats",
  aliases: ["convert", "converter", "transform", "json", "yaml", "xml"],
  component: ConverterToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const sourceFormat = String(inputs.sourceFormat || "auto");
    const targetFormat = String(inputs.targetFormat || "yaml");
    const detectedFormat = String(inputs.detectedFormat || "unknown");
    const rootName = inputs.rootName ? String(inputs.rootName) : undefined;
    const minify = Boolean(inputs.minify);

    // Return empty result if no input
    if (!text.trim()) {
      return { success: true, result: "" };
    }

    // Determine actual source format
    const actualSource =
      sourceFormat === "auto" ? detectedFormat : sourceFormat;

    // Use the conversion router
    return dataFormatsOperations.convert(
      text,
      actualSource as DataFormat,
      targetFormat as DataFormat,
      { rootName, minify },
    );
  },
};

export const converterTool: Tool = {
  id: converterToolDefinition.id,
  name: converterToolDefinition.name,
  description: converterToolDefinition.description,
  category: converterToolDefinition.category,
  aliases: converterToolDefinition.aliases,
  operation: (inputs) => converterToolDefinition.operation(inputs),
};

// Export all data formats tools as a group
export const dataFormatsToolsGroup: ToolGroup = {
  category: "dataFormats",
  name: "Data Formats",
  description: "Format and transform data structures",
  icon: CATEGORY_ICONS.dataFormats,
  tools: [converterTool, jsonTool, xmlTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [converterToolDefinition.id]: converterToolDefinition,
  [jsonToolDefinition.id]: jsonToolDefinition,
  [xmlToolDefinition.id]: xmlToolDefinition,
};
