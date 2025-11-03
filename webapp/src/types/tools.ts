// Tool category types
export type ToolCategory =
  | "string"
  | "encoding"
  | "security"
  | "dataFormats"
  | "identifiers"
  | "datetime"
  | "random";

// Tool operation result
export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

// Tool operation function type
export type ToolOperation = (
  input: string,
  options?: Record<string, unknown>,
) => ToolResult | Promise<ToolResult>;

// Tool definition interface
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  aliases?: string[];
  operation: ToolOperation;
  options?: ToolOption[];
  examples?: ToolExample[];
}

// Tool option for configuration
export interface ToolOption {
  id: string;
  name: string;
  type: "boolean" | "string" | "number" | "select";
  defaultValue: string | number | boolean;
  description: string;
  options?: string[]; // For select type
}

// Tool example
export interface ToolExample {
  name: string;
  input: string;
  expectedOutput: string;
  options?: Record<string, unknown>;
}

// Tool group for organization
export interface ToolGroup {
  category: ToolCategory;
  name: string;
  description: string;
  icon: string;
  tools: Tool[];
}
