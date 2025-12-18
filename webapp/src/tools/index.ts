// Tool registry - central place for all tools
import { fuzzySearch } from "../lib/utils/search";
import type { Tool, ToolGroup } from "../types";
import {
  TOOL_REGISTRY as DATA_FORMATS_TOOL_REGISTRY,
  dataFormatsToolsGroup,
} from "./data-formats-tools";
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
  encodingToolsGroup,
  identifierToolsGroup,
  securityToolsGroup,
  randomToolsGroup,
  dataFormatsToolsGroup,
];

// Flatten all tools for easy access
export const allTools: Tool[] = toolGroups.flatMap((group) => group.tools);

export const TOOL_REGISTRY = {
  ...STRING_TOOL_REGISTRY,
  ...IDENTIFIER_TOOL_REGISTRY,
  ...ENCODING_TOOL_REGISTRY,
  ...SECURITY_TOOL_REGISTRY,
  ...RANDOM_TOOL_REGISTRY,
  ...DATA_FORMATS_TOOL_REGISTRY,
};

// Tool lookup functions
export const getToolById = (id: string): Tool | undefined => {
  return allTools.find((tool) => tool.id === id);
};

export const getToolsByCategory = (category: string): Tool[] => {
  return allTools.filter((tool) => tool.category === category);
};

export const searchTools = (query: string): Tool[] => {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return [];

  // First try exact/substring matches (faster, higher priority)
  const exactMatches = allTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(normalizedQuery) ||
      tool.aliases?.some((alias) =>
        alias.toLowerCase().includes(normalizedQuery),
      ),
  );

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Fall back to fuzzy search for better discovery
  const fuzzyResults = fuzzySearch(query, allTools);
  return fuzzyResults.map(({ item }) => item);
};
