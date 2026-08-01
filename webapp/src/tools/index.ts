// Tool registry - central place for all tools

import type { ToolDefinition } from "../components/tools/base-tool";
import { searchItems } from "../lib/utils/search";
import type { Tool, ToolGroup } from "../types";
import {
  TOOL_REGISTRY as CALCULATOR_TOOL_REGISTRY,
  calculatorToolsGroup,
} from "./calculator-tools";
import {
  TOOL_REGISTRY as DATA_FORMATS_TOOL_REGISTRY,
  dataFormatsToolsGroup,
} from "./data-formats-tools";
import {
  TOOL_REGISTRY as DATETIME_TOOL_REGISTRY,
  datetimeToolsGroup,
} from "./datetime-tools";
import {
  TOOL_REGISTRY as ENCODING_TOOL_REGISTRY,
  encodingToolsGroup,
} from "./encoding-tools";
import {
  TOOL_REGISTRY as IDENTIFIER_TOOL_REGISTRY,
  identifierToolsGroup,
} from "./identifier-tools";
import {
  TOOL_REGISTRY as RANDOM_TOOL_REGISTRY,
  randomToolsGroup,
} from "./random-tools";
import {
  TOOL_REGISTRY as SECURITY_TOOL_REGISTRY,
  securityToolsGroup,
} from "./security-tools";
import {
  TOOL_REGISTRY as STRING_TOOL_REGISTRY,
  stringToolsGroup,
} from "./string-tools";

export const toolGroups: ToolGroup[] = [
  stringToolsGroup,
  datetimeToolsGroup,
  encodingToolsGroup,
  identifierToolsGroup,
  securityToolsGroup,
  randomToolsGroup,
  dataFormatsToolsGroup,
  calculatorToolsGroup,
];

// Flatten all tools for easy access
export const allTools: Tool[] = toolGroups.flatMap((group) => group.tools);

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  ...STRING_TOOL_REGISTRY,
  ...DATETIME_TOOL_REGISTRY,
  ...IDENTIFIER_TOOL_REGISTRY,
  ...ENCODING_TOOL_REGISTRY,
  ...SECURITY_TOOL_REGISTRY,
  ...RANDOM_TOOL_REGISTRY,
  ...DATA_FORMATS_TOOL_REGISTRY,
  ...CALCULATOR_TOOL_REGISTRY,
};

export const getPipeToolById = (id: string): ToolDefinition | undefined => {
  return TOOL_REGISTRY[id];
};

export const getPipeTools = (): ToolDefinition[] =>
  Object.values(TOOL_REGISTRY).filter((tool) => Boolean(tool.pipe));

export const getPipeSourceTools = (): ToolDefinition[] =>
  getPipeTools().filter((tool) => tool.pipe?.input.kind === "source");

export const getPipeTransformTools = (): ToolDefinition[] =>
  getPipeTools().filter((tool) => tool.pipe?.input.kind === "transform");

// Tool lookup functions
export const getToolById = (id: string): Tool | undefined => {
  return allTools.find((tool) => tool.id === id);
};

export const getToolsByCategory = (category: string): Tool[] => {
  return allTools.filter((tool) => tool.category === category);
};

export const searchTools = (query: string): Tool[] => {
  return searchItems(query, allTools);
};
