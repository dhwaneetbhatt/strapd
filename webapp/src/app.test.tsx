import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./app";
import theme from "./config/theme";

describe("App routes", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/pipes";
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
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

  it("renders the pipe workspace at /pipes", async () => {
    render(
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Build a repeatable pipe" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New pipe" }),
    ).toBeInTheDocument();
  });
});
