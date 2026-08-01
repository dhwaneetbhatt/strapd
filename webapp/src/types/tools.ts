// Tool category types
export type ToolCategory =
  | "string"
  | "encoding"
  | "security"
  | "dataFormats"
  | "identifiers"
  | "datetime"
  | "random"
  | "calculator"
  | "favorites";

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

export type PipeJsonPrimitive = string | number | boolean | null;

export type PipeJsonValue =
  | PipeJsonPrimitive
  | PipeJsonValue[]
  | { [key: string]: PipeJsonValue };

export type PipeJsonObject = { [key: string]: PipeJsonValue };

export interface PipeConfigValidationIssue {
  field?: string;
  message: string;
}

export type PipeConfigValidation =
  | { valid: true }
  | { valid: false; issues: PipeConfigValidationIssue[] };

export type PipeConfigMigration =
  | { success: true; config: PipeJsonObject; error?: never }
  | { success: false; error: string; config?: never };

export type PipeToolInput =
  | { kind: "source" }
  | { kind: "transform"; key: string };

export type ToolOptionValidation =
  | { rule: "integer"; safe?: boolean; message?: string }
  | {
      rule: "stringLength";
      min?: number;
      max?: number;
      message?: string;
    };

export type PipeConfigConstraint =
  | {
      rule: "numberOrder";
      lower: string;
      upper: string;
      field?: string;
      message?: string;
    }
  | {
      rule: "sameOptionGroup";
      fields: string[];
      groups: string[][];
      field?: string;
      message?: string;
    }
  | {
      rule: "minimumTruthy";
      fields: string[];
      minimum: number;
      field?: string;
      message?: string;
    }
  | {
      rule: "numberAtLeastTruthyCount";
      numberField: string;
      fields: string[];
      field?: string;
      message?: string;
    };

export interface PipeToolContract {
  version: number;
  input: PipeToolInput;
  output: { key: string };
  config: ToolOption[];
  constraints?: PipeConfigConstraint[];
  defaults: PipeJsonObject;
  validateConfig: (config: unknown) => PipeConfigValidation;
  migrateConfig?: (fromVersion: number, config: unknown) => PipeConfigMigration;
}

// Tool definition
export interface Tool<T = object> {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  aliases?: string[];
  operation: ToolOperation<T>;
  pipe?: PipeToolContract;
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
  min?: number;
  max?: number;
  step?: number;
  validations?: ToolOptionValidation[];
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
