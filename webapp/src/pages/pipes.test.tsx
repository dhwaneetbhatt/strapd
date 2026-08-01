import { ChakraProvider } from "@chakra-ui/react";
import { render, screen, waitFor, within } from "@testing-library/react";
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
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>
    <KeyboardProvider>
      <MemoryRouter initialEntries={["/pipes"]}>{children}</MemoryRouter>
    </KeyboardProvider>
  </ChakraProvider>
);

beforeAll(() => {
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
});
