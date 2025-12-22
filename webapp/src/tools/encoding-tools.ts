import {
  Base64ToolComponent,
  HexToolComponent,
  UrlToolComponent,
} from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { encodingOperations } from "../lib/utils/encoding";
import type { Tool, ToolGroup } from "../types";

// Base64 Tool
const base64ToolDefinition: ToolDefinition = {
  id: "encoding-base64",
  name: "Base64",
  description: "Encode/decode Base64",
  category: "encoding",
  aliases: ["base64", "encode", "decode"],
  component: Base64ToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const mode = String(inputs.mode || "encode");

    if (mode === "decode") {
      return encodingOperations.base64Decode(text);
    }

    return encodingOperations.base64Encode(text);
  },
};

export const base64Tool: Tool = {
  id: base64ToolDefinition.id,
  name: base64ToolDefinition.name,
  description: base64ToolDefinition.description,
  category: base64ToolDefinition.category,
  aliases: base64ToolDefinition.aliases,
  operation: (inputs) => base64ToolDefinition.operation(inputs),
};

// URL Tool
const urlToolDefinition: ToolDefinition = {
  id: "encoding-url",
  name: "URL",
  description: "Encode/decode URLs",
  category: "encoding",
  aliases: ["url", "urlencode", "urldecode"],
  component: UrlToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const mode = String(inputs.mode || "encode");

    if (mode === "decode") {
      return encodingOperations.urlDecode(text);
    }

    return encodingOperations.urlEncode(text);
  },
};

export const urlTool: Tool = {
  id: urlToolDefinition.id,
  name: urlToolDefinition.name,
  description: urlToolDefinition.description,
  category: urlToolDefinition.category,
  aliases: urlToolDefinition.aliases,
  operation: (inputs) => urlToolDefinition.operation(inputs),
};

// Hex Tool
const hexToolDefinition: ToolDefinition = {
  id: "encoding-hex",
  name: "Hex",
  description: "Encode/decode hex",
  category: "encoding",
  aliases: ["hex", "hexencode", "hexdecode"],
  component: HexToolComponent,
  operation: (inputs) => {
    const text = String(inputs.text || "");
    const mode = String(inputs.mode || "encode");

    if (mode === "decode") {
      return encodingOperations.hexDecode(text);
    }

    return encodingOperations.hexEncode(text);
  },
};

export const hexTool: Tool = {
  id: hexToolDefinition.id,
  name: hexToolDefinition.name,
  description: hexToolDefinition.description,
  category: hexToolDefinition.category,
  aliases: hexToolDefinition.aliases,
  operation: (inputs) => hexToolDefinition.operation(inputs),
};

// Export all encoding tools as a group
export const encodingToolsGroup: ToolGroup = {
  category: "encoding",
  name: "Encoding",
  description: "Data encoding and decoding utilities",
  icon: CATEGORY_ICONS.encoding,
  tools: [base64Tool, urlTool, hexTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [base64ToolDefinition.id]: base64ToolDefinition,
  [urlToolDefinition.id]: urlToolDefinition,
  [hexToolDefinition.id]: hexToolDefinition,
};
