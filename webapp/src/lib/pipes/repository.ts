import { appConfig } from "../../config";
import { TOOL_REGISTRY } from "../../tools";
import { PipeRepositoryError } from "./errors";
import {
  migratePipeCollection,
  type PipeMigrationDiagnostic,
} from "./migrations";
import {
  type PipeImportFile,
  parsePipeImport,
  readPipeImportFile,
} from "./portability";
import {
  PIPE_COLLECTION_SCHEMA_VERSION,
  type Pipe,
  type PipeCollection,
  type PipeImportConflict,
  type PipeImportConflictResolution,
} from "./types";
import { createUuid, deepCloneJson } from "./utils";
import {
  type PipeRegistry,
  validatePipe,
  validatePipeCollection,
  validatePipeCollectionStructure,
} from "./validation";

export interface PipeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PipeRepositoryOptions {
  storage?: PipeStorage;
  storageKey?: string;
  registry?: PipeRegistry;
  createId?: () => string;
  now?: () => string;
}

export interface PipeRepositoryLoadResult {
  collection: PipeCollection;
  diagnostics: PipeMigrationDiagnostic[];
}

export type PreparedPipeImport =
  | {
      kind: "imported";
      pipe: Pipe;
      diagnostics: PipeMigrationDiagnostic[];
    }
  | {
      kind: "conflict";
      conflict: PipeImportConflict;
      diagnostics: PipeMigrationDiagnostic[];
    };

export interface PipeRepository {
  load(): PipeRepositoryLoadResult;
  list(): Pipe[];
  get(pipeId: string): Pipe | undefined;
  create(pipe: Pipe): Pipe;
  update(pipe: Pipe): Pipe;
  rename(pipeId: string, name: string): Pipe;
  duplicate(pipeId: string, name?: string): Pipe;
  delete(pipeId: string): void;
  createWorkingCopy(pipeOrId: Pipe | string): Pipe;
  saveWorkingCopy(pipe: Pipe): Pipe;
  prepareImport(source: string | PipeImportFile): Promise<PreparedPipeImport>;
  resolveImportConflict(
    conflict: PipeImportConflict,
    resolution: PipeImportConflictResolution,
  ): Pipe;
}

const emptyCollection = (): PipeCollection => ({
  schemaVersion: PIPE_COLLECTION_SCHEMA_VERSION,
  pipes: [],
});

const defaultStorage = (): PipeStorage => {
  if (typeof localStorage === "undefined") {
    throw new PipeRepositoryError(
      "read-failed",
      "Pipe storage is unavailable in this environment.",
    );
  }
  return localStorage;
};

const firstIssue = (
  issues: ReadonlyArray<{ message: string }>,
  fallback: string,
): string => issues[0]?.message ?? fallback;

export const duplicatePipe = (
  pipe: Pipe,
  options: {
    name?: string;
    createId?: () => string;
    now?: () => string;
  } = {},
): Pipe => {
  const createId = options.createId ?? createUuid;
  const timestamp = (options.now ?? (() => new Date().toISOString()))();
  return {
    ...deepCloneJson(pipe),
    id: createId(),
    name: options.name?.trim() || `${pipe.name} copy`,
    createdAt: timestamp,
    updatedAt: timestamp,
    steps: pipe.steps.map((step) => ({
      ...deepCloneJson(step),
      id: createId(),
    })),
  };
};

export const createPipeWorkingCopy = (pipe: Pipe): Pipe => deepCloneJson(pipe);

export const discardPipeWorkingCopy = (): undefined => undefined;

export const createPipeRepository = (
  options: PipeRepositoryOptions = {},
): PipeRepository => {
  const storage = options.storage ?? defaultStorage();
  const storageKey = options.storageKey ?? appConfig.storage.pipes;
  const registry = options.registry ?? (TOOL_REGISTRY as PipeRegistry);
  const createId = options.createId ?? createUuid;
  const now = options.now ?? (() => new Date().toISOString());

  const read = (): PipeRepositoryLoadResult => {
    let serialized: string | null;
    try {
      serialized = storage.getItem(storageKey);
    } catch (error) {
      throw new PipeRepositoryError(
        "read-failed",
        "Saved pipes could not be read from local storage.",
        { cause: error },
      );
    }

    if (serialized === null) {
      return { collection: emptyCollection(), diagnostics: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch (error) {
      throw new PipeRepositoryError(
        "corrupt-storage",
        "Saved pipe data is not valid JSON.",
        { cause: error },
      );
    }

    let migrated: ReturnType<typeof migratePipeCollection>;
    try {
      migrated = migratePipeCollection(parsed, (toolId) => registry[toolId]);
    } catch (error) {
      throw new PipeRepositoryError(
        "corrupt-storage",
        error instanceof Error
          ? error.message
          : "Saved pipe data could not be migrated.",
        { cause: error },
      );
    }

    const structure = validatePipeCollectionStructure(migrated.value);
    if (!structure.valid) {
      throw new PipeRepositoryError(
        "corrupt-storage",
        firstIssue(
          structure.issues,
          "Saved pipe data has an invalid structure.",
        ),
      );
    }
    const validation = validatePipeCollection(migrated.value, registry);
    if (!validation.valid) {
      throw new PipeRepositoryError(
        "corrupt-storage",
        firstIssue(validation.issues, "Saved pipe data is invalid."),
      );
    }
    const invalidMigration = migrated.diagnostics.find(
      ({ code }) => code === "config-invalid",
    );
    if (invalidMigration) {
      throw new PipeRepositoryError(
        "corrupt-storage",
        invalidMigration.message,
      );
    }

    return {
      collection: deepCloneJson(migrated.value),
      diagnostics: migrated.diagnostics,
    };
  };

  const write = (collection: PipeCollection): void => {
    const validation = validatePipeCollection(collection, registry);
    if (!validation.valid) {
      throw new PipeRepositoryError(
        "invalid-pipe",
        firstIssue(validation.issues, "Pipe collection is invalid."),
      );
    }

    const serialized = JSON.stringify(collection);
    try {
      storage.setItem(storageKey, serialized);
    } catch (error) {
      throw new PipeRepositoryError(
        "write-failed",
        "Pipe changes could not be saved to local storage.",
        { cause: error },
      );
    }
  };

  const requirePipe = (pipeId: string): Pipe => {
    const pipe = read().collection.pipes.find(({ id }) => id === pipeId);
    if (!pipe) {
      throw new PipeRepositoryError(
        "not-found",
        `Saved pipe “${pipeId}” was not found.`,
      );
    }
    return pipe;
  };

  const saveCandidate = (
    candidate: Pipe,
    mode: "create" | "update" | "import",
  ): Pipe => {
    const current = read().collection;
    const existingIndex = current.pipes.findIndex(
      ({ id }) => id === candidate.id,
    );
    if (mode !== "update" && existingIndex >= 0) {
      throw new PipeRepositoryError(
        "import-conflict",
        `A pipe with id “${candidate.id}” already exists.`,
      );
    }
    if (mode === "update" && existingIndex < 0) {
      throw new PipeRepositoryError(
        "not-found",
        `Saved pipe “${candidate.id}” was not found.`,
      );
    }

    const saved = deepCloneJson(candidate);
    const validation = validatePipe(saved, registry);
    if (!validation.valid || (mode !== "import" && !validation.runnable)) {
      throw new PipeRepositoryError(
        "invalid-pipe",
        firstIssue(validation.issues, "Pipe is invalid."),
      );
    }

    const next = deepCloneJson(current);
    if (existingIndex >= 0) {
      next.pipes[existingIndex] = saved;
    } else {
      next.pipes.push(saved);
    }
    write(next);
    return deepCloneJson(saved);
  };

  return {
    load: read,
    list: () => read().collection.pipes.map(deepCloneJson),
    get: (pipeId) => {
      const pipe = read().collection.pipes.find(({ id }) => id === pipeId);
      return pipe ? deepCloneJson(pipe) : undefined;
    },
    create: (pipe) => saveCandidate(pipe, "create"),
    update: (pipe) => {
      const existing = requirePipe(pipe.id);
      return saveCandidate(
        {
          ...deepCloneJson(pipe),
          createdAt: existing.createdAt,
          updatedAt: now(),
        },
        "update",
      );
    },
    rename: (pipeId, name) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new PipeRepositoryError(
          "invalid-pipe",
          "Pipe name cannot be empty.",
        );
      }
      const current = read().collection;
      const index = current.pipes.findIndex(({ id }) => id === pipeId);
      if (index < 0) {
        throw new PipeRepositoryError(
          "not-found",
          `Saved pipe “${pipeId}” was not found.`,
        );
      }
      const renamed = {
        ...current.pipes[index],
        name: trimmedName,
        updatedAt: now(),
      };
      current.pipes[index] = renamed;
      write(current);
      return deepCloneJson(renamed);
    },
    duplicate: (pipeId, name) => {
      const copy = duplicatePipe(requirePipe(pipeId), { name, createId, now });
      return saveCandidate(copy, "import");
    },
    delete: (pipeId) => {
      const current = read().collection;
      const nextPipes = current.pipes.filter(({ id }) => id !== pipeId);
      if (nextPipes.length === current.pipes.length) {
        throw new PipeRepositoryError(
          "not-found",
          `Saved pipe “${pipeId}” was not found.`,
        );
      }
      write({ ...current, pipes: nextPipes });
    },
    createWorkingCopy: (pipeOrId) =>
      createPipeWorkingCopy(
        typeof pipeOrId === "string" ? requirePipe(pipeOrId) : pipeOrId,
      ),
    saveWorkingCopy: (pipe) => {
      const existing = requirePipe(pipe.id);
      return saveCandidate(
        {
          ...deepCloneJson(pipe),
          createdAt: existing.createdAt,
          updatedAt: now(),
        },
        "update",
      );
    },
    prepareImport: async (source) => {
      const parsed =
        typeof source === "string"
          ? parsePipeImport(source, registry)
          : await readPipeImportFile(source, registry);
      const existing = read().collection.pipes.find(
        ({ id }) => id === parsed.pipe.id,
      );
      if (existing) {
        return {
          kind: "conflict",
          conflict: {
            kind: "identity-conflict",
            existingPipe: deepCloneJson(existing),
            importedPipe: deepCloneJson(parsed.pipe),
          },
          diagnostics: parsed.diagnostics,
        };
      }
      return {
        kind: "imported",
        pipe: saveCandidate(parsed.pipe, "import"),
        diagnostics: parsed.diagnostics,
      };
    },
    resolveImportConflict: (conflict, resolution) => {
      const current = read().collection;
      const existingIndex = current.pipes.findIndex(
        ({ id }) => id === conflict.existingPipe.id,
      );
      if (existingIndex < 0) {
        throw new PipeRepositoryError(
          "not-found",
          "The local pipe involved in this import conflict no longer exists.",
        );
      }

      if (resolution === "copy") {
        return saveCandidate(
          duplicatePipe(conflict.importedPipe, { createId, now }),
          "import",
        );
      }

      const imported = deepCloneJson(conflict.importedPipe);
      current.pipes[existingIndex] = imported;
      write(current);
      return deepCloneJson(imported);
    },
  };
};
