// Calculator tools definitions

import { UnitConverterToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { createPipeToolContract } from "../lib/pipes/tool-contract";
import { wasmWrapper } from "../lib/wasm";
import type { Tool, ToolGroup } from "../types";

const unitGroups = [
  ["bit", "byte", "kb", "mb", "gb", "tb", "pb"],
  ["ns", "us", "ms", "s", "min", "h", "day", "week"],
  ["mm", "cm", "m", "km", "in", "ft", "yd", "mi"],
  ["c", "f", "k"],
];

const unitOptions = unitGroups.flat();

const unitConverterToolDefinition: ToolDefinition = {
  id: "calculator-unit-converter",
  name: "Unit Converter",
  description: "Convert between units of bytes, time, length, and temperature",
  category: "calculator",
  aliases: ["convert", "units", "conversion", "calculator"],
  pipe: createPipeToolContract({
    input: { kind: "transform", key: "value" },
    config: [
      {
        id: "fromUnit",
        name: "From unit",
        type: "select",
        defaultValue: "byte",
        description: "Unit of the incoming numeric value",
        options: unitOptions,
      },
      {
        id: "toUnit",
        name: "To unit",
        type: "select",
        defaultValue: "kb",
        description: "Unit to convert the incoming value to",
        options: unitOptions,
      },
    ],
    constraints: [
      {
        rule: "sameOptionGroup",
        fields: ["fromUnit", "toUnit"],
        groups: unitGroups,
        field: "toUnit",
        message: "From unit and to unit must use the same unit category",
      },
    ],
  }),
  component: UnitConverterToolComponent,
  operation: (inputs) => {
    const value = Number(inputs.value);
    const fromUnit = String(inputs.fromUnit);
    const toUnit = String(inputs.toUnit);

    // Validate inputs (allow 0 as valid value)
    if (
      Number.isNaN(value) ||
      inputs.value === undefined ||
      inputs.value === ""
    ) {
      return { success: true, result: "" };
    }

    if (!fromUnit || !toUnit) {
      return { success: true, result: "" };
    }

    // Call WASM conversion (now returns pre-formatted string)
    return wasmWrapper.convert(value, fromUnit, toUnit);
  },
};

export const unitConverterTool: Tool = {
  id: unitConverterToolDefinition.id,
  name: unitConverterToolDefinition.name,
  description: unitConverterToolDefinition.description,
  category: unitConverterToolDefinition.category,
  aliases: unitConverterToolDefinition.aliases,
  operation: (inputs) => unitConverterToolDefinition.operation(inputs),
};

export const calculatorToolsGroup: ToolGroup = {
  category: "calculator",
  name: "Calculator",
  description: "Unit conversion and calculation utilities",
  icon: CATEGORY_ICONS.calculator || "⚡",
  tools: [unitConverterTool],
};

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [unitConverterToolDefinition.id]: unitConverterToolDefinition,
};
