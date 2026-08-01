import { getPipeToolById } from "../../tools";
import type { PipeToolContract, ToolOperation, ToolResult } from "../../types";
import type { Pipe, PipeExecutionFailure, PipeExecutionResult } from "./types";
import { deepCloneJson } from "./utils";

export interface PipeExecutableTool {
  id: string;
  name: string;
  operation: ToolOperation;
  pipe?: PipeToolContract;
}

export type PipeExecutionToolResolver = (
  toolId: string,
) => PipeExecutableTool | undefined;

const fail = (
  failure: PipeExecutionFailure,
): Extract<PipeExecutionResult, { success: false }> => ({
  success: false,
  failure,
});

export const executePipe = async (
  pipe: Pipe,
  initialInput?: string,
  resolveTool: PipeExecutionToolResolver = getPipeToolById,
): Promise<PipeExecutionResult> => {
  if (!pipe.steps.length) {
    return fail({ code: "invalid-pipe", message: "Pipe has no steps." });
  }

  let currentValue = initialInput;

  for (const [stepIndex, step] of pipe.steps.entries()) {
    const failureContext = {
      stepId: step.id,
      stepIndex,
      toolId: step.toolId,
    };
    const tool = resolveTool(step.toolId);

    if (!tool) {
      return fail({
        ...failureContext,
        code: "tool-unavailable",
        message: `Tool “${step.toolId}” is unavailable.`,
      });
    }

    const contract = tool.pipe;
    if (!contract) {
      return fail({
        ...failureContext,
        code: "tool-not-pipe-compatible",
        message: `Tool “${tool.name}” is not compatible with pipes.`,
      });
    }

    if (contract.version !== step.toolVersion) {
      return fail({
        ...failureContext,
        code: "unsupported-tool-version",
        message: `Tool “${tool.name}” requires contract version ${contract.version}; this step was saved with version ${step.toolVersion}.`,
      });
    }

    if (contract.input.kind === "source" && stepIndex !== 0) {
      return fail({
        ...failureContext,
        code: "invalid-pipe",
        message: `Source tool “${tool.name}” can only be the first step.`,
      });
    }

    const configValidation = contract.validateConfig(step.config);
    if (!configValidation.valid) {
      return fail({
        ...failureContext,
        code: "invalid-pipe",
        message:
          configValidation.issues[0]?.message ??
          `Tool “${tool.name}” has invalid saved configuration.`,
      });
    }

    const inputs: Record<string, unknown> = deepCloneJson(step.config);
    if (contract.input.kind === "transform") {
      if (currentValue === undefined) {
        return fail({
          ...failureContext,
          code: "input-required",
          message: `Pipe requires input for “${tool.name}”.`,
        });
      }
      inputs[contract.input.key] = currentValue;
    }

    let result: ToolResult;
    try {
      result = await tool.operation(inputs);
    } catch (error) {
      return fail({
        ...failureContext,
        code: "operation-threw",
        message:
          error instanceof Error
            ? error.message
            : `Tool “${tool.name}” threw an unexpected error.`,
      });
    }

    if (!result.success) {
      return fail({
        ...failureContext,
        code: "operation-failed",
        message: result.error ?? `Tool “${tool.name}” failed.`,
      });
    }

    const output = (result as Record<string, unknown>)[contract.output.key];
    if (output === undefined) {
      return fail({
        ...failureContext,
        code: "missing-output",
        message: `Tool “${tool.name}” did not return its declared “${contract.output.key}” output.`,
      });
    }
    if (typeof output !== "string") {
      return fail({
        ...failureContext,
        code: "non-string-output",
        message: `Tool “${tool.name}” returned a non-string “${contract.output.key}” output.`,
      });
    }

    currentValue = output;
  }

  return { success: true, output: currentValue ?? "" };
};
