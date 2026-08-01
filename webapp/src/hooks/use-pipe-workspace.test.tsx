import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createPipeRepository,
  type executePipe,
  type Pipe,
  type PipeExecutionResult,
  type PipeStorage,
  serializePipeDocument,
} from "../lib/pipes";
import { usePipeWorkspace } from "./use-pipe-workspace";

const makeStorage = (): PipeStorage => {
  let value: string | null = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
  };
};

const savedPipe = (): Pipe => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Original pipe",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  steps: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      toolId: "string-reverse",
      toolVersion: 1,
      config: {},
    },
  ],
});

const secondSavedPipe = (): Pipe => ({
  ...savedPipe(),
  id: "33333333-3333-4333-8333-333333333333",
  name: "Second pipe",
  steps: [
    {
      ...savedPipe().steps[0],
      id: "44444444-4444-4444-8444-444444444444",
    },
  ],
});

const sourcePipe = (): Pipe => ({
  ...savedPipe(),
  id: "55555555-5555-4555-8555-555555555555",
  name: "Generate UUID",
  steps: [
    {
      id: "66666666-6666-4666-8666-666666666666",
      toolId: "identifier-uuid-generator",
      toolVersion: 1,
      config: { version: "v4", count: 1 },
    },
  ],
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe("usePipeWorkspace", () => {
  it("creates and saves a valid pipe through the repository", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    const { result } = renderHook(() => usePipeWorkspace(repository));

    act(() => result.current.startCreate());
    act(() => result.current.setSelectedToolId("string-reverse"));
    act(() => result.current.addStep());
    act(() => result.current.setDraftName("Reverse once"));

    let saved = false;
    act(() => {
      saved = result.current.saveEdit();
    });

    await waitFor(() => expect(result.current.mode).toBe("run"));
    expect(saved).toBe(true);
    expect(repository.list()).toHaveLength(1);
    expect(repository.list()[0].name).toBe("Reverse once");
  });

  it("keeps stable identities on save and discards cancelled edits", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    const { result } = renderHook(() => usePipeWorkspace(repository));

    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());
    act(() => result.current.startEdit());
    act(() => result.current.setDraftName("Discard this"));
    act(() => result.current.cancelEdit());
    expect(repository.get(savedPipe().id)?.name).toBe("Original pipe");

    act(() => result.current.startEdit());
    act(() => result.current.setDraftName("Renamed pipe"));
    act(() => {
      result.current.saveEdit();
    });

    const persisted = repository.get(savedPipe().id);
    expect(persisted?.name).toBe("Renamed pipe");
    expect(persisted?.id).toBe(savedPipe().id);
    expect(persisted?.steps[0].id).toBe(savedPipe().steps[0].id);
  });

  it("previews working-copy step edits while runs and storage stay saved", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    const persistedPipe = savedPipe();
    repository.create(persistedPipe);
    const executor = vi.fn<typeof executePipe>().mockResolvedValue({
      success: true,
      output: "saved result",
    });
    const { result } = renderHook(() => usePipeWorkspace(repository, executor));

    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());
    act(() => result.current.startEdit());
    act(() => result.current.setSelectedToolId("string-slugify"));
    act(() => result.current.addStep());

    const addedStep = result.current.workingCopy?.steps[1];
    expect(addedStep).toBeDefined();
    if (!addedStep) return;
    expect(result.current.steps.map(({ toolId }) => toolId)).toEqual([
      "string-reverse",
      "string-slugify",
    ]);

    act(() => result.current.changeConfig(addedStep.id, "separator", "_"));
    expect(result.current.steps[1].summary).toContain("Separator: _");

    act(() => result.current.moveStep(addedStep.id, -1));
    expect(result.current.steps.map(({ toolId }) => toolId)).toEqual([
      "string-slugify",
      "string-reverse",
    ]);

    act(() => result.current.removeStep(addedStep.id));
    expect(result.current.steps.map(({ toolId }) => toolId)).toEqual([
      "string-reverse",
    ]);

    act(() => result.current.setSelectedToolId("string-slugify"));
    act(() => result.current.addStep());
    expect(result.current.steps).toHaveLength(2);
    expect(repository.get(persistedPipe.id)).toEqual(persistedPipe);

    act(() => result.current.setInput("strapd"));
    await act(async () => result.current.run());

    expect(executor).toHaveBeenCalledWith(persistedPipe, "strapd");
    expect(repository.get(persistedPipe.id)).toEqual(persistedPipe);
  });

  it("uses one can-run decision for empty and supplied input", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    const { result } = renderHook(() => usePipeWorkspace(repository));

    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());
    expect(result.current.canRun).toBe(false);

    act(() => result.current.setInput("strapd"));
    expect(result.current.canRun).toBe(true);
  });

  it("keeps cleared numeric configuration JSON-safe and reports validation", () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    const { result } = renderHook(() => usePipeWorkspace(repository));

    act(() => result.current.startCreate());
    act(() => result.current.setSelectedToolId("random-number"));
    act(() => result.current.addStep());
    const stepId = result.current.workingCopy?.steps[0].id;
    expect(stepId).toBeDefined();
    if (!stepId) return;

    act(() => result.current.changeConfig(stepId, "count", ""));
    expect(result.current.steps[0].config.count).toBe("");
    act(() => {
      expect(result.current.saveEdit()).toBe(false);
    });
    expect(result.current.validation.steps?.[stepId]?.fields.count).toMatch(
      /must be a number/i,
    );
  });

  it("exposes and freezes the Case Converter output selector", () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    const { result } = renderHook(() => usePipeWorkspace(repository));

    act(() => result.current.startCreate());
    act(() => result.current.setSelectedToolId("string-case-converter"));
    act(() => result.current.addStep());

    const step = result.current.workingCopy?.steps[0];
    expect(step?.toolVersion).toBe(1);
    expect(step?.config).toEqual({ outputCase: "Uppercase" });
    expect(result.current.steps[0].options).toContainEqual(
      expect.objectContaining({
        id: "outputCase",
        options: ["Uppercase", "Lowercase", "Capital case"],
      }),
    );
    if (!step) return;

    act(() => result.current.changeConfig(step.id, "outputCase", "Lowercase"));
    expect(result.current.workingCopy?.steps[0].config).toEqual({
      outputCase: "Lowercase",
    });
  });

  it("exposes and freezes the Hash Generator algorithm selector", () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    const { result } = renderHook(() => usePipeWorkspace(repository));

    act(() => result.current.startCreate());
    act(() => result.current.setSelectedToolId("security-hash"));
    act(() => result.current.addStep());

    const step = result.current.workingCopy?.steps[0];
    expect(step?.toolVersion).toBe(1);
    expect(step?.config).toEqual({ algorithm: "MD5" });
    expect(result.current.steps[0].options).toContainEqual(
      expect.objectContaining({
        id: "algorithm",
        options: ["MD5", "SHA-1", "SHA-256", "SHA-512"],
      }),
    );
    if (!step) return;

    act(() => result.current.changeConfig(step.id, "algorithm", "SHA-512"));
    expect(result.current.workingCopy?.steps[0].config).toEqual({
      algorithm: "SHA-512",
    });
  });

  it("exposes and freezes the HMAC Generator algorithm selector", () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    const { result } = renderHook(() => usePipeWorkspace(repository));

    act(() => result.current.startCreate());
    act(() => result.current.setSelectedToolId("security-hmac"));
    act(() => result.current.addStep());

    const step = result.current.workingCopy?.steps[0];
    expect(step?.toolVersion).toBe(1);
    expect(step?.config).toEqual({ key: "", algorithm: "SHA-256" });
    expect(result.current.steps[0].options).toContainEqual(
      expect.objectContaining({
        id: "algorithm",
        options: ["SHA-256", "SHA-512"],
      }),
    );
    if (!step) return;

    act(() => result.current.changeConfig(step.id, "algorithm", "SHA-512"));
    expect(result.current.workingCopy?.steps[0].config).toEqual({
      key: "",
      algorithm: "SHA-512",
    });
  });

  it("does not replace or navigate away from an active working copy", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    repository.create(secondSavedPipe());
    const { result } = renderHook(() => usePipeWorkspace(repository));
    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());
    const selectedId = result.current.selectedPipeId;

    act(() => result.current.startEdit());
    act(() => result.current.setDraftName("Unsaved name"));
    act(() => result.current.startCreate());
    act(() => result.current.selectPipe(secondSavedPipe().id));

    expect(result.current.selectedPipeId).toBe(selectedId);
    expect(result.current.workingCopy?.name).toBe("Unsaved name");
    expect(result.current.isNew).toBe(false);
  });

  it("keeps only the latest overlapping async run result", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    const first = deferred<PipeExecutionResult>();
    const second = deferred<PipeExecutionResult>();
    const executor = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() =>
      usePipeWorkspace(repository, executor as typeof executePipe),
    );
    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());
    act(() => result.current.setInput("first"));

    let firstRun: Promise<void> | undefined;
    act(() => {
      firstRun = result.current.run();
    });
    await waitFor(() => expect(result.current.runState.status).toBe("running"));
    act(() => result.current.setInput("second"));
    await waitFor(() => expect(result.current.canRun).toBe(true));
    let secondRun: Promise<void> | undefined;
    act(() => {
      secondRun = result.current.run();
    });

    await act(async () => {
      second.resolve({ success: true, output: "second result" });
      await secondRun;
    });
    expect(result.current.output).toBe("second result");
    await act(async () => {
      first.resolve({ success: true, output: "stale first result" });
      await firstRun;
    });
    expect(result.current.output).toBe("second result");
    expect(result.current.runState.status).toBe("success");
  });

  it("invalidates an async result when another pipe is selected", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    repository.create(secondSavedPipe());
    const pending = deferred<PipeExecutionResult>();
    const executor = vi.fn(() => pending.promise);
    const { result } = renderHook(() =>
      usePipeWorkspace(repository, executor as typeof executePipe),
    );
    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());
    act(() => result.current.setInput("input"));
    let runPromise: Promise<void> | undefined;
    act(() => {
      runPromise = result.current.run();
    });
    act(() => result.current.selectPipe(secondSavedPipe().id));
    await waitFor(() =>
      expect(result.current.selectedPipeId).toBe(secondSavedPipe().id),
    );

    await act(async () => {
      pending.resolve({ success: true, output: "stale output" });
      await runPromise;
    });
    expect(result.current.output).toBe("");
    expect(result.current.runState.status).toBe("idle");
  });

  it("runs a generator-led pipe without input and attributes failures", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(sourcePipe());
    const executor = vi.fn<typeof executePipe>();
    executor.mockResolvedValueOnce({ success: true, output: "generated-id" });
    executor.mockResolvedValueOnce({
      success: false,
      failure: {
        code: "operation-failed",
        message: "generation failed",
        stepId: sourcePipe().steps[0].id,
        stepIndex: 0,
        toolId: sourcePipe().steps[0].toolId,
      },
    });
    const { result } = renderHook(() => usePipeWorkspace(repository, executor));
    await waitFor(() => expect(result.current.requiresInput).toBe(false));
    expect(result.current.canRun).toBe(true);

    await act(async () => result.current.run());
    expect(executor).toHaveBeenLastCalledWith(sourcePipe(), undefined);
    expect(result.current.output).toBe("generated-id");
    await act(async () => result.current.run());
    expect(result.current.output).toBe("");
    expect(result.current.runState).toMatchObject({
      status: "error",
      stepIndex: 0,
      stepName: "UUID Generator",
      message: "generation failed",
    });
  });

  it("manages list actions and resolves an import conflict as a copy", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    const { result } = renderHook(() => usePipeWorkspace(repository));
    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());

    act(() => expect(result.current.rename("Renamed")).toBe(true));
    expect(repository.get(savedPipe().id)?.name).toBe("Renamed");
    act(() => result.current.duplicate());
    expect(repository.list()).toHaveLength(2);
    act(() => result.current.deleteSelected());
    expect(repository.list()).toHaveLength(1);

    const imported = { ...savedPipe(), name: "Imported definition" };
    const source = serializePipeDocument(imported);
    await act(async () => {
      await result.current.importFile({
        size: new TextEncoder().encode(source).length,
        type: "application/json",
        text: async () => source,
      } as File);
    });
    expect(result.current.importConflict?.importedPipe.name).toBe(
      "Imported definition",
    );
    act(() => result.current.resolveConflict("copy"));
    expect(repository.list()).toHaveLength(2);
    expect(
      repository.list().some(({ name }) => name === "Imported definition copy"),
    ).toBe(true);
  });

  it("keeps an import conflict open when resolution cannot be written", async () => {
    const repository = createPipeRepository({ storage: makeStorage() });
    repository.create(savedPipe());
    const { result } = renderHook(() => usePipeWorkspace(repository));
    await waitFor(() => expect(result.current.selectedPipe).toBeDefined());

    const source = serializePipeDocument({
      ...savedPipe(),
      name: "Imported definition",
    });
    await act(async () => {
      await result.current.importFile({
        size: new TextEncoder().encode(source).length,
        type: "application/json",
        text: async () => source,
      } as File);
    });
    vi.spyOn(repository, "resolveImportConflict").mockImplementation(() => {
      throw new Error("Local storage is full");
    });

    act(() => result.current.resolveConflict("replace"));

    expect(result.current.importConflict).toBeDefined();
    expect(result.current.importConflictError).toBe("Local storage is full");
    expect(repository.list()).toHaveLength(1);
  });
});
