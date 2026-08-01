import type { ToolCategory, ToolOption } from "../../types";

export interface PipeListItemView {
  id: string;
  name: string;
  updatedAt: string;
  isRunnable: boolean;
}

export interface PipeStepView {
  id: string;
  toolId: string;
  toolName: string;
  toolVersion: number;
  config: Record<string, unknown>;
  options: ToolOption[];
  summary: string[];
  unavailableReason?: string;
}

export interface PipeToolView {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
  category: ToolCategory;
  isSource: boolean;
  toolVersion: number;
  options: ToolOption[];
  defaults: Record<string, unknown>;
}

export interface PipeValidationView {
  form?: string[];
  name?: string;
  steps?: Record<
    string,
    { messages: string[]; fields: Record<string, string> }
  >;
}

export type PipeRunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; durationMs: number }
  | {
      status: "error";
      message: string;
      stepId?: string;
      stepName?: string;
      stepIndex?: number;
    };
