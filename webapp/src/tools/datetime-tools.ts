// Datetime tools definitions

import { TimestampToolComponent } from "../components/tools";
import type { ToolDefinition } from "../components/tools/base-tool";
import { CATEGORY_ICONS } from "../constants/category-icons";
import { fromTimestamp, now } from "../lib/utils/datetime";
import type { Tool, ToolGroup } from "../types";

const timestampToolDefinition: ToolDefinition = {
  id: "datetime-timestamp",
  name: "Timestamp Converter",
  description: "Convert Unix timestamps to human readable",
  category: "datetime",
  aliases: ["timestamp", "date", "time", "now", "unix"],
  component: TimestampToolComponent,
  operation: (inputs) => {
    const isMillis = Boolean(inputs.isMillis);
    const format = (inputs.format as "Human" | "Iso") || "Human";

    if (inputs.useNow) {
      const nowResult = now(isMillis);
      return {
        success: nowResult.success,
        result: nowResult.result || "",
      };
    }

    if (!inputs.timestamp || String(inputs.timestamp).trim() === "") {
      return { success: true, result: "" };
    }

    const timestamp = Number(inputs.timestamp);
    if (Number.isNaN(timestamp)) {
      return { success: true, result: "" };
    }

    const result = fromTimestamp(timestamp, format, isMillis);
    return result;
  },
};

export const timestampTool: Tool = {
  id: timestampToolDefinition.id,
  name: timestampToolDefinition.name,
  description: timestampToolDefinition.description,
  category: timestampToolDefinition.category,
  aliases: timestampToolDefinition.aliases,
  operation: (inputs) => timestampToolDefinition.operation(inputs),
};

export const datetimeToolsGroup: ToolGroup = {
  category: "datetime",
  name: "Date & Time",
  description: "Date conversion and timestamp utilities",
  icon: CATEGORY_ICONS.datetime,
  tools: [timestampTool],
};

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  [timestampToolDefinition.id]: timestampToolDefinition,
};
