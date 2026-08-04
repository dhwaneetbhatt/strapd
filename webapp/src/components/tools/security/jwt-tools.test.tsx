import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../../config/theme";
import { KeyboardProvider } from "../../../contexts/keyboard-context";
import type { ToolDefinition } from "../base-tool";
import { JwtInspectorToolComponent } from "./jwt-inspector-tool";
import { JwtSignerToolComponent } from "./jwt-signer-tool";

vi.mock("../../common/syntax-highlighter", () => ({
  SyntaxHighlighterComponent: ({ code }: { code: string }) => <pre>{code}</pre>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>
    <KeyboardProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </KeyboardProvider>
  </ChakraProvider>
);

const inspectorTool = (
  operation: ToolDefinition["operation"],
): ToolDefinition => ({
  id: "security-jwt-decode",
  name: "JWT Inspector",
  description: "Inspect a JWT",
  category: "security",
  component: JwtInspectorToolComponent,
  operation,
});

const signerTool = (
  operation: ToolDefinition["operation"],
): ToolDefinition => ({
  id: "security-jwt-sign",
  name: "JWT Signer",
  description: "Sign claims",
  category: "security",
  component: JwtSignerToolComponent,
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

describe("JWT web tools", () => {
  it("automatically presents decoded content and temporal and verification states", async () => {
    const operation = vi.fn(() => ({
      success: true,
      result: "decoded",
      decoded: {
        header: { alg: "HS256", typ: "JWT" },
        payload: { sub: "123", exp: 2516239022 },
        analysis: {
          expiration: {
            status: "ACTIVE",
            expires_at: "2049-09-22T00:37:02Z",
            seconds_remaining: 729381622,
          },
          signature: { status: "UNVERIFIED" },
        },
      },
      verificationStatus: "VERIFIED",
    }));

    render(
      <JwtInspectorToolComponent
        tool={inspectorTool(operation)}
        initialInputs={{ token: "header.payload.signature", secret: "secret" }}
      />,
      { wrapper },
    );

    await waitFor(() => expect(operation).toHaveBeenCalled());
    expect(screen.getByText(/"alg": "HS256"/)).toBeInTheDocument();
    expect(screen.getByText(/"sub": "123"/)).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("VERIFIED")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send to pipe" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy CLI command" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/shared Rust core/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("JWT or authorization header")).toHaveStyle({
      fontFamily: "var(--chakra-fonts-mono)",
    });
    expect(screen.getByLabelText("HMAC secret")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("shows malformed token errors accessibly", async () => {
    render(
      <JwtInspectorToolComponent
        tool={inspectorTool(() => ({
          success: false,
          error: "JWT must contain exactly 3 segments; found 2",
        }))}
        initialInputs={{ token: "not.a-token" }}
      />,
      { wrapper },
    );

    expect(
      await screen.findByText("JWT must contain exactly 3 segments; found 2"),
    ).toBeInTheDocument();
  });

  it("signs automatically and exposes compact output actions", async () => {
    const operation = vi.fn(() => ({
      success: true,
      result: "header.payload.signature",
    }));
    render(
      <JwtSignerToolComponent
        tool={signerTool(operation)}
        initialInputs={{
          payload: '{"sub":"123"}',
          secret: "secret",
          algorithm: "HS512",
          expiration: "300",
        }}
      />,
      { wrapper },
    );

    await waitFor(() => expect(operation).toHaveBeenCalled());
    expect(screen.getByLabelText("Compact JWT output")).toHaveValue(
      "header.payload.signature",
    );
    expect(screen.getByRole("combobox", { name: "Algorithm" })).toHaveValue(
      "HS512",
    );
    expect(
      screen.queryByRole("button", { name: "Copy CLI command" }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Expires in seconds"), {
      target: { value: "600" },
    });
    await waitFor(() =>
      expect(operation).toHaveBeenLastCalledWith(
        expect.objectContaining({ expiration: "600" }),
      ),
    );
  });
});
