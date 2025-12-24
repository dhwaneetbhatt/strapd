// Identifier tools definitions

import { UuidGeneratorToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { UlidGeneratorToolComponent } from "../components/tools/identifiers/ulid-generator-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { identifierOperations } from "../lib/utils/identifiers";
import type { Tool, ToolGroup } from "../types";

// UUID Generator Tool
const uuidGeneratorToolDefinition: ToolDefinition = {
  id: "identifier-uuid-generator",
  name: "UUID Generator",
  description: "Generate v4 and v7 UUID identifiers",
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

// ULID Generator Tool
const ulidGeneratorToolDefinition: ToolDefinition = {
  id: "identifier-ulid-generator",
  name: "ULID Generator",
  description: "Generate sortable, timestamp-based ULIDs",
  category: "identifiers",
  aliases: ["ulid", "sortable-id"],
  component: UlidGeneratorToolComponent,
  operation: (inputs) => {
    const count = Number(inputs.count || 1);
    return identifierOperations.ulid(count);
  },
};

export const ulidGeneratorTool: Tool = {
  id: ulidGeneratorToolDefinition.id,
  name: ulidGeneratorToolDefinition.name,
  description: ulidGeneratorToolDefinition.description,
  category: ulidGeneratorToolDefinition.category,
  aliases: ulidGeneratorToolDefinition.aliases,
  operation: (inputs) => ulidGeneratorToolDefinition.operation(inputs),
};

// Export all identifier tools as a group
export const identifierToolsGroup: ToolGroup = {
  category: "identifiers",
  name: "Identifiers",
  description: "Generate unique identifiers",
  icon: CATEGORY_ICONS.identifiers,
  tools: [uuidGeneratorTool, ulidGeneratorTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [uuidGeneratorToolDefinition.id]: uuidGeneratorToolDefinition,
  [ulidGeneratorToolDefinition.id]: ulidGeneratorToolDefinition,
};
