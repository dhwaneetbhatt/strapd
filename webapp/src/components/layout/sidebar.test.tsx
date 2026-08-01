import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../config/theme";
import { toolGroups } from "../../tools";
import { Sidebar } from "./sidebar";

vi.mock("../../tools", () => ({
  toolGroups: [
    {
      category: "string",
      name: "Text Tools",
      description: "Text utilities",
      icon: "📝",
      tools: [
        {
          id: "string-case-converter",
          name: "Case Converter",
          description: "Convert text case",
          category: "string",
          operation: vi.fn(),
        },
        {
          id: "string-analysis",
          name: "Text Analysis",
          description: "Analyze text",
          category: "string",
          operation: vi.fn(),
        },
      ],
    },
  ],
}));

const firstTool = toolGroups[0].tools[0];
const secondTool = toolGroups[0].tools[1];

vi.mock("../../contexts/settings-context", () => ({
  useSettings: () => ({
    favorites: [firstTool.id],
    getFrequentlyUsedTools: () => [secondTool.id, "missing-tool"],
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
);

beforeAll(() => {
  Object.defineProperty(window, "scrollTo", {
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

describe("Sidebar", () => {
  it("supports grouped pointer and keyboard navigation", async () => {
    const onToolSelect = vi.fn();
    const onToggle = vi.fn();
    const { container, rerender } = render(
      <Sidebar
        selectedTool={firstTool}
        onToolSelect={onToolSelect}
        isOpen={false}
        onToggle={onToggle}
      />,
      { wrapper },
    );
    expect(
      screen.getByRole("navigation", { name: "Developer tools navigation" }),
    ).toHaveAttribute("aria-expanded", "false");

    rerender(
      <Sidebar
        selectedTool={firstTool}
        onToolSelect={onToolSelect}
        isOpen
        onToggle={onToggle}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Favorites/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Frequently Used/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: firstTool.name })[0],
      ).toHaveAttribute("aria-describedby"),
    );

    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Escape" });

    const groupButton = screen.getByRole("button", {
      name: new RegExp(toolGroups[0].name),
    });
    fireEvent.click(groupButton);
    fireEvent.click(groupButton);
    fireEvent.click(screen.getAllByRole("button", { name: firstTool.name })[0]);
    fireEvent.click(
      container.querySelector('[aria-label="Toggle sidebar"]') as Element,
    );
    const navigation = screen.getByRole("navigation", {
      name: "Developer tools navigation",
    });
    fireEvent.click(navigation.nextElementSibling as Element);

    expect(onToolSelect).toHaveBeenCalledWith(firstTool);
    expect(onToggle).toHaveBeenCalledTimes(3);
  });

  it("ignores navigation keys while a dialog is open", () => {
    const onToolSelect = vi.fn();
    const onToggle = vi.fn();
    const { rerender } = render(
      <Sidebar
        selectedTool={firstTool}
        onToolSelect={onToolSelect}
        isOpen={false}
        onToggle={onToggle}
      />,
      { wrapper },
    );
    rerender(
      <>
        <Sidebar
          selectedTool={firstTool}
          onToolSelect={onToolSelect}
          isOpen
          onToggle={onToggle}
        />
        <div role="dialog">Open dialog</div>
      </>,
    );

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onToolSelect).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});
