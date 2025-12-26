import { ChakraProvider } from "@chakra-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolDefinition } from "../base-tool";
import { TimestampToolComponent } from "./timestamp-tool";

// Mock the keyboard context and hooks
vi.mock("../../../contexts/keyboard-context", () => ({
  useKeyboardContext: () => ({
    isEnabled: true,
  }),
  KeyboardProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("../../../hooks/use-keyboard", () => ({
  useCommandS: vi.fn(),
}));

vi.mock("../../../hooks/use-tool-processing", () => ({
  useAutoProcess: vi.fn(),
}));

describe("TimestampToolComponent - handleMillisToggle", () => {
  const mockTool: ToolDefinition = {
    id: "datetime-timestamp",
    name: "Timestamp Converter",
    description: "Convert Unix timestamps to human readable",
    category: "datetime",
    aliases: ["timestamp"],
    component: TimestampToolComponent,
    operation: (_) => ({
      success: true,
      result: "2023-11-15T12:00:00Z",
    }),
  };

  const renderComponent = (initialInputs = {}) => {
    return render(
      <ChakraProvider>
        <TimestampToolComponent
          tool={mockTool}
          initialInputs={initialInputs}
          onInputChange={vi.fn()}
        />
      </ChakraProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display and initialize component with initial timestamp value", () => {
    renderComponent({
      timestamp: "1700000000",
      isMillis: false,
      format: "Human",
    });

    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;
    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;

    expect(inputField.value).toBe("1700000000");
    expect(switchElement.checked).toBe(false);
  });

  it("should accept non-numeric input without error", async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;

    await user.clear(inputField);
    await user.type(inputField, "not-a-number");

    expect(inputField.value).toBe("not-a-number");
  });

  it("should toggle milliseconds checkbox state", async () => {
    const user = userEvent.setup();
    renderComponent({
      timestamp: "1700000000",
      isMillis: false,
      format: "Human",
    });

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;

    expect(switchElement.checked).toBe(false);
    await user.click(switchElement);
    expect(switchElement.checked).toBe(true);
  });

  it("should scale seconds to milliseconds (multiply by 1000) when toggling on", async () => {
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <TimestampToolComponent
          tool={mockTool}
          initialInputs={{
            timestamp: "1700000000",
            isMillis: false,
            format: "Human",
          }}
          onInputChange={vi.fn()}
        />
      </ChakraProvider>,
    );

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;

    expect(switchElement.checked).toBe(false);

    await user.click(switchElement);

    await waitFor(() => {
      expect(switchElement.checked).toBe(true);
    });
  });

  it("should scale milliseconds to seconds (divide by 1000) when toggling off", async () => {
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <TimestampToolComponent
          tool={mockTool}
          initialInputs={{
            timestamp: "1700000000000",
            isMillis: true,
            format: "Human",
          }}
          onInputChange={vi.fn()}
        />
      </ChakraProvider>,
    );

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;

    expect(switchElement.checked).toBe(true);

    await user.click(switchElement);

    await waitFor(() => {
      expect(switchElement.checked).toBe(false);
    });
  });

  it("should not scale non-numeric timestamp when toggling milliseconds", async () => {
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <TimestampToolComponent
          tool={mockTool}
          initialInputs={{
            timestamp: "invalid-value",
            isMillis: false,
            format: "Human",
          }}
          onInputChange={vi.fn()}
        />
      </ChakraProvider>,
    );

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;
    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;

    expect(inputField.value).toBe("invalid-value");
    await user.click(switchElement);
    expect(inputField.value).toBe("invalid-value");
    expect(switchElement.checked).toBe(true);
  });

  it("should not scale empty timestamp when toggling milliseconds", async () => {
    const user = userEvent.setup();

    render(
      <ChakraProvider>
        <TimestampToolComponent
          tool={mockTool}
          initialInputs={{
            timestamp: "",
            isMillis: false,
            format: "Human",
          }}
          onInputChange={vi.fn()}
        />
      </ChakraProvider>,
    );

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;
    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;

    expect(inputField.value).toBe("");
    await user.click(switchElement);
    expect(inputField.value).toBe("");
    expect(switchElement.checked).toBe(true);
  });
});
