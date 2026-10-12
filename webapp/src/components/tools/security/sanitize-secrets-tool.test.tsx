import { ChakraProvider } from "@chakra-ui/react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../../config/theme";
import { KeyboardProvider } from "../../../contexts/keyboard-context";
import type { ToolDefinition } from "../base-tool";
import { SanitizeSecretsToolComponent } from "./sanitize-secrets-tool";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>
    <KeyboardProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </KeyboardProvider>
  </ChakraProvider>
);

const tool = (operation: ToolDefinition["operation"]): ToolDefinition => ({
  id: "security-sanitize-secrets",
  name: "Sanitize Secrets",
  description: "Redact recognizable credentials",
  category: "security",
  component: SanitizeSecretsToolComponent,
  operation,
});

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

describe("Sanitize Secrets tool", () => {
  it("starts with all categories enabled and treats Error-prefixed text as output", async () => {
    const operation = vi.fn(() => ({
      success: true,
      result: "Error: ordinary input text",
    }));
    render(
      <SanitizeSecretsToolComponent
        tool={tool(operation)}
        initialInputs={{ text: "Error: ordinary input text" }}
      />,
      { wrapper },
    );

    await waitFor(() => expect(operation).toHaveBeenCalled());
    for (const label of [
      "API keys",
      "Authorization",
      "Cookies",
      "Databases",
      "Cryptographic keys",
      "Passwords",
      "Tokens",
      "Signed URLs",
    ]) {
      expect(screen.getByRole("checkbox", { name: label })).toBeChecked();
    }
    expect(
      screen.getByRole("group", { name: "Categories" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Sanitized result")).toHaveValue(
      "Error: ordinary input text",
    );
    expect(screen.getByLabelText("Sanitized result")).toHaveAttribute(
      "readonly",
    );
    expect(screen.queryByRole("alert")).not.toHaveTextContent(
      "Error: ordinary input text",
    );
  });

  it("keeps typed text when URL hydration changes categories without text", async () => {
    const operation = vi.fn(({ text }: Record<string, unknown>) => ({
      success: true,
      result: String(text ?? ""),
    }));
    const view = render(
      <SanitizeSecretsToolComponent
        tool={tool(operation)}
        initialInputs={{ apiKeys: true }}
      />,
      { wrapper },
    );

    fireEvent.change(screen.getByLabelText("Input text"), {
      target: { value: "synthetic-runtime-input" },
    });
    view.rerender(
      <SanitizeSecretsToolComponent
        tool={tool(operation)}
        initialInputs={{ apiKeys: false }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Input text")).toHaveValue(
        "synthetic-runtime-input",
      );
      expect(
        screen.getByRole("checkbox", { name: "API keys" }),
      ).not.toBeChecked();
    });
  });

  it("supports deselecting every category by keyboard", async () => {
    const operation = vi.fn(({ text }: Record<string, unknown>) => ({
      success: true,
      result: String(text ?? ""),
    }));
    render(<SanitizeSecretsToolComponent tool={tool(operation)} />, {
      wrapper,
    });

    const allCategories = screen.getByRole("checkbox", {
      name: "All categories",
    });
    await act(async () => {
      allCategories.focus();
      await userEvent.keyboard(" ");
    });

    for (const label of [
      "API keys",
      "Authorization",
      "Cookies",
      "Databases",
      "Cryptographic keys",
      "Passwords",
      "Tokens",
      "Signed URLs",
    ]) {
      expect(screen.getByRole("checkbox", { name: label })).not.toBeChecked();
    }
  });

  it("passes selected category state and input text to the operation", async () => {
    const operation = vi.fn(({ text }: Record<string, unknown>) => ({
      success: true,
      result: String(text ?? ""),
    }));
    render(<SanitizeSecretsToolComponent tool={tool(operation)} />, {
      wrapper,
    });

    fireEvent.change(screen.getByLabelText("Input text"), {
      target: { value: "synthetic-api-key" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "API keys" }));

    await waitFor(() =>
      expect(operation).toHaveBeenLastCalledWith(
        expect.objectContaining({ text: "synthetic-api-key", apiKeys: false }),
      ),
    );
  });

  it("clears the input and restores all category defaults", async () => {
    const operation = vi.fn(({ text }: Record<string, unknown>) => ({
      success: true,
      result: String(text ?? ""),
    }));
    render(
      <SanitizeSecretsToolComponent
        tool={tool(operation)}
        initialInputs={{ text: "synthetic-value", apiKeys: false }}
      />,
      { wrapper },
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("Input text")).toHaveValue("");
    for (const label of [
      "API keys",
      "Authorization",
      "Cookies",
      "Databases",
      "Cryptographic keys",
      "Passwords",
      "Tokens",
      "Signed URLs",
    ]) {
      expect(screen.getByRole("checkbox", { name: label })).toBeChecked();
    }
    await waitFor(() => expect(operation).toHaveBeenCalled());
  });
});
