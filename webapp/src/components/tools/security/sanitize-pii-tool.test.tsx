import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, expect, it, vi } from "vitest";
import theme from "../../../config/theme";
import { KeyboardProvider } from "../../../contexts/keyboard-context";
import { PII_CATEGORIES } from "../../../lib/utils/security/pii";
import type { ToolDefinition } from "../base-tool";
import { SanitizePiiToolComponent } from "./sanitize-pii-tool";

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

it("starts with mask/all, accepts pseudonym mode and no categories, and resets", async () => {
  const operation = vi.fn((inputs: Record<string, unknown>) => ({
    success: true,
    result: String(inputs.text ?? ""),
  }));
  const tool: ToolDefinition = {
    id: "security-sanitize-pii",
    name: "Sanitize PII",
    description: "Protect identifiers",
    category: "security",
    component: SanitizePiiToolComponent,
    operation,
  };
  render(
    <ChakraProvider theme={theme}>
      <KeyboardProvider>
        <MemoryRouter>
          <SanitizePiiToolComponent
            tool={tool}
            initialInputs={{ text: "Error: ordinary text" }}
          />
        </MemoryRouter>
      </KeyboardProvider>
    </ChakraProvider>,
  );
  expect(screen.getByRole("radio", { name: "Mask" })).toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: "All categories" }),
  ).toBeChecked();
  await waitFor(() =>
    expect(screen.getByLabelText("Sanitized result")).toHaveValue(
      "Error: ordinary text",
    ),
  );
  expect(screen.getByLabelText("Sanitized result")).toHaveAttribute("readonly");
  fireEvent.click(screen.getByRole("radio", { name: "Pseudonymize" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "All categories" }));
  for (const { label } of PII_CATEGORIES)
    expect(screen.getByRole("checkbox", { name: label })).not.toBeChecked();
  await waitFor(() =>
    expect(operation).toHaveBeenLastCalledWith(
      expect.objectContaining({
        mode: "Pseudonymize",
        aadhaar: false,
        pan: false,
      }),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  expect(screen.getByLabelText("Input text")).toHaveValue("");
  expect(screen.getByRole("radio", { name: "Mask" })).toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: "All categories" }),
  ).toBeChecked();
});
