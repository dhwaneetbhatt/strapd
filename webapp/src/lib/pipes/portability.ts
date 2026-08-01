import { appConfig } from "../../config";
import { TOOL_REGISTRY } from "../../tools";
import { PipeRepositoryError } from "./errors";
import {
  migratePipeDocument,
  type PipeMigrationDiagnostic,
  PipeMigrationError,
} from "./migrations";
import {
  PIPE_DOCUMENT_SCHEMA_VERSION,
  type Pipe,
  type PipeDocument,
} from "./types";
import { deepCloneJson } from "./utils";
import type { PipeRegistry } from "./validation";
import {
  validatePipeDocument,
  validatePipeDocumentStructure,
} from "./validation";

export const MAX_PIPE_IMPORT_BYTES = appConfig.tools.maxInputSize;

export interface ParsedPipeImport {
  pipe: Pipe;
  diagnostics: PipeMigrationDiagnostic[];
}

export interface PipeImportFile {
  size: number;
  type?: string;
  text(): Promise<string>;
}

const defaultRegistry = TOOL_REGISTRY as PipeRegistry;

const byteLength = (value: string): number =>
  new TextEncoder().encode(value).length;

const firstIssueMessage = (
  issues: ReadonlyArray<{ message: string }>,
  fallback: string,
): string => issues[0]?.message ?? fallback;

export const createPipeDocument = (pipe: Pipe): PipeDocument => ({
  schemaVersion: PIPE_DOCUMENT_SCHEMA_VERSION,
  pipe: deepCloneJson(pipe),
});

export const serializePipeDocument = (pipe: Pipe, spacing = 2): string =>
  JSON.stringify(createPipeDocument(pipe), null, spacing);

export const pipeExportFilename = (pipe: Pipe): string => {
  const slug = pipe.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "strapd-pipe"}.strapd-pipe.json`;
};

export const downloadPipeDocument = (
  pipe: Pipe,
  filename = pipeExportFilename(pipe),
): void => {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new PipeRepositoryError(
      "write-failed",
      "Pipe downloads are unavailable in this environment.",
    );
  }

  const blob = new Blob([serializePipeDocument(pipe)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
};

export const parsePipeImport = (
  source: string,
  registry: PipeRegistry = defaultRegistry,
  maxBytes = MAX_PIPE_IMPORT_BYTES,
): ParsedPipeImport => {
  if (byteLength(source) > maxBytes) {
    throw new PipeRepositoryError(
      "import-too-large",
      `Pipe file exceeds the ${maxBytes}-byte size limit.`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new PipeRepositoryError(
      "invalid-import",
      "Pipe file is not valid JSON.",
      { cause: error },
    );
  }

  let migrated: ReturnType<typeof migratePipeDocument>;
  try {
    migrated = migratePipeDocument(parsed, (toolId) => registry[toolId]);
  } catch (error) {
    throw new PipeRepositoryError(
      error instanceof PipeMigrationError &&
        error.code === "unsupported-version"
        ? "unsupported-version"
        : "invalid-import",
      error instanceof Error
        ? error.message
        : "Pipe file could not be migrated.",
      { cause: error },
    );
  }

  const structure = validatePipeDocumentStructure(migrated.value);
  if (!structure.valid) {
    throw new PipeRepositoryError(
      "invalid-import",
      firstIssueMessage(
        structure.issues,
        "Pipe file has an invalid structure.",
      ),
    );
  }

  const validation = validatePipeDocument(migrated.value, registry);
  if (!validation.valid) {
    throw new PipeRepositoryError(
      "invalid-import",
      firstIssueMessage(validation.issues, "Pipe file is invalid."),
    );
  }

  const invalidMigration = migrated.diagnostics.find(
    ({ code }) => code === "config-invalid",
  );
  if (invalidMigration) {
    throw new PipeRepositoryError("invalid-import", invalidMigration.message);
  }

  return {
    pipe: deepCloneJson(migrated.value.pipe),
    diagnostics: migrated.diagnostics,
  };
};

export const readPipeImportFile = async (
  file: PipeImportFile,
  registry: PipeRegistry = defaultRegistry,
  maxBytes = MAX_PIPE_IMPORT_BYTES,
): Promise<ParsedPipeImport> => {
  if (file.size > maxBytes) {
    throw new PipeRepositoryError(
      "import-too-large",
      `Pipe file exceeds the ${maxBytes}-byte size limit.`,
    );
  }
  if (
    file.type &&
    file.type !== "application/json" &&
    file.type !== "text/json" &&
    !file.type.endsWith("+json")
  ) {
    throw new PipeRepositoryError(
      "invalid-import",
      "Pipe file must use a JSON content type.",
    );
  }

  let source: string;
  try {
    source = await file.text();
  } catch (error) {
    throw new PipeRepositoryError(
      "invalid-import",
      "Pipe file could not be read.",
      { cause: error },
    );
  }
  return parsePipeImport(source, registry, maxBytes);
};
