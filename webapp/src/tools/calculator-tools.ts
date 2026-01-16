// Calculator tools definitions

import { UnitConverterToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { wasmWrapper } from "../lib/wasm";
import type { Tool, ToolGroup } from "../types";

const unitConverterToolDefinition: ToolDefinition = {
  id: "calculator-unit-converter",
  name: "Unit Converter",
  description: "Convert between units of bytes, time, length, and temperature",
  category: "calculator",
  aliases: ["convert", "units", "conversion", "calculator"],
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
