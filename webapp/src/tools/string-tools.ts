// String tools definitions

import {
  CapitalcaseToolComponent,
  LowercaseToolComponent,
  UppercaseToolComponent,
} from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { stringUtils } from "../lib/utils/string";
import type { Tool, ToolGroup } from "../types";

// Define individual string tools with components
const uppercaseToolDefinition: ToolDefinition = {
  id: "string-uppercase",
  name: "Uppercase",
  description: "Convert text to uppercase letters",
  category: "string",
  aliases: ["upper", "uc", "caps"],
  component: UppercaseToolComponent,
  operation: (inputs) => stringUtils.case.uppercase(String(inputs.text || "")),
};

const lowercaseToolDefinition: ToolDefinition = {
  id: "string-lowercase",
  name: "Lowercase",
  description: "Convert text to lowercase letters",
  category: "string",
  aliases: ["lower", "lc"],
  component: LowercaseToolComponent,
  operation: (inputs) => stringUtils.case.lowercase(String(inputs.text || "")),
};

const capitalcaseToolDefinition: ToolDefinition = {
  id: "string-capitalcase",
  name: "Capital Case",
  description:
    "Convert text to capital case (first letter of each word capitalized)",
  category: "string",
  aliases: ["capital", "cc"],
  component: CapitalcaseToolComponent,
  operation: (inputs) =>
    stringUtils.case.capitalcase(String(inputs.text || "")),
};

// Create Tool wrappers for compatibility with existing system
export const uppercaseTool: Tool = {
  id: uppercaseToolDefinition.id,
  name: uppercaseToolDefinition.name,
  description: uppercaseToolDefinition.description,
  category: uppercaseToolDefinition.category,
  aliases: uppercaseToolDefinition.aliases,
  operation: (input: string) =>
    uppercaseToolDefinition.operation({ text: input }),
};

export const lowercaseTool: Tool = {
  id: lowercaseToolDefinition.id,
  name: lowercaseToolDefinition.name,
  description: lowercaseToolDefinition.description,
  category: lowercaseToolDefinition.category,
  aliases: lowercaseToolDefinition.aliases,
  operation: (input: string) =>
    lowercaseToolDefinition.operation({ text: input }),
};

export const capitalCaseTool: Tool = {
  id: capitalcaseToolDefinition.id,
  name: capitalcaseToolDefinition.name,
  description: capitalcaseToolDefinition.description,
  category: capitalcaseToolDefinition.category,
  aliases: capitalcaseToolDefinition.aliases,
  operation: (input: string) =>
    capitalcaseToolDefinition.operation({ text: input }),
};

// Export all string tools as a group
export const stringToolsGroup: ToolGroup = {
  category: "string",
  name: "Text Tools",
  description: "String manipulation and transformation utilities",
  icon: "📝",
  tools: [uppercaseTool, lowercaseTool, capitalCaseTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [uppercaseToolDefinition.id]: uppercaseToolDefinition,
  [lowercaseToolDefinition.id]: lowercaseToolDefinition,
  [capitalcaseToolDefinition.id]: capitalcaseToolDefinition,
};
