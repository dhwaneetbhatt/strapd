import { JsonToolComponent, XmlToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { dataFormatsOperations } from "../lib/utils/data-formats";
import type { Tool, ToolGroup } from "../types";

// JSON Tool
const jsonToolDefinition: ToolDefinition = {
  id: "data-formats-json",
  name: "JSON",
  description: "Format, minify, and sort JSON data",
  category: "dataFormats",
  aliases: ["json", "format", "beautify", "minify"],
  component: JsonToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const sort = Boolean(inputs.sort);
    const minify = Boolean(inputs.minify);

    // Return empty result if no input
    if (!text.trim()) {
      return { success: true, result: "" };
    }

    if (minify) {
      return dataFormatsOperations.jsonMinify(text, sort);
    }

    return dataFormatsOperations.jsonBeautify(text, sort);
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

    // Return empty result if no input
    if (!text.trim()) {
      return { success: true, result: "" };
    }

    if (minify) {
      return dataFormatsOperations.xmlMinify(text);
    }

    return dataFormatsOperations.xmlBeautify(text);
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

// Export all data formats tools as a group
export const dataFormatsToolsGroup: ToolGroup = {
  category: "dataFormats",
  name: "Data Formats",
  description: "Format and transform data structures",
  icon: CATEGORY_ICONS.dataFormats,
  tools: [jsonTool, xmlTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [jsonToolDefinition.id]: jsonToolDefinition,
  [xmlToolDefinition.id]: xmlToolDefinition,
};
