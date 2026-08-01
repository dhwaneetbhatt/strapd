import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PipeListItemView,
  PipeRunState,
  PipeStepView,
  PipeToolView,
  PipeValidationView,
} from "../components/pipes";
import {
  createPipeRepository,
  createUuid,
  deepCloneJson,
  downloadPipeDocument,
  executePipe,
  type JsonObject,
  type Pipe,
  type PipeImportConflict,
  type PipeRepository,
  type PipeValidationResult,
  validatePipe,
} from "../lib/pipes";
import { getPipeToolById, getPipeTools, TOOL_REGISTRY } from "../tools";
import type { ToolOption } from "../types";

type WorkspaceMode = "run" | "edit";

const toolViews = (): PipeToolView[] =>
  getPipeTools()
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      aliases: tool.aliases,
      category: tool.category,
      isSource: tool.pipe?.input.kind === "source",
      toolVersion: tool.pipe?.version ?? 1,
      options: tool.pipe?.config ?? [],
      defaults: deepCloneJson(tool.pipe?.defaults ?? {}),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

const summarizeOption = (option: ToolOption, value: unknown): string => {
  const displayValue =
    option.type === "boolean" ? (value ? "On" : "Off") : String(value);
  return `${option.name}: ${displayValue}`;
};

const pipeStepView = (pipe: Pipe): PipeStepView[] =>
  pipe.steps.map((step) => {
    const tool = getPipeToolById(step.toolId);
    const contract = tool?.pipe;
    let unavailableReason: string | undefined;
    if (!tool || !contract) {
      unavailableReason = `Tool unavailable: ${step.toolId}`;
    } else if (contract.version !== step.toolVersion) {
      unavailableReason = `Contract version ${step.toolVersion} is not supported`;
    }

    return {
      id: step.id,
      toolId: step.toolId,
      toolName: tool?.name ?? step.toolId,
      toolVersion: step.toolVersion,
      config: deepCloneJson(step.config),
      options: contract?.config ?? [],
      summary: (contract?.config ?? []).map((option) =>
        summarizeOption(option, step.config[option.id]),
      ),
      unavailableReason,
    };
  });

const relativeUpdatedAt = (timestamp: string): string => {
  const elapsedMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 60_000)
    return "Updated just now";
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days}d ago`;
};

const createDraft = (): Pipe => {
  const timestamp = new Date().toISOString();
  return {
    id: createUuid(),
    name: "Untitled pipe",
    createdAt: timestamp,
    updatedAt: timestamp,
    steps: [],
  };
};

const validationView = (result: PipeValidationResult): PipeValidationView => {
  const view: PipeValidationView = {};
  for (const issue of result.issues) {
    if (issue.code === "invalid-pipe-name") {
      view.name = issue.message;
      continue;
    }
    if (issue.stepId) {
      view.steps ??= {};
      const current = view.steps[issue.stepId] ?? {
        messages: [],
        fields: {},
      };
      current.messages.push(issue.message);
      const fieldMatch = issue.path?.match(/\.config\.([^.]+)$/);
      if (fieldMatch) current.fields[fieldMatch[1]] = issue.message;
      view.steps[issue.stepId] = current;
      continue;
    }
    view.form ??= [];
    view.form.push(issue.message);
  }
  return view;
};

const asErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "An unexpected pipe error occurred.";

export const usePipeWorkspace = (
  providedRepository?: PipeRepository,
  pipeExecutor: typeof executePipe = executePipe,
) => {
  const repository = useMemo(
    () => providedRepository ?? createPipeRepository(),
    [providedRepository],
  );
  const runRequestId = useRef(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [selectedPipeId, setSelectedPipeId] = useState<string>();
  const [mode, setMode] = useState<WorkspaceMode>("run");
  const [workingCopy, setWorkingCopy] = useState<Pipe>();
  const [isNew, setIsNew] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string>();
  const [selectedToolId, setSelectedToolId] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [runState, setRunState] = useState<PipeRunState>({ status: "idle" });
  const [error, setError] = useState<string>();
  const [importConflict, setImportConflict] = useState<PipeImportConflict>();
  const [importConflictError, setImportConflictError] = useState<string>();
  const [stepAnnouncement, setStepAnnouncement] = useState("");
  const availableTools = useMemo(toolViews, []);

  const refresh = useCallback(
    (preferredId?: string) => {
      runRequestId.current += 1;
      try {
        const next = repository.list();
        setPipes(next);
        setSelectedPipeId((current) => {
          const candidate = preferredId ?? current;
          return next.some(({ id }) => id === candidate)
            ? candidate
            : next[0]?.id;
        });
        setError(undefined);
      } catch (loadError) {
        setPipes([]);
        setError(asErrorMessage(loadError));
      }
    },
    [repository],
  );

  useEffect(() => refresh(), [refresh]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Run state is scoped to the selected pipe identity.
  useEffect(() => {
    runRequestId.current += 1;
    setInput("");
    setOutput("");
    setRunState({ status: "idle" });
  }, [selectedPipeId]);

  useEffect(() => {
    if (!selectedToolId && availableTools[0]) {
      setSelectedToolId(availableTools[0].id);
    }
  }, [availableTools, selectedToolId]);

  const selectedPipe = pipes.find(({ id }) => id === selectedPipeId);
  const activePipe = mode === "edit" ? workingCopy : selectedPipe;
  const requiresInput = selectedPipe
    ? getPipeToolById(selectedPipe.steps[0]?.toolId)?.pipe?.input.kind !==
      "source"
    : true;
  const canRun = Boolean(
    selectedPipe &&
      validatePipe(selectedPipe, TOOL_REGISTRY).runnable &&
      runState.status !== "running" &&
      (!requiresInput || input.length > 0),
  );
  const rawValidation = workingCopy
    ? validatePipe(workingCopy, TOOL_REGISTRY)
    : undefined;
  const hasUnsavedChanges = Boolean(
    workingCopy &&
      (isNew ||
        !selectedPipe ||
        JSON.stringify(workingCopy) !== JSON.stringify(selectedPipe)),
  );

  const startCreate = useCallback(() => {
    if (mode === "edit") return;
    runRequestId.current += 1;
    const draft = createDraft();
    setWorkingCopy(draft);
    setSelectedStepId(undefined);
    setIsNew(true);
    setShowValidation(false);
    setMode("edit");
    setError(undefined);
  }, [mode]);

  const selectPipe = useCallback(
    (pipeId: string) => {
      if (mode === "edit" || pipeId === selectedPipeId) return;
      runRequestId.current += 1;
      setSelectedPipeId(pipeId);
    },
    [mode, selectedPipeId],
  );

  const startEdit = useCallback(() => {
    if (!selectedPipe) return;
    try {
      const draft = repository.createWorkingCopy(selectedPipe);
      setWorkingCopy(draft);
      setSelectedStepId(draft.steps[0]?.id);
      setIsNew(false);
      setShowValidation(false);
      setMode("edit");
      setError(undefined);
    } catch (editError) {
      setError(asErrorMessage(editError));
    }
  }, [repository, selectedPipe]);

  const cancelEdit = useCallback(() => {
    setWorkingCopy(undefined);
    setSelectedStepId(undefined);
    setShowValidation(false);
    setMode("run");
  }, []);

  const updateDraft = useCallback((update: (draft: Pipe) => Pipe) => {
    setWorkingCopy((current) => (current ? update(current) : current));
  }, []);

  const addStep = useCallback(
    (toolId = selectedToolId) => {
      const tool = getPipeToolById(toolId);
      if (!tool?.pipe) return;
      const stepId = createUuid();
      const position = (workingCopy?.steps.length ?? 0) + 1;
      updateDraft((draft) => ({
        ...draft,
        steps: [
          ...draft.steps,
          {
            id: stepId,
            toolId: tool.id,
            toolVersion: tool.pipe?.version ?? 1,
            config: deepCloneJson(tool.pipe?.defaults ?? {}),
          },
        ],
      }));
      setSelectedStepId(stepId);
      setStepAnnouncement(`${tool.name} added as step ${position}.`);
    },
    [selectedToolId, updateDraft, workingCopy?.steps.length],
  );

  const removeStep = useCallback(
    (stepId: string) => {
      const removedIndex =
        workingCopy?.steps.findIndex(({ id }) => id === stepId) ?? -1;
      const removedTool =
        removedIndex >= 0
          ? getPipeToolById(workingCopy?.steps[removedIndex]?.toolId ?? "")
          : undefined;
      updateDraft((draft) => {
        const remaining = draft.steps.filter(({ id }) => id !== stepId);
        if (selectedStepId === stepId) setSelectedStepId(remaining[0]?.id);
        return { ...draft, steps: remaining };
      });
      if (removedIndex >= 0) {
        setStepAnnouncement(
          `${removedTool?.name ?? "Step"} removed from position ${removedIndex + 1}.`,
        );
      }
    },
    [selectedStepId, updateDraft, workingCopy?.steps],
  );

  const moveStep = useCallback(
    (stepId: string, direction: -1 | 1) => {
      const currentIndex =
        workingCopy?.steps.findIndex(({ id }) => id === stepId) ?? -1;
      updateDraft((draft) => {
        const index = draft.steps.findIndex(({ id }) => id === stepId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= draft.steps.length)
          return draft;
        const steps = [...draft.steps];
        [steps[index], steps[target]] = [steps[target], steps[index]];
        return { ...draft, steps };
      });
      if (currentIndex >= 0) {
        setStepAnnouncement(
          `Step moved to position ${currentIndex + direction + 1}.`,
        );
      }
    },
    [updateDraft, workingCopy?.steps],
  );

  const changeConfig = useCallback(
    (stepId: string, optionId: string, value: unknown) => {
      updateDraft((draft) => ({
        ...draft,
        steps: draft.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                config: { ...step.config, [optionId]: value } as JsonObject,
              }
            : step,
        ),
      }));
    },
    [updateDraft],
  );

  const saveEdit = useCallback(() => {
    if (!workingCopy) return false;
    const result = validatePipe(workingCopy, TOOL_REGISTRY);
    setShowValidation(true);
    if (!result.valid || !result.runnable) return false;
    try {
      const saved = isNew
        ? repository.create(workingCopy)
        : repository.saveWorkingCopy(workingCopy);
      refresh(saved.id);
      setWorkingCopy(undefined);
      setSelectedStepId(undefined);
      setShowValidation(false);
      setMode("run");
      return true;
    } catch (saveError) {
      setError(asErrorMessage(saveError));
      return false;
    }
  }, [isNew, refresh, repository, workingCopy]);

  const run = useCallback(async () => {
    if (!selectedPipe || !canRun) return;
    const requestId = ++runRequestId.current;
    setRunState({ status: "running" });
    setOutput("");
    const startedAt = performance.now();
    let result: Awaited<ReturnType<typeof executePipe>>;
    try {
      result = await pipeExecutor(selectedPipe, input || undefined);
    } catch (runError) {
      if (runRequestId.current !== requestId) return;
      setRunState({
        status: "error",
        message: asErrorMessage(runError),
      });
      return;
    }
    if (runRequestId.current !== requestId) return;
    if (result.success) {
      setOutput(result.output);
      setRunState({
        status: "success",
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      });
      return;
    }
    const failedStep = result.failure.stepId
      ? selectedPipe.steps.find(({ id }) => id === result.failure.stepId)
      : undefined;
    const tool = failedStep ? getPipeToolById(failedStep.toolId) : undefined;
    setRunState({
      status: "error",
      message: result.failure.message,
      stepId: result.failure.stepId,
      stepIndex: result.failure.stepIndex,
      stepName: tool?.name ?? failedStep?.toolId,
    });
  }, [canRun, input, pipeExecutor, selectedPipe]);

  const changeInput = useCallback((nextInput: string) => {
    runRequestId.current += 1;
    setInput(nextInput);
    setOutput("");
    setRunState({ status: "idle" });
  }, []);

  const resetRun = useCallback(() => {
    runRequestId.current += 1;
    setInput("");
    setOutput("");
    setRunState({ status: "idle" });
  }, []);

  const rename = useCallback(
    (name: string) => {
      if (!selectedPipe) return false;
      try {
        const renamed = repository.rename(selectedPipe.id, name);
        refresh(renamed.id);
        return true;
      } catch (renameError) {
        setError(asErrorMessage(renameError));
        return false;
      }
    },
    [refresh, repository, selectedPipe],
  );

  const duplicate = useCallback(() => {
    if (!selectedPipe) return;
    try {
      const copy = repository.duplicate(selectedPipe.id);
      refresh(copy.id);
    } catch (duplicateError) {
      setError(asErrorMessage(duplicateError));
    }
  }, [refresh, repository, selectedPipe]);

  const deleteSelected = useCallback(() => {
    if (!selectedPipe) return;
    try {
      repository.delete(selectedPipe.id);
      refresh();
    } catch (deleteError) {
      setError(asErrorMessage(deleteError));
    }
  }, [refresh, repository, selectedPipe]);

  const exportSelected = useCallback(() => {
    if (!selectedPipe) return;
    try {
      downloadPipeDocument(selectedPipe);
    } catch (exportError) {
      setError(asErrorMessage(exportError));
    }
  }, [selectedPipe]);

  const importFile = useCallback(
    async (file: File) => {
      if (mode === "edit") return;
      try {
        const result = await repository.prepareImport(file);
        if (result.kind === "conflict") {
          setImportConflictError(undefined);
          setImportConflict(result.conflict);
          return;
        }
        refresh(result.pipe.id);
      } catch (importError) {
        setError(asErrorMessage(importError));
      }
    },
    [mode, refresh, repository],
  );

  const resolveConflict = useCallback(
    (resolution: "replace" | "copy") => {
      if (!importConflict) return;
      try {
        const imported = repository.resolveImportConflict(
          importConflict,
          resolution,
        );
        setImportConflictError(undefined);
        setImportConflict(undefined);
        refresh(imported.id);
      } catch (importError) {
        setImportConflictError(asErrorMessage(importError));
      }
    },
    [importConflict, refresh, repository],
  );

  const listItems: PipeListItemView[] = pipes.map((pipe) => {
    const validation = validatePipe(pipe, TOOL_REGISTRY);
    return {
      id: pipe.id,
      name: pipe.name,
      updatedAt: relativeUpdatedAt(pipe.updatedAt),
      isRunnable: validation.runnable,
    };
  });

  return {
    mode,
    pipes: listItems,
    selectedPipe,
    selectedPipeId,
    selectPipe,
    activePipe,
    steps: activePipe ? pipeStepView(activePipe) : [],
    availableTools,
    workingCopy,
    isNew,
    selectedStepId,
    setSelectedStepId,
    selectedToolId,
    setSelectedToolId,
    validation:
      showValidation && rawValidation ? validationView(rawValidation) : {},
    input,
    setInput: changeInput,
    output,
    runState,
    requiresInput,
    canRun,
    hasUnsavedChanges,
    stepAnnouncement,
    error,
    clearError: () => setError(undefined),
    importConflict,
    importConflictError,
    dismissImportConflict: () => {
      setImportConflict(undefined);
      setImportConflictError(undefined);
    },
    startCreate,
    startEdit,
    cancelEdit,
    setDraftName: (name: string) =>
      updateDraft((draft) => ({ ...draft, name })),
    addStep,
    removeStep,
    moveStep,
    changeConfig,
    saveEdit,
    run,
    resetRun,
    rename,
    duplicate,
    deleteSelected,
    exportSelected,
    importFile,
    resolveConflict,
  };
};
