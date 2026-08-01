import { describe, expect, it } from "vitest";
import type { PipeToolContract } from "../../types";
import { PipeRepositoryError } from "./errors";
import { parsePipeImport, serializePipeDocument } from "./portability";
import {
  createPipeRepository,
  createPipeWorkingCopy,
  duplicatePipe,
  type PipeStorage,
} from "./repository";
import type { Pipe, PipeCollection } from "./types";
import type { PipeRegistry } from "./validation";

const ids = {
  pipe: "11111111-1111-4111-8111-111111111111",
  step: "22222222-2222-4222-8222-222222222222",
  copyPipe: "33333333-3333-4333-8333-333333333333",
  copyStep: "44444444-4444-4444-8444-444444444444",
};

class MemoryStorage implements PipeStorage {
  value: string | null = null;
  failReads = false;
  failWrites = false;

  getItem(): string | null {
    if (this.failReads) throw new Error("read blocked");
    return this.value;
  }

  setItem(_key: string, value: string): void {
    if (this.failWrites) throw new Error("quota exceeded");
    this.value = value;
  }
}

const contract = (version = 1): PipeToolContract => ({
  version,
  input: { kind: "transform", key: "text" },
  output: { key: "result" },
  config: [],
  defaults: {},
  validateConfig: (config) =>
    typeof config === "object" && config !== null
      ? { valid: true }
      : { valid: false, issues: [{ message: "Config must be an object" }] },
});

const registry: PipeRegistry = {
  transform: { id: "transform", pipe: contract() },
};

const pipe = (overrides: Partial<Pipe> = {}): Pipe => ({
  id: ids.pipe,
  name: "Portable pipe",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  steps: [
    {
      id: ids.step,
      toolId: "transform",
      toolVersion: 1,
      config: { mode: "frozen" },
    },
  ],
  ...overrides,
});

describe("pipe repository", () => {
  it("persists CRUD changes across repository reloads with stable edit identities", () => {
    const storage = new MemoryStorage();
    const timestamps = ["2026-08-01T01:00:00.000Z", "2026-08-01T02:00:00.000Z"];
    const repository = createPipeRepository({
      storage,
      registry,
      now: () => timestamps.shift() ?? "2026-08-01T03:00:00.000Z",
    });

    repository.create(pipe());
    const renamed = repository.rename(ids.pipe, "Renamed");
    const workingCopy = repository.createWorkingCopy(ids.pipe);
    workingCopy.steps[0].config = { mode: "edited" };
    const saved = repository.saveWorkingCopy(workingCopy);

    expect(renamed.id).toBe(ids.pipe);
    expect(saved.id).toBe(ids.pipe);
    expect(saved.steps[0].id).toBe(ids.step);
    expect(
      createPipeRepository({ storage, registry }).get(ids.pipe),
    ).toMatchObject({
      name: "Renamed",
      steps: [{ id: ids.step, config: { mode: "edited" } }],
    });

    repository.delete(ids.pipe);
    expect(repository.list()).toEqual([]);
  });

  it("keeps storage authoritative when a write fails", () => {
    const storage = new MemoryStorage();
    const repository = createPipeRepository({ storage, registry });
    repository.create(pipe());
    const persisted = storage.value;
    storage.failWrites = true;

    expect(() => repository.rename(ids.pipe, "Not saved")).toThrowError(
      expect.objectContaining({ code: "write-failed" }),
    );
    expect(storage.value).toBe(persisted);
    storage.failWrites = false;
    expect(repository.get(ids.pipe)?.name).toBe("Portable pipe");
  });

  it("returns typed failures for corrupt or unreadable storage", () => {
    const storage = new MemoryStorage();
    storage.value = "not json";
    const repository = createPipeRepository({ storage, registry });
    expect(() => repository.load()).toThrowError(
      expect.objectContaining({ code: "corrupt-storage" }),
    );

    storage.failReads = true;
    expect(() => repository.load()).toThrowError(
      expect.objectContaining({ code: "read-failed" }),
    );
  });

  it("uses isolated working copies and regenerates every duplicate identity", () => {
    const original = pipe();
    const working = createPipeWorkingCopy(original);
    working.name = "Unsaved";
    expect(original.name).toBe("Portable pipe");

    const generated = [ids.copyPipe, ids.copyStep];
    const copy = duplicatePipe(original, {
      createId: () => generated.shift() ?? crypto.randomUUID(),
      now: () => "2026-08-02T00:00:00.000Z",
    });
    expect(copy.id).toBe(ids.copyPipe);
    expect(copy.steps[0].id).toBe(ids.copyStep);
    expect(copy.steps[0].config).toEqual(original.steps[0].config);
  });

  it("round-trips a single-pipe export without changing identity or config", () => {
    const original = pipe();
    const exported = serializePipeDocument(original);
    const imported = parsePipeImport(exported, registry);
    expect(imported.pipe).toEqual(original);
  });

  it("migrates older document and tool-contract versions with pure migrations", () => {
    const original = pipe({
      steps: [{ ...pipe().steps[0], toolVersion: 1, config: { legacy: true } }],
    });
    const migratingRegistry: PipeRegistry = {
      transform: {
        id: "transform",
        pipe: {
          ...contract(2),
          migrateConfig: (fromVersion, config) => ({
            success: true,
            config: { fromVersion, original: JSON.stringify(config) },
          }),
        },
      },
    };
    const legacy = { schemaVersion: 0, pipe: original };
    const imported = parsePipeImport(JSON.stringify(legacy), migratingRegistry);

    expect(imported.pipe.steps[0]).toMatchObject({
      toolVersion: 2,
      config: { fromVersion: 1 },
    });
    expect(legacy.pipe.steps[0]).toEqual(original.steps[0]);
  });

  it("rejects malformed and oversized imports without touching storage", async () => {
    const storage = new MemoryStorage();
    const repository = createPipeRepository({ storage, registry });
    repository.create(pipe());
    const persisted = storage.value;

    await expect(repository.prepareImport("{")).rejects.toMatchObject({
      code: "invalid-import",
    });
    await expect(
      repository.prepareImport(JSON.stringify({ schemaVersion: 1 })),
    ).rejects.toMatchObject({ code: "invalid-import" });
    await expect(
      repository.prepareImport(
        JSON.stringify({ schemaVersion: 999, pipe: pipe() }),
      ),
    ).rejects.toMatchObject({ code: "unsupported-version" });
    await expect(
      repository.prepareImport({
        size: 2_000_000,
        type: "application/json",
        text: async () => "{}",
      }),
    ).rejects.toMatchObject({ code: "import-too-large" });
    expect(storage.value).toBe(persisted);
  });

  it("requires explicit conflict resolution and supports replace or copy", async () => {
    const storage = new MemoryStorage();
    const generated = [ids.copyPipe, ids.copyStep];
    const repository = createPipeRepository({
      storage,
      registry,
      createId: () => generated.shift() ?? crypto.randomUUID(),
      now: () => "2026-08-02T00:00:00.000Z",
    });
    repository.create(pipe());
    const imported = pipe({ name: "Imported" });
    const before = storage.value;
    const prepared = await repository.prepareImport(
      serializePipeDocument(imported),
    );
    expect(prepared.kind).toBe("conflict");
    expect(storage.value).toBe(before);
    if (prepared.kind !== "conflict") throw new Error("Expected conflict");

    const copied = repository.resolveImportConflict(prepared.conflict, "copy");
    expect(copied.id).toBe(ids.copyPipe);
    expect(copied.steps[0].id).toBe(ids.copyStep);
    expect(repository.list()).toHaveLength(2);

    const replaced = repository.resolveImportConflict(
      prepared.conflict,
      "replace",
    );
    expect(replaced.id).toBe(ids.pipe);
    expect(replaced.name).toBe("Imported");
  });

  it("retains unavailable imported tools with diagnostics", async () => {
    const storage = new MemoryStorage();
    const repository = createPipeRepository({ storage, registry: {} });
    const prepared = await repository.prepareImport(
      serializePipeDocument(
        pipe({
          steps: [
            {
              ...pipe().steps[0],
              toolId: "missing-tool",
            },
          ],
        }),
      ),
    );

    expect(prepared.kind).toBe("imported");
    expect(prepared.diagnostics).toEqual([
      expect.objectContaining({
        code: "tool-unavailable",
        toolId: "missing-tool",
      }),
    ]);
    expect(repository.list()[0].steps[0].toolId).toBe("missing-tool");
  });

  it("loads older local collection envelopes", () => {
    const storage = new MemoryStorage();
    const legacy: Omit<PipeCollection, "schemaVersion"> & { schemaVersion: 0 } =
      {
        schemaVersion: 0,
        pipes: [pipe()],
      };
    storage.value = JSON.stringify(legacy);
    const repository = createPipeRepository({ storage, registry });
    expect(repository.load().collection).toMatchObject({
      schemaVersion: 1,
      pipes: [{ id: ids.pipe }],
    });
  });

  it("exposes repository errors as a discriminated class", () => {
    const error = new PipeRepositoryError("not-found", "missing");
    expect(error).toMatchObject({
      name: "PipeRepositoryError",
      code: "not-found",
      message: "missing",
    });
  });
});
