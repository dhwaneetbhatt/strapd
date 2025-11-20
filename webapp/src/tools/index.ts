// Tool registry - central place for all tools
import type { Tool, ToolGroup } from "../types";
import {
  TOOL_REGISTRY as IDENTIFIER_TOOL_REGISTRY,
  identifierToolsGroup,
} from "./identifier-tools";
import {
  TOOL_REGISTRY as STRING_TOOL_REGISTRY,
  stringToolsGroup,
} from "./string-tools";

// All tool groups
export const toolGroups: ToolGroup[] = [stringToolsGroup, identifierToolsGroup];

// Flatten all tools for easy access
export const allTools: Tool[] = toolGroups.flatMap((group) => group.tools);

// Export the tool registry for component lookup
export const TOOL_REGISTRY = {
  ...STRING_TOOL_REGISTRY,
  ...IDENTIFIER_TOOL_REGISTRY,
};

// Tool lookup functions
export const getToolById = (id: string): Tool | undefined => {
  return allTools.find((tool) => tool.id === id);
};

export const getToolsByCategory = (category: string): Tool[] => {
  return allTools.filter((tool) => tool.category === category);
};

export const searchTools = (query: string): Tool[] => {
  const normalizedQuery = query.toLowerCase();
  return allTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(normalizedQuery) ||
      tool.description.toLowerCase().includes(normalizedQuery) ||
      tool.aliases?.some((alias) =>
        alias.toLowerCase().includes(normalizedQuery),
      ),
  );
};
