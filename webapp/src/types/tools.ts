// Tool category types
export type ToolCategory =
  | "string"
  | "encoding"
  | "security"
  | "dataFormats"
  | "identifiers"
  | "datetime"
  | "random";

// Tool operation result - generic type for type-safe tool outputs
export type ToolResult<T = object> = {
  success: boolean;
  result?: string;
  error?: string;
} & T;

// Tool operation function type
export type ToolOperation<T = object> = (
  inputs: Record<string, unknown>,
) => ToolResult<T> | Promise<ToolResult<T>>;

// Tool definition
export interface Tool<T = object> {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  aliases?: string[];
  operation: ToolOperation<T>;
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
