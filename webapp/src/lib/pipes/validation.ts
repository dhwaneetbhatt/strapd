import type { PipeToolContract } from "../../types";
import {
  PIPE_COLLECTION_SCHEMA_VERSION,
  PIPE_DOCUMENT_SCHEMA_VERSION,
  type Pipe,
  type PipeCollection,
  type PipeDocument,
  type PipeValidationIssue,
  type PipeValidationResult,
} from "./types";
import { isJsonValue, isUuid } from "./utils";

export interface PipeRegistryEntry {
  id: string;
  pipe?: PipeToolContract;
}

export type PipeRegistry = Readonly<Record<string, PipeRegistryEntry>>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype;

const issue = (
  code: PipeValidationIssue["code"],
  message: string,
  details: Partial<Omit<PipeValidationIssue, "code" | "message">> = {},
): PipeValidationIssue => ({
  code,
  severity: "error",
  message,
  ...details,
});

const resultFromIssues = (
  issues: PipeValidationIssue[],
): PipeValidationResult => {
  const hasErrors = issues.some(({ severity }) => severity === "error");
  return {
    valid: !hasErrors,
    runnable: issues.length === 0,
    issues,
  };
};

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const inspectPipeStructure = (
  value: unknown,
  path = "pipe",
): PipeValidationIssue[] => {
  if (!isPlainObject(value)) {
    return [issue("invalid-pipe", "Pipe must be an object", { path })];
  }

  const issues: PipeValidationIssue[] = [];
  if (!isUuid(value.id)) {
    issues.push(
      issue("invalid-pipe-id", "Pipe id must be a UUID", {
        path: `${path}.id`,
      }),
    );
  }
  if (typeof value.name !== "string") {
    issues.push(
      issue("invalid-pipe-name", "Pipe name must be text", {
        path: `${path}.name`,
      }),
    );
  }
  if (!isIsoTimestamp(value.createdAt)) {
    issues.push(
      issue("invalid-timestamp", "Created time must be an ISO timestamp", {
        path: `${path}.createdAt`,
      }),
    );
  }
  if (!isIsoTimestamp(value.updatedAt)) {
    issues.push(
      issue("invalid-timestamp", "Updated time must be an ISO timestamp", {
        path: `${path}.updatedAt`,
      }),
    );
  }
  if (!Array.isArray(value.steps)) {
    issues.push(
      issue("invalid-pipe", "Pipe steps must be an array", {
        path: `${path}.steps`,
      }),
    );
    return issues;
  }

  for (const [stepIndex, step] of value.steps.entries()) {
    const stepPath = `${path}.steps[${stepIndex}]`;
    if (!isPlainObject(step)) {
      issues.push(
        issue("invalid-step", "Pipe step must be an object", {
          path: stepPath,
          stepIndex,
        }),
      );
      continue;
    }

    const stepId = typeof step.id === "string" ? step.id : undefined;
    if (!isUuid(step.id)) {
      issues.push(
        issue("invalid-step-id", "Step id must be a UUID", {
          path: `${stepPath}.id`,
          stepId,
          stepIndex,
        }),
      );
    }
    if (typeof step.toolId !== "string" || step.toolId.trim() === "") {
      issues.push(
        issue("invalid-tool-id", "Step tool id must be non-empty text", {
          path: `${stepPath}.toolId`,
          stepId,
          stepIndex,
        }),
      );
    }
    if (!Number.isInteger(step.toolVersion) || Number(step.toolVersion) < 1) {
      issues.push(
        issue(
          "invalid-tool-version",
          "Step tool version must be a positive integer",
          {
            path: `${stepPath}.toolVersion`,
            stepId,
            stepIndex,
          },
        ),
      );
    }
    if (!isPlainObject(step.config) || !isJsonValue(step.config)) {
      issues.push(
        issue(
          "invalid-config",
          "Step configuration must be a JSON-safe object",
          {
            path: `${stepPath}.config`,
            stepId,
            stepIndex,
          },
        ),
      );
    }
  }

  return issues;
};

export const validatePipeStructure = (value: unknown): PipeValidationResult =>
  resultFromIssues(inspectPipeStructure(value));

export const isPipe = (value: unknown): value is Pipe =>
  validatePipeStructure(value).valid;

export const validatePipeDocumentStructure = (
  value: unknown,
): PipeValidationResult => {
  if (!isPlainObject(value)) {
    return resultFromIssues([
      issue("invalid-document", "Pipe document must be an object", {
        path: "document",
      }),
    ]);
  }

  const issues: PipeValidationIssue[] = [];
  if (value.schemaVersion !== PIPE_DOCUMENT_SCHEMA_VERSION) {
    issues.push(
      issue(
        "unsupported-schema-version",
        `Unsupported pipe document schema version: ${String(value.schemaVersion)}`,
        { path: "document.schemaVersion" },
      ),
    );
  }
  issues.push(...inspectPipeStructure(value.pipe));
  return resultFromIssues(issues);
};

export const isPipeDocument = (value: unknown): value is PipeDocument =>
  validatePipeDocumentStructure(value).valid;

export const validatePipeCollectionStructure = (
  value: unknown,
): PipeValidationResult => {
  if (!isPlainObject(value)) {
    return resultFromIssues([
      issue("invalid-collection", "Pipe collection must be an object", {
        path: "collection",
      }),
    ]);
  }

  const issues: PipeValidationIssue[] = [];
  if (value.schemaVersion !== PIPE_COLLECTION_SCHEMA_VERSION) {
    issues.push(
      issue(
        "unsupported-schema-version",
        `Unsupported pipe collection schema version: ${String(value.schemaVersion)}`,
        { path: "collection.schemaVersion" },
      ),
    );
  }
  if (!Array.isArray(value.pipes)) {
    issues.push(
      issue("invalid-collection", "Collection pipes must be an array", {
        path: "collection.pipes",
      }),
    );
    return resultFromIssues(issues);
  }

  for (const [pipeIndex, pipe] of value.pipes.entries()) {
    issues.push(
      ...inspectPipeStructure(pipe, `collection.pipes[${pipeIndex}]`),
    );
  }

  return resultFromIssues(issues);
};

export const isPipeCollection = (value: unknown): value is PipeCollection =>
  validatePipeCollectionStructure(value).valid;

export const validatePipe = (
  pipe: Pipe,
  registry: PipeRegistry,
): PipeValidationResult => {
  const structural = validatePipeStructure(pipe);
  if (!structural.valid) {
    return structural;
  }

  const issues: PipeValidationIssue[] = [];
  if (pipe.name.trim() === "") {
    issues.push(
      issue("invalid-pipe-name", "Pipe name cannot be empty", {
        path: "pipe.name",
        pipeId: pipe.id,
      }),
    );
  }
  if (pipe.steps.length === 0) {
    issues.push(
      issue("empty-pipe", "Pipe must contain at least one step", {
        path: "pipe.steps",
        pipeId: pipe.id,
      }),
    );
  }

  const stepIds = new Set<string>();
  for (const [stepIndex, step] of pipe.steps.entries()) {
    const details = {
      path: `pipe.steps[${stepIndex}]`,
      pipeId: pipe.id,
      stepId: step.id,
      stepIndex,
    };

    if (stepIds.has(step.id)) {
      issues.push(
        issue("duplicate-step-id", "Step ids must be unique within a pipe", {
          ...details,
          path: `${details.path}.id`,
        }),
      );
    }
    stepIds.add(step.id);

    const tool = registry[step.toolId];
    if (!tool) {
      issues.push({
        ...issue(
          "tool-unavailable",
          `Tool is unavailable: ${step.toolId}`,
          details,
        ),
        severity: "compatibility",
      });
      continue;
    }
    if (!tool.pipe) {
      issues.push({
        ...issue(
          "tool-not-pipe-compatible",
          `Tool does not declare pipe compatibility: ${step.toolId}`,
          details,
        ),
        severity: "compatibility",
      });
      continue;
    }
    if (step.toolVersion !== tool.pipe.version) {
      issues.push({
        ...issue(
          "unsupported-tool-version",
          `Tool ${step.toolId} requires contract version ${tool.pipe.version}, but the step uses ${step.toolVersion}`,
          { ...details, path: `${details.path}.toolVersion` },
        ),
        severity: "compatibility",
      });
      continue;
    }
    if (tool.pipe.input.kind === "source" && stepIndex !== 0) {
      issues.push(
        issue(
          "source-position",
          "A source tool can only appear as the first pipe step",
          details,
        ),
      );
    }

    const configValidation = tool.pipe.validateConfig(step.config);
    if (!configValidation.valid) {
      for (const configIssue of configValidation.issues) {
        issues.push(
          issue("invalid-config", configIssue.message, {
            ...details,
            path: configIssue.field
              ? `${details.path}.config.${configIssue.field}`
              : `${details.path}.config`,
          }),
        );
      }
    }
  }

  return resultFromIssues(issues);
};

export const validatePipeDocument = (
  value: unknown,
  registry: PipeRegistry,
): PipeValidationResult => {
  const structural = validatePipeDocumentStructure(value);
  if (!structural.valid) {
    return structural;
  }

  return validatePipe((value as PipeDocument).pipe, registry);
};

export const validatePipeCollection = (
  value: unknown,
  registry: PipeRegistry,
): PipeValidationResult => {
  const structural = validatePipeCollectionStructure(value);
  if (!structural.valid) {
    return structural;
  }

  const collection = value as PipeCollection;
  const issues: PipeValidationIssue[] = [];
  const pipeIds = new Set<string>();
  for (const [pipeIndex, pipe] of collection.pipes.entries()) {
    if (pipeIds.has(pipe.id)) {
      issues.push(
        issue("duplicate-pipe-id", "Pipe ids must be unique in a collection", {
          path: `collection.pipes[${pipeIndex}].id`,
          pipeId: pipe.id,
        }),
      );
    }
    pipeIds.add(pipe.id);
    issues.push(...validatePipe(pipe, registry).issues);
  }

  return resultFromIssues(issues);
};
