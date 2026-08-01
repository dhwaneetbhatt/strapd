import type { PipeJsonObject, PipeJsonValue } from "../../types";

export const PIPE_DOCUMENT_SCHEMA_VERSION = 1 as const;
export const PIPE_COLLECTION_SCHEMA_VERSION = 1 as const;
export const PIPE_TOOL_CONTRACT_VERSION = 1 as const;

export type JsonValue = PipeJsonValue;
export type JsonObject = PipeJsonObject;

export interface PipeStep {
  id: string;
  toolId: string;
  toolVersion: number;
  config: JsonObject;
}

export interface Pipe {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  steps: PipeStep[];
}

export interface PipeDocument {
  schemaVersion: typeof PIPE_DOCUMENT_SCHEMA_VERSION;
  pipe: Pipe;
}

export interface PipeCollection {
  schemaVersion: typeof PIPE_COLLECTION_SCHEMA_VERSION;
  pipes: Pipe[];
}

export type PipeStepCompatibility =
  | { status: "compatible" }
  | { status: "tool-unavailable"; toolId: string }
  | {
      status: "unsupported-tool-version";
      toolId: string;
      savedVersion: number;
      currentVersion: number;
    };

export type PipeValidationIssueSeverity = "error" | "compatibility";

export type PipeValidationIssueCode =
  | "invalid-document"
  | "unsupported-schema-version"
  | "invalid-collection"
  | "invalid-pipe"
  | "invalid-pipe-id"
  | "invalid-pipe-name"
  | "invalid-timestamp"
  | "empty-pipe"
  | "invalid-step"
  | "invalid-step-id"
  | "duplicate-step-id"
  | "invalid-tool-id"
  | "invalid-tool-version"
  | "invalid-config"
  | "duplicate-pipe-id"
  | "source-position"
  | "tool-unavailable"
  | "tool-not-pipe-compatible"
  | "unsupported-tool-version";

export interface PipeValidationIssue {
  code: PipeValidationIssueCode;
  severity: PipeValidationIssueSeverity;
  message: string;
  path?: string;
  pipeId?: string;
  stepId?: string;
  stepIndex?: number;
}

export interface PipeValidationResult {
  valid: boolean;
  runnable: boolean;
  issues: PipeValidationIssue[];
}

export type PipeExecutionFailureCode =
  | "invalid-pipe"
  | "input-required"
  | "tool-unavailable"
  | "tool-not-pipe-compatible"
  | "unsupported-tool-version"
  | "operation-failed"
  | "operation-threw"
  | "missing-output"
  | "non-string-output";

export interface PipeExecutionFailure {
  code: PipeExecutionFailureCode;
  message: string;
  stepId?: string;
  stepIndex?: number;
  toolId?: string;
}

export type PipeExecutionResult =
  | { success: true; output: string }
  | { success: false; failure: PipeExecutionFailure };

export interface PipeImportConflict {
  kind: "identity-conflict";
  existingPipe: Pipe;
  importedPipe: Pipe;
}

export type PipeImportConflictResolution = "replace" | "copy";
