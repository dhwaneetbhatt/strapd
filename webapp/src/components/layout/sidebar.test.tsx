import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../config/theme";
import { toolGroups } from "../../tools";
import { Sidebar } from "./sidebar";

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
    const user = userEvent.setup();
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
    await user.click(groupButton);
    await user.click(groupButton);
    await user.click(
      screen.getAllByRole("button", { name: firstTool.name })[0],
    );
    await user.click(
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
