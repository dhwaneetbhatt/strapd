// Identifier tools definitions

import { UuidGeneratorToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { identifierOperations } from "../lib/utils/identifiers";
import type { Tool, ToolGroup } from "../types";

// UUID Generator Tool
const uuidGeneratorToolDefinition: ToolDefinition = {
  id: "identifier-uuid-generator",
  name: "UUID Generator",
  description: "Generate UUIDs",
  category: "identifiers",
  aliases: ["uuid", "guid", "id"],
  component: UuidGeneratorToolComponent,
  operation: (inputs) => {
    const version = String(inputs.version || "v4");
    const count = Number(inputs.count || 1);

    if (version === "v7") {
      return identifierOperations.uuidV7(count);
    }
    return identifierOperations.uuidV4(count);
  },
};

// Create Tool wrapper
export const uuidGeneratorTool: Tool = {
  id: uuidGeneratorToolDefinition.id,
  name: uuidGeneratorToolDefinition.name,
  description: uuidGeneratorToolDefinition.description,
  category: uuidGeneratorToolDefinition.category,
  aliases: uuidGeneratorToolDefinition.aliases,
  operation: (inputs) => uuidGeneratorToolDefinition.operation(inputs),
};

// Export all identifier tools as a group
export const identifierToolsGroup: ToolGroup = {
  category: "identifiers",
  name: "Identifiers",
  description: "Generate unique identifiers",
  icon: CATEGORY_ICONS.identifiers,
  tools: [uuidGeneratorTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [uuidGeneratorToolDefinition.id]: uuidGeneratorToolDefinition,
};
