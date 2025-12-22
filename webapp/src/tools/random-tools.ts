import {
  RandomNumberToolComponent,
  RandomStringToolComponent,
} from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { wasmWrapper } from "../lib/wasm";
import type { Tool, ToolGroup } from "../types";

// Random String Tool
const randomStringToolDefinition: ToolDefinition = {
  id: "random-string",
  name: "Random String",
  description: "Random strings",
  category: "random",
  aliases: ["string", "text", "password"],
  component: RandomStringToolComponent,
  operation: (inputs) => {
    const length = Number(inputs.length) || 16;
    const lowercase = inputs.lowercase !== false; // Default true
    const uppercase = inputs.uppercase !== false; // Default true
    const digits = inputs.digits !== false; // Default true
    const symbols = inputs.symbols !== false; // Default true
    const count = Number(inputs.count) || 1;

    if (count <= 1) {
      return wasmWrapper.random_string(
        length,
        lowercase,
        uppercase,
        digits,
        symbols,
      );
    }

    // Generate multiple strings
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      const res = wasmWrapper.random_string(
        length,
        lowercase,
        uppercase,
        digits,
        symbols,
      );
      if (!res.success) return res;
      results.push(res.result || "");
    }
    return { success: true, result: results.join("\n") };
  },
};

export const randomStringTool: Tool = {
  id: randomStringToolDefinition.id,
  name: randomStringToolDefinition.name,
  description: randomStringToolDefinition.description,
  category: randomStringToolDefinition.category,
  aliases: randomStringToolDefinition.aliases as string[],
  operation: (inputs) => randomStringToolDefinition.operation(inputs),
};

// Random Number Tool
const randomNumberToolDefinition: ToolDefinition = {
  id: "random-number",
  name: "Random Number",
  description: "Random numbers",
  category: "random",
  aliases: ["number", "int", "integer"],
  component: RandomNumberToolComponent,
  operation: (inputs) => {
    const min = Number(inputs.min) || 0;
    const max = Number(inputs.max) || 100;
    const count = Number(inputs.count) || 1;

    return wasmWrapper.random_number(min, max, count);
  },
};

export const randomNumberTool: Tool = {
  id: randomNumberToolDefinition.id,
  name: randomNumberToolDefinition.name,
  description: randomNumberToolDefinition.description,
  category: randomNumberToolDefinition.category,
  aliases: randomNumberToolDefinition.aliases as string[],
  operation: (inputs) => randomNumberToolDefinition.operation(inputs),
};

// Export all random tools as a group
export const randomToolsGroup: ToolGroup = {
  category: "random",
  name: "Random Generators",
  description: "Generate random strings and numbers",
  icon: CATEGORY_ICONS.random,
  tools: [randomStringTool, randomNumberTool],
};

// Tool registry for component lookup
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [randomStringToolDefinition.id]: randomStringToolDefinition,
  [randomNumberToolDefinition.id]: randomNumberToolDefinition,
};
