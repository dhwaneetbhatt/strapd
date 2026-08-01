import {
  RandomNumberToolComponent,
  RandomStringToolComponent,
} from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { createPipeToolContract } from "../lib/pipes/tool-contract";
import { wasmWrapper } from "../lib/wasm";
import type { Tool, ToolGroup } from "../types";

const randomStringCharsetFields = [
  "lowercase",
  "uppercase",
  "digits",
  "symbols",
  "customCharset",
];

// Random String Tool
const randomStringToolDefinition: ToolDefinition = {
  id: "random-string",
  name: "Random String",
  description: "Generate random strings with custom characters",
  category: "random",
  aliases: ["string", "text", "password"],
  pipe: createPipeToolContract({
    input: { kind: "source" },
    config: [
      {
        id: "length",
        name: "Length",
        type: "number",
        defaultValue: 16,
        description: "Length of each generated string",
        min: 1,
        max: 255,
        step: 1,
        validations: [{ rule: "integer" }],
      },
      {
        id: "lowercase",
        name: "Lowercase",
        type: "boolean",
        defaultValue: true,
        description: "Include lowercase letters",
      },
      {
        id: "uppercase",
        name: "Uppercase",
        type: "boolean",
        defaultValue: true,
        description: "Include uppercase letters",
      },
      {
        id: "digits",
        name: "Digits",
        type: "boolean",
        defaultValue: true,
        description: "Include digits",
      },
      {
        id: "symbols",
        name: "Symbols",
        type: "boolean",
        defaultValue: true,
        description: "Include symbols",
      },
      {
        id: "customCharset",
        name: "Custom characters",
        type: "string",
        defaultValue: "",
        description: "Additional characters to include",
      },
      {
        id: "count",
        name: "Count",
        type: "number",
        defaultValue: 1,
        description: "Number of strings to generate",
        min: 1,
        max: 100,
        step: 1,
        validations: [{ rule: "integer" }],
      },
    ],
    constraints: [
      {
        rule: "minimumTruthy",
        fields: randomStringCharsetFields,
        minimum: 1,
        field: "customCharset",
        message: "Select at least one character set or enter custom characters",
      },
      {
        rule: "numberAtLeastTruthyCount",
        numberField: "length",
        fields: randomStringCharsetFields,
        field: "length",
      },
    ],
  }),
  component: RandomStringToolComponent,
  operation: (inputs) => {
    const length = Number(inputs.length ?? 16);
    const lowercase = inputs.lowercase !== false; // Default true
    const uppercase = inputs.uppercase !== false; // Default true
    const digits = inputs.digits !== false; // Default true
    const symbols = inputs.symbols !== false; // Default true
    const count = Number(inputs.count ?? 1);
    const customCharset = String(inputs.customCharset ?? "");

    return wasmWrapper.random_string(
      count,
      length,
      lowercase,
      uppercase,
      digits,
      symbols,
      customCharset,
    );
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
  description: "Generate random numbers in range",
  category: "random",
  aliases: ["number", "int", "integer"],
  pipe: createPipeToolContract({
    input: { kind: "source" },
    config: [
      {
        id: "min",
        name: "Minimum",
        type: "number",
        defaultValue: 0,
        description: "Minimum generated value",
        step: 1,
        validations: [
          {
            rule: "integer",
            safe: true,
            message: "Minimum must be a safe whole number",
          },
        ],
      },
      {
        id: "max",
        name: "Maximum",
        type: "number",
        defaultValue: 100,
        description: "Maximum generated value",
        step: 1,
        validations: [
          {
            rule: "integer",
            safe: true,
            message: "Maximum must be a safe whole number",
          },
        ],
      },
      {
        id: "count",
        name: "Count",
        type: "number",
        defaultValue: 1,
        description: "Number of values to generate",
        min: 1,
        max: 1000,
        step: 1,
        validations: [{ rule: "integer" }],
      },
    ],
    constraints: [
      {
        rule: "numberOrder",
        lower: "min",
        upper: "max",
        field: "max",
        message: "Maximum must be greater than or equal to minimum",
      },
    ],
  }),
  component: RandomNumberToolComponent,
  operation: (inputs) => {
    const min = Number(inputs.min ?? 0);
    const max = Number(inputs.max ?? 100);
    const count = Number(inputs.count ?? 1);

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
