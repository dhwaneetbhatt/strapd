import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tool } from "../../types";

// Mock dependencies
const mockToggleFavorite = vi.fn();
const mockTogglePinnedTool = vi.fn();
const mockIsFavorite = vi.fn();

vi.mock("../../contexts/settings-context", () => ({
  useSettings: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
    pinnedToolId: null,
    togglePinnedTool: mockTogglePinnedTool,
  }),
}));

// Mock getCategoryIcon
vi.mock("../../constants/category-icons", () => ({
  getCategoryIcon: (category: string) => `[${category}-icon]`,
}));

// Mock TOOL_REGISTRY - define inline to avoid hoisting issues
vi.mock("../../tools", () => ({
  TOOL_REGISTRY: {
    "test-tool": {
      id: "test-tool",
      name: "Test Tool",
      description: "A test tool",
      category: "string",
      component: () => (
        <div data-testid="mock-tool-component">
          Mock Tool Component for test-tool
        </div>
      ),
      operation: () => ({ success: true, result: "test" }),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider>{children}</ChakraProvider>
);

// Import component after mocks are set up
import { ToolInterface } from "./tool-interface";

describe("ToolInterface", () => {
  let mockTool: Tool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFavorite.mockReturnValue(false);

    mockTool = {
      id: "test-tool",
      name: "Test Tool",
      description: "A test tool description",
      category: "string",
      operation: vi.fn(),
    };
  });

  describe("Tool Rendering", () => {
    it("renders tool header with name and description", () => {
      render(<ToolInterface tool={mockTool} />, { wrapper });

      expect(screen.getByText("Test Tool")).toBeInTheDocument();
      expect(screen.getByText("A test tool description")).toBeInTheDocument();
    });

    it("renders category icon", () => {
      render(<ToolInterface tool={mockTool} />, { wrapper });

      expect(screen.getByText("[string-icon]")).toBeInTheDocument();
    });

    it("renders tool component from registry", () => {
      render(<ToolInterface tool={mockTool} />, { wrapper });

      expect(screen.getByTestId("mock-tool-component")).toBeInTheDocument();
      expect(
        screen.getByText("Mock Tool Component for test-tool"),
      ).toBeInTheDocument();
    });

    it("renders with initialInput prop", () => {
      const initialInput = { input1: "value1" };

      render(<ToolInterface tool={mockTool} initialInput={initialInput} />, {
        wrapper,
      });

      // Component should render successfully
      expect(screen.getByTestId("mock-tool-component")).toBeInTheDocument();
    });

    it("renders with onInputChange callback", () => {
      const onInputChange = vi.fn();

      render(<ToolInterface tool={mockTool} onInputChange={onInputChange} />, {
        wrapper,
      });

      // Component should render successfully
      expect(screen.getByTestId("mock-tool-component")).toBeInTheDocument();
    });
  });

  describe("Tool Not Found", () => {
    it("displays error when tool not in registry", () => {
      const unknownTool: Tool = {
        id: "unknown-tool",
        name: "Unknown",
        description: "Unknown tool",
        category: "string",
        operation: vi.fn(),
      };

      render(<ToolInterface tool={unknownTool} />, { wrapper });

      expect(
        screen.getByText("Tool not found: unknown-tool"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "This tool may not be implemented yet or has been removed.",
        ),
      ).toBeInTheDocument();
    });

    it("does not render tool component when tool not found", () => {
      const unknownTool: Tool = {
        id: "unknown-tool",
        name: "Unknown",
        description: "Unknown tool",
        category: "string",
        operation: vi.fn(),
      };

      render(<ToolInterface tool={unknownTool} />, { wrapper });

      expect(
        screen.queryByTestId("mock-tool-component"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Favorite Functionality", () => {
    it("shows unfilled star when tool is not favorite", () => {
      mockIsFavorite.mockReturnValue(false);

      render(<ToolInterface tool={mockTool} />, { wrapper });

      const favoriteButton = screen.getByLabelText("Add to favorites");
      expect(favoriteButton).toBeInTheDocument();
    });

    it("shows filled star when tool is favorite", () => {
      mockIsFavorite.mockReturnValue(true);

      render(<ToolInterface tool={mockTool} />, { wrapper });

      const favoriteButton = screen.getByLabelText("Remove from favorites");
      expect(favoriteButton).toBeInTheDocument();
    });

    it("calls toggleFavorite when favorite button clicked", async () => {
      const user = userEvent.setup();
      mockIsFavorite.mockReturnValue(false);

      render(<ToolInterface tool={mockTool} />, { wrapper });

      const favoriteButton = screen.getByLabelText("Add to favorites");
      await user.click(favoriteButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith("test-tool");
    });

    it("calls toggleFavorite when unfavorite button clicked", async () => {
      const user = userEvent.setup();
      mockIsFavorite.mockReturnValue(true);

      render(<ToolInterface tool={mockTool} />, { wrapper });

      const favoriteButton = screen.getByLabelText("Remove from favorites");
      await user.click(favoriteButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith("test-tool");
    });
  });

  describe("Pin Functionality", () => {
    it("shows pin button when tool is not pinned", () => {
      render(<ToolInterface tool={mockTool} />, { wrapper });

      const pinButton = screen.getByLabelText("Pin tool");
      expect(pinButton).toBeInTheDocument();
    });

    it("calls togglePinnedTool when pin button clicked", async () => {
      const user = userEvent.setup();

      render(<ToolInterface tool={mockTool} />, { wrapper });

      const pinButton = screen.getByLabelText("Pin tool");
      await user.click(pinButton);

      expect(mockTogglePinnedTool).toHaveBeenCalledWith("test-tool");
    });
  });

  describe("Integration", () => {
    it("renders all interactive elements together", () => {
      mockIsFavorite.mockReturnValue(true);

      render(<ToolInterface tool={mockTool} />, { wrapper });

      expect(screen.getByText("Test Tool")).toBeInTheDocument();
      expect(screen.getByText("A test tool description")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Remove from favorites"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Pin tool")).toBeInTheDocument();
      expect(screen.getByTestId("mock-tool-component")).toBeInTheDocument();
    });

    it("handles multiple interactions in sequence", async () => {
      const user = userEvent.setup();
      mockIsFavorite.mockReturnValue(false);

      render(<ToolInterface tool={mockTool} />, { wrapper });

      const favoriteButton = screen.getByLabelText("Add to favorites");
      const pinButton = screen.getByLabelText("Pin tool");

      await user.click(favoriteButton);
      await user.click(pinButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith("test-tool");
      expect(mockTogglePinnedTool).toHaveBeenCalledWith("test-tool");
    });
  });
});
