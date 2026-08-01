import { ChakraProvider } from "@chakra-ui/react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import theme from "../config/theme";
import { KeyboardProvider } from "../contexts/keyboard-context";
import type { Pipe } from "../lib/pipes";
import { Pipes } from "./pipes";

let workspaceState: Record<string, unknown>;

vi.mock("../hooks/use-pipe-workspace", () => ({
  usePipeWorkspace: () => workspaceState,
}));

const pipe: Pipe = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Local pipe",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  steps: [],
};

const step = {
  id: "22222222-2222-4222-8222-222222222222",
  toolId: "string-reverse",
  toolName: "Reverse Text",
  toolVersion: 1,
  config: {},
  options: [],
  summary: [],
};

const tool = {
  id: "string-reverse",
  name: "Reverse Text",
  description: "Reverse text character by character",
  aliases: ["reverse", "flip"],
  category: "string" as const,
  isSource: false,
  toolVersion: 1,
  options: [],
  defaults: {},
};

const baseWorkspace = () => ({
  mode: "run",
  pipes: [],
  selectedPipe: undefined,
  selectedPipeId: undefined,
  selectPipe: vi.fn(),
  activePipe: undefined,
  steps: [],
  availableTools: [],
  workingCopy: undefined,
  isNew: false,
  selectedStepId: undefined,
  setSelectedStepId: vi.fn(),
  selectedToolId: "",
  setSelectedToolId: vi.fn(),
  validation: {},
  input: "",
  setInput: vi.fn(),
  output: "",
  runState: { status: "idle" },
  requiresInput: true,
  canRun: false,
  hasUnsavedChanges: false,
  error: undefined,
  clearError: vi.fn(),
  importConflict: undefined,
  importConflictError: undefined,
  dismissImportConflict: vi.fn(),
  startCreate: vi.fn(),
  startEdit: vi.fn(),
  cancelEdit: vi.fn(),
  setDraftName: vi.fn(),
  addStep: vi.fn(),
  removeStep: vi.fn(),
  moveStep: vi.fn(),
  changeConfig: vi.fn(),
  saveEdit: vi.fn(),
  run: vi.fn(),
  resetRun: vi.fn(),
  rename: vi.fn(),
  duplicate: vi.fn(),
  deleteSelected: vi.fn(),
  exportSelected: vi.fn(),
  importFile: vi.fn(),
  resolveConflict: vi.fn(),
  stepAnnouncement: "",
});

const selectedWorkspace = () => ({
  ...baseWorkspace(),
  pipes: [
    {
      id: pipe.id,
      name: pipe.name,
      updatedAt: "Updated just now",
      isRunnable: true,
    },
  ],
  selectedPipe: pipe,
  selectedPipeId: pipe.id,
  activePipe: pipe,
  steps: [step],
  availableTools: [tool],
  input: "payload",
  canRun: true,
});

const openPipeActions = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "More pipe actions" }));
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>
    <KeyboardProvider>
      <MemoryRouter initialEntries={["/pipes"]}>{children}</MemoryRouter>
    </KeyboardProvider>
  </ChakraProvider>
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("Pipes page correctness states", () => {
  beforeEach(() => {
    workspaceState = baseWorkspace();
  });

  it("uses a real button to trigger the existing hidden import input", async () => {
    const user = userEvent.setup();
    render(<Pipes />, { wrapper });
    const fileInput = screen.getByLabelText("Import pipe JSON");
    const clickInput = vi.spyOn(fileInput, "click");

    await user.click(screen.getByRole("button", { name: "Import JSON" }));

    expect(clickInput).toHaveBeenCalledOnce();
  });

  it("shows an accessible confirmation for global header navigation", async () => {
    const user = userEvent.setup();
    workspaceState = { ...baseWorkspace(), hasUnsavedChanges: true };
    render(<Pipes />, { wrapper });

    await user.click(screen.getByRole("link", { name: "CLI Tool" }));

    expect(
      screen.getByRole("alertdialog", { name: "Leave without saving?" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Stay and keep editing" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "Leave without saving?" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows conflict resolution write errors inside the active dialog", () => {
    workspaceState = {
      ...baseWorkspace(),
      importConflict: {
        kind: "identity-conflict",
        existingPipe: pipe,
        importedPipe: { ...pipe, name: "Imported pipe" },
      },
      importConflictError: "Local storage is full",
    };
    render(<Pipes />, { wrapper });

    expect(
      screen.getByRole("alertdialog", { name: "Pipe already exists" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Import was not saved\s*Local storage is full/,
    );
  });

  it("renders the edit runner sequence from the working copy", () => {
    const workingStep = {
      id: "22222222-2222-4222-8222-222222222222",
      toolId: "string-slugify",
      toolName: "Working Slugify",
      toolVersion: 1,
      config: { separator: "_" },
      options: [],
      summary: ["Separator: _"],
    };
    workspaceState = {
      ...baseWorkspace(),
      mode: "edit",
      selectedPipe: pipe,
      selectedPipeId: pipe.id,
      activePipe: {
        ...pipe,
        steps: [
          {
            id: workingStep.id,
            toolId: workingStep.toolId,
            toolVersion: workingStep.toolVersion,
            config: workingStep.config,
          },
        ],
      },
      workingCopy: {
        ...pipe,
        steps: [
          {
            id: workingStep.id,
            toolId: workingStep.toolId,
            toolVersion: workingStep.toolVersion,
            config: workingStep.config,
          },
        ],
      },
      steps: [workingStep],
    };

    render(<Pipes />, { wrapper });

    const sequence = screen.getByRole("region", {
      name: "Frozen sequence",
    });
    expect(within(sequence).getByText("Working Slugify")).toBeInTheDocument();
    expect(within(sequence).getByText("Separator: _")).toBeInTheDocument();
  });

  it("wires selected-pipe run, edit, export, duplicate, input, and reset actions", async () => {
    const user = userEvent.setup();
    const state = selectedWorkspace();
    workspaceState = state;
    render(<Pipes />, { wrapper });

    await user.click(screen.getByRole("button", { name: "Run" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Pipe input"), {
      target: { value: "next payload" },
    });
    await user.click(screen.getByRole("button", { name: "Run pipe" }));
    await user.click(screen.getByRole("button", { name: "Reset run" }));

    await openPipeActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Export" }));
    await openPipeActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));

    expect(state.run).toHaveBeenCalledTimes(2);
    expect(state.startEdit).toHaveBeenCalledOnce();
    expect(state.setInput).toHaveBeenCalledWith("next payload");
    expect(state.resetRun).toHaveBeenCalledOnce();
    expect(state.exportSelected).toHaveBeenCalledOnce();
    expect(state.duplicate).toHaveBeenCalledOnce();
  }, 10_000);

  it("keeps rename open after rejection, closes on success, and cancels with Escape", async () => {
    const user = userEvent.setup();
    const state = selectedWorkspace();
    workspaceState = state;
    render(<Pipes />, { wrapper });

    await openPipeActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    const nameInput = screen.getByLabelText("Pipe name");
    fireEvent.change(nameInput, { target: { value: "Renamed pipe" } });
    await user.click(screen.getByRole("button", { name: "Save name" }));

    expect(state.rename).toHaveBeenLastCalledWith("Renamed pipe");
    expect(screen.getByLabelText("Pipe name")).toBeInTheDocument();

    state.rename.mockReturnValueOnce(true);
    await user.keyboard("{Enter}");
    expect(screen.queryByLabelText("Pipe name")).not.toBeInTheDocument();

    await openPipeActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByLabelText("Pipe name")).not.toBeInTheDocument();
    expect(state.rename).toHaveBeenCalledTimes(2);
  });

  it("cancels and confirms deletion through the protected dialog", async () => {
    const user = userEvent.setup();
    const state = selectedWorkspace();
    workspaceState = state;
    render(<Pipes />, { wrapper });

    await openPipeActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(
      await screen.findByRole("alertdialog", { name: "Delete this pipe?" }),
    ).toHaveTextContent("Local pipe will be removed");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "Delete this pipe?" }),
      ).not.toBeInTheDocument(),
    );
    expect(state.deleteSelected).not.toHaveBeenCalled();

    await openPipeActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete pipe" }));
    expect(state.deleteSelected).toHaveBeenCalledOnce();
  }, 10_000);

  it("dispatches every import conflict decision", async () => {
    const user = userEvent.setup();
    const state = {
      ...baseWorkspace(),
      importConflict: {
        kind: "identity-conflict",
        existingPipe: pipe,
        importedPipe: { ...pipe, name: "Imported pipe" },
      },
    };
    workspaceState = state;
    render(<Pipes />, { wrapper });

    await user.click(screen.getByRole("button", { name: "Import as copy" }));
    await user.click(screen.getByRole("button", { name: "Replace existing" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(state.resolveConflict).toHaveBeenNthCalledWith(1, "copy");
    expect(state.resolveConflict).toHaveBeenNthCalledWith(2, "replace");
    expect(state.dismissImportConflict).toHaveBeenCalledOnce();
  });

  it("dismisses workspace errors and explains an unrunnable selected pipe", async () => {
    const user = userEvent.setup();
    const state = selectedWorkspace();
    workspaceState = {
      ...state,
      error: "Could not load saved pipes",
      pipes: [{ ...state.pipes[0], isRunnable: false }],
      canRun: false,
    };
    render(<Pipes />, { wrapper });

    expect(screen.getByText("Could not load saved pipes")).toBeInTheDocument();
    expect(
      screen.getByText(/unavailable or incompatible step/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Dismiss error" }));

    expect(state.clearError).toHaveBeenCalledOnce();
  });

  it("wires create-mode naming, tool selection, save, and cancel", async () => {
    const user = userEvent.setup();
    const state = {
      ...baseWorkspace(),
      mode: "edit",
      workingCopy: { ...pipe, name: "Untitled pipe" },
      activePipe: { ...pipe, name: "Untitled pipe" },
      isNew: true,
      availableTools: [tool],
    };
    workspaceState = state;
    render(<Pipes />, { wrapper });

    expect(
      screen.getByRole("heading", { name: "Create pipe" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Pipe name"), {
      target: { value: "New workflow" },
    });
    await user.click(
      screen.getByRole("combobox", { name: "Find a tool to add" }),
    );
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Save pipe" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(state.setDraftName).toHaveBeenCalledWith("New workflow");
    expect(state.addStep).toHaveBeenCalledWith(tool.id);
    expect(state.saveEdit).toHaveBeenCalledOnce();
    expect(state.cancelEdit).toHaveBeenCalledOnce();
  });

  it("wires existing-edit inspector and runner interactions", async () => {
    const user = userEvent.setup();
    const state = {
      ...selectedWorkspace(),
      mode: "edit",
      workingCopy: pipe,
      activePipe: pipe,
      isNew: false,
      selectedStepId: step.id,
    };
    workspaceState = state;
    render(<Pipes />, { wrapper });

    expect(
      screen.getByRole("heading", { name: "Edit Local pipe" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Pipe name"), {
      target: { value: "Edited workflow" },
    });
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Run pipe" }));
    await user.click(screen.getByRole("button", { name: "Save pipe" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(state.setDraftName).toHaveBeenCalledWith("Edited workflow");
    expect(state.removeStep).toHaveBeenCalledWith(step.id);
    expect(state.run).toHaveBeenCalledOnce();
    expect(state.saveEdit).toHaveBeenCalledOnce();
    expect(state.cancelEdit).toHaveBeenCalledOnce();
  });

  it("runs from Ctrl+Enter only when a visible runner can run", () => {
    const state = selectedWorkspace();
    workspaceState = state;
    const { rerender } = render(<Pipes />, { wrapper });

    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
    expect(state.run).toHaveBeenCalledOnce();

    workspaceState = { ...state, canRun: false };
    rerender(<Pipes />);
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(state.run).toHaveBeenCalledOnce();

    workspaceState = {
      ...state,
      mode: "edit",
      workingCopy: pipe,
      isNew: true,
    };
    rerender(<Pipes />);
    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });
    expect(state.run).toHaveBeenCalledOnce();

    workspaceState = {
      ...state,
      mode: "edit",
      workingCopy: pipe,
      isNew: false,
    };
    rerender(<Pipes />);
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(state.run).toHaveBeenCalledTimes(2);
  });

  it("confirms guarded navigation when the user chooses to discard changes", async () => {
    const user = userEvent.setup();
    workspaceState = { ...baseWorkspace(), hasUnsavedChanges: true };
    render(<Pipes />, { wrapper });

    await user.click(screen.getByRole("link", { name: "CLI Tool" }));
    await user.click(
      screen.getByRole("button", { name: "Leave without saving" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("alertdialog", { name: "Leave without saving?" }),
      ).not.toBeInTheDocument(),
    );
  });
});
