import type { PipeToolContract } from "../../types";
import {
  type JsonObject,
  PIPE_COLLECTION_SCHEMA_VERSION,
  PIPE_DOCUMENT_SCHEMA_VERSION,
  type Pipe,
  type PipeCollection,
  type PipeDocument,
} from "./types";
import { deepCloneJson } from "./utils";
import {
  validatePipeCollectionStructure,
  validatePipeDocumentStructure,
} from "./validation";

export class PipeMigrationError extends Error {
  constructor(
    readonly code: "invalid-data" | "unsupported-version",
    message: string,
  ) {
    super(message);
    this.name = "PipeMigrationError";
  }
}

export interface PipeMigrationDiagnostic {
  code: "tool-unavailable" | "tool-version-unsupported" | "config-invalid";
  message: string;
  stepId: string;
  stepIndex: number;
  toolId: string;
}

export interface PipeMigrationResult<T> {
  value: T;
  diagnostics: PipeMigrationDiagnostic[];
}

export interface PipeMigrationTool {
  id: string;
  name?: string;
  pipe?: PipeToolContract;
}

export type PipeToolResolver = (
  toolId: string,
) => PipeMigrationTool | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireVersion = (
  value: Record<string, unknown>,
  currentVersion: number,
  label: string,
): number => {
  const version = value.schemaVersion;
  if (!Number.isInteger(version) || (version as number) < 0) {
    throw new PipeMigrationError(
      "invalid-data",
      `${label} does not contain a valid schema version.`,
    );
  }
  if ((version as number) > currentVersion) {
    throw new PipeMigrationError(
      "unsupported-version",
      `${label} schema version ${String(version)} is newer than supported version ${currentVersion}.`,
    );
  }
  return version as number;
};

const migrateDocumentEnvelope = (input: unknown): unknown => {
  if (!isRecord(input)) {
    throw new PipeMigrationError(
      "invalid-data",
      "Pipe document must be a JSON object.",
    );
  }

  let working = structuredClone(input);
  let version = requireVersion(
    working,
    PIPE_DOCUMENT_SCHEMA_VERSION,
    "Pipe document",
  );

  while (version < PIPE_DOCUMENT_SCHEMA_VERSION) {
    if (version === 0) {
      working = { ...working, schemaVersion: 1 };
      version = 1;
      continue;
    }
    throw new PipeMigrationError(
      "unsupported-version",
      `No pipe document migration exists for version ${version}.`,
    );
  }

  return working;
};

const migrateCollectionEnvelope = (input: unknown): unknown => {
  if (!isRecord(input)) {
    throw new PipeMigrationError(
      "invalid-data",
      "Pipe collection must be a JSON object.",
    );
  }

  let working = structuredClone(input);
  let version = requireVersion(
    working,
    PIPE_COLLECTION_SCHEMA_VERSION,
    "Pipe collection",
  );

  while (version < PIPE_COLLECTION_SCHEMA_VERSION) {
    if (version === 0) {
      working = { ...working, schemaVersion: 1 };
      version = 1;
      continue;
    }
    throw new PipeMigrationError(
      "unsupported-version",
      `No pipe collection migration exists for version ${version}.`,
    );
  }

  return working;
};

const migrateToolConfigurations = (
  pipe: Pipe,
  resolveTool: PipeToolResolver,
): PipeMigrationResult<Pipe> => {
  const migrated = deepCloneJson(pipe);
  const diagnostics: PipeMigrationDiagnostic[] = [];

  migrated.steps.forEach((step, stepIndex) => {
    const tool = resolveTool(step.toolId);
    const contract = tool?.pipe;

    if (!tool || !contract) {
      diagnostics.push({
        code: "tool-unavailable",
        message: `Tool “${step.toolId}” is not available for pipes.`,
        stepId: step.id,
        stepIndex,
        toolId: step.toolId,
      });
      return;
    }

    if (step.toolVersion > contract.version) {
      diagnostics.push({
        code: "tool-version-unsupported",
        message: `Tool “${tool.name ?? step.toolId}” uses contract version ${step.toolVersion}, but this app supports version ${contract.version}.`,
        stepId: step.id,
        stepIndex,
        toolId: step.toolId,
      });
      return;
    }

    if (step.toolVersion < contract.version) {
      if (!contract.migrateConfig) {
        diagnostics.push({
          code: "tool-version-unsupported",
          message: `Tool “${tool.name ?? step.toolId}” cannot migrate contract version ${step.toolVersion} to ${contract.version}.`,
          stepId: step.id,
          stepIndex,
          toolId: step.toolId,
        });
        return;
      }

      const result = contract.migrateConfig(step.toolVersion, step.config);
      if (!result.success || !result.config) {
        diagnostics.push({
          code: "tool-version-unsupported",
          message:
            result.error ??
            `Tool “${tool.name ?? step.toolId}” could not migrate its saved configuration.`,
          stepId: step.id,
          stepIndex,
          toolId: step.toolId,
        });
        return;
      }
      step.config = deepCloneJson(result.config as JsonObject);
      step.toolVersion = contract.version;
    }

    const validation = contract.validateConfig(step.config);
    if (!validation.valid) {
      diagnostics.push({
        code: "config-invalid",
        message:
          validation.issues[0]?.message ??
          `Tool “${tool.name ?? step.toolId}” has invalid saved configuration.`,
        stepId: step.id,
        stepIndex,
        toolId: step.toolId,
      });
    }
  });

  return { value: migrated, diagnostics };
};

export const migratePipeDocument = (
  input: unknown,
  resolveTool: PipeToolResolver,
): PipeMigrationResult<PipeDocument> => {
  const envelope = migrateDocumentEnvelope(input);
  const structure = validatePipeDocumentStructure(envelope);
  if (!structure.valid) {
    throw new PipeMigrationError(
      "invalid-data",
      structure.issues[0]?.message ?? "Pipe document has an invalid structure.",
    );
  }
  const document = envelope as PipeDocument;
  const migrated = migrateToolConfigurations(document.pipe, resolveTool);
  return {
    value: {
      schemaVersion: PIPE_DOCUMENT_SCHEMA_VERSION,
      pipe: migrated.value,
    },
    diagnostics: migrated.diagnostics,
  };
};

export const migratePipeCollection = (
  input: unknown,
  resolveTool: PipeToolResolver,
): PipeMigrationResult<PipeCollection> => {
  const envelope = migrateCollectionEnvelope(input);
  const structure = validatePipeCollectionStructure(envelope);
  if (!structure.valid) {
    throw new PipeMigrationError(
      "invalid-data",
      structure.issues[0]?.message ??
        "Pipe collection has an invalid structure.",
    );
  }
  const collection = envelope as PipeCollection;
  const diagnostics: PipeMigrationDiagnostic[] = [];
  const pipes = collection.pipes.map((pipe) => {
    const migrated = migrateToolConfigurations(pipe, resolveTool);
    diagnostics.push(...migrated.diagnostics);
    return migrated.value;
  });

  return {
    value: { schemaVersion: PIPE_COLLECTION_SCHEMA_VERSION, pipes },
    diagnostics,
  };
};
