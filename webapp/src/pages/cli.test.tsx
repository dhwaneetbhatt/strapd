import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../config/theme";
import { CLI } from "./cli";

vi.mock("../components/layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const renderCliPage = () =>
  render(
    <ChakraProvider theme={theme}>
      <CLI />
    </ChakraProvider>,
  );

beforeAll(() => {
  window.scrollTo = vi.fn();

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

  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe("CLI page", () => {
  it("leads with a real composable command and its deterministic output", () => {
    renderCliPage();

    expect(
      screen.getByRole("heading", {
        name: "One utility belt for everyday developer work.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/strapd json minify --sort/)).toBeInTheDocument();
    expect(screen.getByText(/strapd base64 encode/)).toBeInTheDocument();
    expect(
      screen.getByText("eyJhY3RpdmUiOnRydWUsIm5hbWUiOiJBZGEifQo="),
    ).toBeInTheDocument();
  });

  it("presents Homebrew first and copies its documented commands", async () => {
    renderCliPage();

    const installationTabs = screen.getAllByRole("tab");
    expect(installationTabs[0]).toHaveTextContent("Homebrew");
    expect(installationTabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/brew tap dhwaneetbhatt\/tap/)).toBeInTheDocument();
    expect(screen.getByText(/brew install strapd/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy Homebrew installation commands",
      }),
    );

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "brew tap dhwaneetbhatt/tap\nbrew install strapd",
      );
    });
  });

  it("progressively exposes supported methods with auditable external links", () => {
    renderCliPage();

    fireEvent.click(screen.getByRole("tab", { name: "Install script" }));
    expect(
      screen.getByRole("link", { name: /Review installer source/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/dhwaneetbhatt/strapd/blob/main/scripts/install.sh",
    );
    expect(screen.getByText("/usr/local/bin/strapd")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Windows" }));
    expect(
      screen.getByRole("link", { name: /Review installer source/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/dhwaneetbhatt/strapd/blob/main/scripts/install.ps1",
    );
    expect(screen.getByText("$env:USERPROFILE\\.strapd")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Other installation methods" }),
    );
    expect(
      screen.getByRole("link", { name: /GitHub releases/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/make cli-release/)).toBeInTheDocument();

    for (const link of document.querySelectorAll('a[target="_blank"]')) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("ends with real verification, first-use, and discovery commands", () => {
    renderCliPage();

    expect(screen.getByText("strapd --version")).toBeInTheDocument();
    expect(screen.getByText("strapd uuid v7")).toBeInTheDocument();
    expect(screen.getByText("strapd --help")).toBeInTheDocument();
  });

  it("publishes factual route metadata and restores the previous document head", () => {
    const previousTitle = document.title;
    const { unmount } = renderCliPage();

    expect(document.title).toBe("strapd CLI — Offline Developer Toolkit");
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).toHaveAttribute("content", expect.stringContaining("offline Rust CLI"));
    expect(
      document.head.querySelector('meta[property="og:url"]'),
    ).toHaveAttribute("content", "https://dhwaneetbhatt.com/strapd/#/cli");
    expect(
      document.head.querySelector('link[rel="canonical"]'),
    ).toHaveAttribute("href", "https://dhwaneetbhatt.com/strapd/#/cli");

    const structuredData = document.head.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(structuredData).toHaveTextContent('"@type":"SoftwareApplication"');
    expect(structuredData).toHaveTextContent(
      '"operatingSystem":"macOS, Linux, Windows"',
    );

    unmount();
    expect(document.title).toBe(previousTitle);
  });
});
