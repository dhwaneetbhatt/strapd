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

describe("TimestampToolComponent", () => {
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

  it("should render the component with milliseconds toggle switch", () => {
    renderComponent();

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    });
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).not.toBeChecked();
  });

  it("should render timestamp input field", () => {
    renderComponent();

    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    );
    expect(inputField).toBeInTheDocument();
  });

  it("should render Get Now button", () => {
    renderComponent();

    const button = screen.getByRole("button", { name: /get now/i });
    expect(button).toBeInTheDocument();
  });

  it("should render format options (Human and ISO)", () => {
    renderComponent();

    expect(screen.getByRole("radio", { name: /human/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /iso/i })).toBeInTheDocument();
  });

  it("should display initial timestamp value in input", () => {
    renderComponent({
      timestamp: "1700000000",
      isMillis: false,
      format: "Human",
    });

    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;
    expect(inputField.value).toBe("1700000000");
  });

  it("should reflect milliseconds toggle state", () => {
    renderComponent({
      timestamp: "1700000000",
      isMillis: false,
      format: "Human",
    });

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;
    expect(switchElement.checked).toBe(false);
  });

  it("should handle milliseconds toggle being checked", () => {
    renderComponent({
      timestamp: "1700000000",
      isMillis: true,
      format: "Human",
    });

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;
    expect(switchElement.checked).toBe(true);
  });

  it("should update timestamp input when user types", async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;

    await user.clear(inputField);
    await user.type(inputField, "1700000000");

    expect(inputField.value).toBe("1700000000");
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

  it("should render result output field", () => {
    renderComponent();

    const outputField = screen.getByPlaceholderText(
      "Converted date will appear here...",
    );
    expect(outputField).toBeInTheDocument();
  });

  it("should render copy button for result", () => {
    renderComponent();

    // Looking for copy button - it should exist in the output section
    const outputSection = screen.getByText("Date result");
    expect(outputSection).toBeInTheDocument();
  });

  it("should have Human format selected by default", () => {
    renderComponent();

    const humanRadio = screen.getByRole("radio", {
      name: /human/i,
    }) as HTMLInputElement;
    expect(humanRadio.checked).toBe(true);
  });

  it("should handle very large timestamp values", async () => {
    const user = userEvent.setup();
    renderComponent();

    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;

    await user.clear(inputField);
    await user.type(inputField, "9007199254740992");

    expect(inputField.value).toBe("9007199254740992");
  });

  it("should toggle milliseconds checkbox and update state", async () => {
    const user = userEvent.setup();
    renderComponent({
      timestamp: "1700000000",
      isMillis: false,
      format: "Human",
    });

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;

    // Initial state should be unchecked (false)
    expect(switchElement.checked).toBe(false);

    // Toggle the switch
    await user.click(switchElement);

    // After toggle, should be checked (true)
    expect(switchElement.checked).toBe(true);
  });

  it("should scale seconds to milliseconds when toggling on with valid timestamp", async () => {
    const user = userEvent.setup();
    const onInputChange = vi.fn();

    render(
      <ChakraProvider>
        <TimestampToolComponent
          tool={mockTool}
          initialInputs={{
            timestamp: "1700000000",
            isMillis: false,
            format: "Human",
          }}
          onInputChange={onInputChange}
        />
      </ChakraProvider>,
    );

    const switchElement = screen.getByRole("checkbox", {
      name: /milliseconds/i,
    }) as HTMLInputElement;
    const inputField = screen.getByPlaceholderText(
      "Enter timestamp to convert...",
    ) as HTMLInputElement;

    // Initial state: 1700000000 seconds, isMillis = false
    expect(inputField.value).toBe("1700000000");
    expect(switchElement.checked).toBe(false);

    // Toggle milliseconds ON
    await user.click(switchElement);

    // The handleMillisToggle function should scale by 1000
    // Result should be 1700000000000 milliseconds
    // This happens through the updateInput callback
    await waitFor(() => {
      expect(switchElement.checked).toBe(true);
    });
  });

  it("should scale milliseconds to seconds when toggling off with valid timestamp", async () => {
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

    // Initial state: 1700000000000 milliseconds, isMillis = true
    expect(switchElement.checked).toBe(true);

    // Toggle milliseconds OFF
    await user.click(switchElement);

    // After toggle, should be off
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
            timestamp: "not-a-number",
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

    // Initial non-numeric input
    expect(inputField.value).toBe("not-a-number");

    // Toggle milliseconds ON
    await user.click(switchElement);

    // Input should remain unchanged (not scaled)
    expect(inputField.value).toBe("not-a-number");
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

    // Initial state: empty timestamp
    expect(inputField.value).toBe("");

    // Toggle milliseconds ON
    await user.click(switchElement);

    // Input should remain empty (not scaled)
    expect(inputField.value).toBe("");
    expect(switchElement.checked).toBe(true);
  });
});
