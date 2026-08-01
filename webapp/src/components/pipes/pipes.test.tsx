import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../config/theme";
import { PipeConfigFields } from "./pipe-config-fields";
import { PipeEditInspector } from "./pipe-edit-inspector";
import { PipeEditor } from "./pipe-editor";
import { PipeRunner } from "./pipe-runner";
import { PipeStepRibbon } from "./pipe-step-ribbon";
import { SavedPipesRail } from "./saved-pipes-rail";
import type { PipeStepView, PipeToolView } from "./types";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
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

const tools: PipeToolView[] = [
  {
    id: "string-reverse",
    name: "Reverse Text",
    description: "Reverse text",
    aliases: ["backwards"],
    category: "string",
    isSource: false,
    toolVersion: 1,
    options: [],
    defaults: {},
  },
  {
    id: "string-slugify",
    name: "Slugify",
    description: "Create a URL-safe slug",
    aliases: ["url slug"],
    category: "string",
    isSource: false,
    toolVersion: 1,
    options: [],
    defaults: {},
  },
  {
    id: "identifier-ulid-generator",
    name: "ULID Generator",
    description: "Generate sortable identifiers",
    aliases: ["ulid"],
    category: "identifiers",
    isSource: true,
    toolVersion: 1,
    options: [],
    defaults: {},
  },
];

const steps: PipeStepView[] = [
  {
    id: "step-one",
    toolId: "string-reverse",
    toolName: "Reverse Text",
    toolVersion: 1,
    config: {},
    options: [],
    summary: [],
  },
  {
    id: "step-two",
    toolId: "string-slugify",
    toolName: "Slugify",
    toolVersion: 1,
    config: { separator: "-" },
    options: [],
    summary: ["Separator: -"],
  },
];

describe("pipe components", () => {
  it("renders every declared configuration field and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <PipeConfigFields
        options={[
          {
            id: "enabled",
            name: "Enabled",
            type: "boolean",
            defaultValue: false,
            description: "Enable processing",
          },
          {
            id: "count",
            name: "Count",
            type: "number",
            defaultValue: 1,
            description: "Number of results",
          },
          {
            id: "mode",
            name: "Mode",
            type: "select",
            defaultValue: "encode",
            description: "Operation mode",
            options: ["encode", "decode"],
          },
        ]}
        values={{ enabled: false, count: 1, mode: "encode" }}
        onChange={onChange}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole("checkbox", { name: /enabled/i }));
    await user.selectOptions(screen.getByLabelText("Mode"), "decode");

    expect(onChange).toHaveBeenCalledWith("enabled", true);
    expect(onChange).toHaveBeenCalledWith("mode", "decode");
  });

  it("keeps a cleared number JSON-safe and exposes its declared constraints", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PipeConfigFields
        options={[
          {
            id: "count",
            name: "Count",
            type: "number",
            defaultValue: 1,
            description: "Number of results",
            min: 1,
            max: 10,
            step: 1,
          },
        ]}
        values={{ count: 1 }}
        onChange={onChange}
      />,
      { wrapper },
    );
    const input = screen.getByLabelText("Count");

    await user.clear(input);

    expect(onChange).toHaveBeenLastCalledWith("count", "");
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "10");
    expect(input).toHaveAttribute("step", "1");
  });

  it("provides pointer-independent reorder controls in the editor", async () => {
    const user = userEvent.setup();
    const onMoveStep = vi.fn();

    render(
      <PipeEditor
        name="Normalize payload"
        steps={steps}
        tools={tools}
        selectedStepId="step-one"
        validation={{}}
        onNameChange={vi.fn()}
        onAddStep={vi.fn()}
        onSelectStep={vi.fn()}
        onConfigChange={vi.fn()}
        onMoveStep={onMoveStep}
        onRemoveStep={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );

    const moveUp = screen.getByRole("button", { name: "Move Slugify up" });
    moveUp.focus();
    await user.keyboard("{Enter}");
    expect(onMoveStep).toHaveBeenCalledWith("step-two", -1);
  });

  it("fuzzy-searches compatible tools and adds the keyboard selection directly", async () => {
    const user = userEvent.setup();
    const onAddStep = vi.fn();

    render(
      <PipeEditor
        name="New pipe"
        steps={[]}
        tools={tools}
        validation={{}}
        onNameChange={vi.fn()}
        onAddStep={onAddStep}
        onSelectStep={vi.fn()}
        onConfigChange={vi.fn()}
        onMoveStep={vi.fn()}
        onRemoveStep={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );

    const search = screen.getByRole("combobox", {
      name: "Find a tool to add",
    });
    await user.type(search, "bckw");
    expect(
      screen.getByRole("option", { name: /Reverse Text/i }),
    ).toBeInTheDocument();
    await user.keyboard("{Enter}");

    expect(onAddStep).toHaveBeenCalledWith("string-reverse");
  });

  it("does not offer a source tool after the first step", async () => {
    const user = userEvent.setup();
    render(
      <PipeEditor
        name="Existing sequence"
        steps={[steps[0]]}
        tools={tools}
        selectedStepId="step-one"
        validation={{}}
        onNameChange={vi.fn()}
        onAddStep={vi.fn()}
        onSelectStep={vi.fn()}
        onConfigChange={vi.fn()}
        onMoveStep={vi.fn()}
        onRemoveStep={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );

    await user.type(
      screen.getByRole("combobox", { name: "Find a tool to add" }),
      "ulid",
    );
    expect(
      screen.queryByRole("option", { name: /ULID/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No tools found/i)).toBeInTheDocument();
  });

  it("renders empty and unavailable editor states without dropping the step", () => {
    const { rerender } = render(
      <PipeEditor
        name="New pipe"
        steps={[]}
        tools={tools}
        validation={{ form: ["Pipe must contain at least one step"] }}
        onNameChange={vi.fn()}
        onAddStep={vi.fn()}
        onSelectStep={vi.fn()}
        onConfigChange={vi.fn()}
        onMoveStep={vi.fn()}
        onRemoveStep={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );
    expect(screen.getByText("Add the first step")).toBeInTheDocument();
    expect(
      screen.getByText("Pipe must contain at least one step"),
    ).toBeInTheDocument();

    rerender(
      wrapper({
        children: (
          <PipeEditor
            name="Imported pipe"
            steps={[
              {
                ...steps[0],
                unavailableReason: "Tool unavailable: removed-tool",
              },
            ]}
            tools={tools}
            selectedStepId="step-one"
            validation={{}}
            onNameChange={vi.fn()}
            onAddStep={vi.fn()}
            onSelectStep={vi.fn()}
            onConfigChange={vi.fn()}
            onMoveStep={vi.fn()}
            onRemoveStep={vi.fn()}
            onSave={vi.fn()}
            onCancel={vi.fn()}
          />
        ),
      }),
    );
    expect(
      screen.getAllByText(/Tool unavailable: removed-tool/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Remove Reverse Text" }),
    ).toBeInTheDocument();
  });

  it("runs input-driven pipes and exposes final output actions", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();

    render(
      <PipeRunner
        pipeName="Normalize payload"
        steps={steps}
        requiresInput={true}
        input="payload"
        output="normalized"
        runState={{ status: "success", durationMs: 12 }}
        onInputChange={vi.fn()}
        onRun={onRun}
        onReset={vi.fn()}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole("button", { name: "Run pipe" }));

    expect(onRun).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Final pipe output")).toHaveValue(
      "normalized",
    );
    expect(screen.getByLabelText("Pipe input")).toHaveStyle({
      fontFamily: "var(--chakra-fonts-mono)",
    });
    expect(screen.getByLabelText("Final pipe output")).toHaveStyle({
      fontFamily: "var(--chakra-fonts-mono)",
    });
    expect(screen.getByText("2 steps completed")).toBeInTheDocument();
  });

  it("identifies a failed step without presenting stale success", () => {
    render(
      <PipeRunner
        pipeName="Normalize payload"
        steps={steps}
        requiresInput={true}
        input="payload"
        output=""
        runState={{
          status: "error",
          message: "Invalid input",
          stepId: "step-two",
          stepName: "Slugify",
          stepIndex: 1,
        }}
        onInputChange={vi.fn()}
        onRun={vi.fn()}
        onReset={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByText("Step 2, Slugify, failed")).toBeInTheDocument();
    expect(screen.queryByText("Success")).not.toBeInTheDocument();
  });

  it("keeps the ordered ribbon semantically valid", () => {
    const { container } = render(<PipeStepRibbon steps={steps} />, { wrapper });
    const list = container.querySelector("ol");

    expect(list).not.toBeNull();
    expect(
      Array.from(list?.children ?? []).every((child) => child.tagName === "LI"),
    ).toBe(true);
  });

  it("uses the shared can-run decision and syntax-aware output pane", () => {
    render(
      <PipeRunner
        pipeName="Normalize payload"
        steps={steps}
        requiresInput={true}
        input={'{"name":"Ada"}'}
        output={'{"name":"Ada"}'}
        runState={{ status: "idle" }}
        canRun={false}
        onInputChange={vi.fn()}
        onRun={vi.fn()}
        onReset={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByRole("button", { name: "Run pipe" })).toBeDisabled();
    expect(
      screen.getByRole("region", { name: "Final pipe output" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("JSON")).toHaveLength(2);
    expect(screen.getAllByText("UTF-8")).toHaveLength(2);
  });

  it("synchronizes the input line gutter and expands the pane accessibly", async () => {
    const user = userEvent.setup();
    render(
      <PipeRunner
        pipeName="Multiline input"
        steps={steps}
        requiresInput
        input={"alpha\nbeta\ngamma"}
        output=""
        runState={{ status: "idle" }}
        onInputChange={vi.fn()}
        onRun={vi.fn()}
        onReset={vi.fn()}
      />,
      { wrapper },
    );

    const input = screen.getByLabelText("Pipe input");
    const gutter = screen.getByTestId("pipe-input-line-gutter");
    expect(gutter).toHaveTextContent("1 2 3");

    Object.defineProperty(input, "scrollTop", {
      configurable: true,
      value: 48,
      writable: true,
    });
    fireEvent.scroll(input);
    expect(gutter.scrollTop).toBe(48);

    await user.click(screen.getByRole("button", { name: "Expand input pane" }));
    expect(
      screen.getByRole("button", { name: "Restore input pane" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Expand output pane" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("button", { name: "Expand input pane" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("uses a focused edit inspector without a numbered kicker", () => {
    render(
      <PipeEditInspector
        name="Normalize payload"
        steps={steps}
        tools={tools}
        selectedStepId="step-one"
        validation={{}}
        onNameChange={vi.fn()}
        onAddStep={vi.fn()}
        onConfigChange={vi.fn()}
        onMoveStep={vi.fn()}
        onRemoveStep={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    );

    expect(
      screen.getByRole("complementary", { name: "Pipe edit inspector" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reverse Text" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/edit step/i)).not.toBeInTheDocument();
  });

  it("disables collection navigation while a working copy is active", () => {
    render(
      <SavedPipesRail
        pipes={[
          {
            id: "pipe-one",
            name: "Saved pipe",
            updatedAt: "Updated just now",
            isRunnable: true,
          },
        ]}
        selectedPipeId="pipe-one"
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onImport={vi.fn()}
        isBusy
      />,
      { wrapper },
    );

    expect(screen.getByRole("button", { name: "New pipe" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Saved pipe/ })).toBeDisabled();
  });
});
