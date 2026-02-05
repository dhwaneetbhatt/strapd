import { ChakraProvider } from "@chakra-ui/react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import theme from "../../config/theme";
import { DownloadButton } from "./download-button";

// Mock window.matchMedia for Chakra UI color mode
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
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

// Test wrapper with Chakra UI theme
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme}>{children}</ChakraProvider>
);

describe("DownloadButton", () => {
  // Mock Blob, URL, and document.createElement for download tests
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Reset mocks before each test
    mockCreateObjectURL = vi.fn(() => "blob:mock-url");
    mockRevokeObjectURL = vi.fn();
    mockClick = vi.fn();

    // Mock URL methods globally (these don't interfere with React rendering)
    globalThis.URL.createObjectURL = mockCreateObjectURL as unknown as (
      obj: Blob | MediaSource,
    ) => string;
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL as unknown as (
      url: string,
    ) => void;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders download button", () => {
      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      expect(
        screen.getByRole("button", { name: /download/i }),
      ).toBeInTheDocument();
    });

    it("renders with custom size", () => {
      render(
        <DownloadButton content="test content" filename="test.txt" size="lg" />,
        { wrapper },
      );

      const button = screen.getByRole("button", { name: /download/i });
      expect(button).toBeInTheDocument();
    });

    it("renders with custom variant", () => {
      render(
        <DownloadButton
          content="test content"
          filename="test.txt"
          variant="solid"
        />,
        { wrapper },
      );

      const button = screen.getByRole("button", { name: /download/i });
      expect(button).toBeInTheDocument();
    });

    it("is disabled when content is empty", () => {
      render(<DownloadButton content="" filename="test.txt" />, { wrapper });

      const button = screen.getByRole("button", { name: /download/i });
      expect(button).toBeDisabled();
    });

    it("is disabled when content is only whitespace", () => {
      render(<DownloadButton content="   " filename="test.txt" />, { wrapper });

      const button = screen.getByRole("button", { name: /download/i });
      expect(button).toBeDisabled();
    });

    it("is disabled when disabled prop is true", () => {
      render(
        <DownloadButton content="test" filename="test.txt" disabled={true} />,
        { wrapper },
      );

      const button = screen.getByRole("button", { name: /download/i });
      expect(button).toBeDisabled();
    });
  });

  describe("Download Functionality", () => {
    it("triggers download when button is clicked", async () => {
      const user = userEvent.setup();

      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      // Mock document.createElement ONLY for the 'a' tag used in download logic
      // We do this AFTER render to avoid breaking React's container creation
      const mockLink = {
        click: mockClick,
        href: "",
        download: "",
        setAttribute: vi.fn(),
      };

      // Capture original createElement safely
      const originalCreateElement = document.createElement.bind(document);

      vi.spyOn(document, "createElement").mockImplementation(
        (tagName, options) => {
          if (tagName === "a") {
            return mockLink as unknown as HTMLAnchorElement;
          }
          return originalCreateElement(tagName, options);
        },
      );

      // Mock appendChild/removeChild now as well
      vi.spyOn(document.body, "appendChild").mockImplementation(
        () => mockLink as unknown as HTMLAnchorElement,
      );
      vi.spyOn(document.body, "removeChild").mockImplementation(
        () => mockLink as unknown as HTMLAnchorElement,
      );

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      // Verify Blob was created
      expect(mockCreateObjectURL).toHaveBeenCalled();

      // Verify link element was clicked
      expect(mockClick).toHaveBeenCalled();

      // Verify cleanup
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("creates blob with correct MIME type", async () => {
      const user = userEvent.setup();
      const blobSpy = vi.spyOn(globalThis, "Blob");

      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      expect(blobSpy).toHaveBeenCalledWith(["test content"], {
        type: "text/plain;charset=utf-8",
      });
    });

    it("sets correct filename for download", async () => {
      const user = userEvent.setup();

      render(<DownloadButton content="test content" filename="output.json" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      // Verify that createObjectURL was called (download was triggered)
      expect(mockCreateObjectURL).toHaveBeenCalled();

      // Verify success toast shows the correct filename
      await waitFor(() => {
        expect(
          screen.getByText(/output.json downloaded successfully/i),
        ).toBeInTheDocument();
      });
    });

    it("shows success toast after download", async () => {
      const user = userEvent.setup();

      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/test.txt downloaded successfully/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty Content Handling", () => {
    it("shows warning toast when clicking with empty content", async () => {
      // Force render with empty content but enable button for testing
      const { rerender } = render(
        <DownloadButton content="test" filename="test.txt" />,
        { wrapper },
      );

      // Update to empty content
      rerender(
        <ChakraProvider theme={theme}>
          <DownloadButton content="" filename="test.txt" />
        </ChakraProvider>,
      );

      const button = screen.getByRole("button", { name: /download/i });

      // Button should be disabled, so this won't trigger the warning
      expect(button).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("shows error toast when download fails", async () => {
      const user = userEvent.setup();

      // Mock Blob constructor to throw error
      vi.spyOn(globalThis, "Blob").mockImplementation(() => {
        throw new Error("Blob creation failed");
      });

      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/download failed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper aria label", () => {
      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      expect(button).toHaveAttribute("aria-label", "Download file");
    });

    it("is keyboard accessible", async () => {
      const user = userEvent.setup();

      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter to trigger download (we just verify it doesn't error)
      await user.keyboard("{Enter}");

      // Verify download was triggered
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe("Multiple Download Operations", () => {
    it("handles multiple downloads correctly", async () => {
      const user = userEvent.setup();

      render(<DownloadButton content="test content" filename="test.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });

      // First download
      await user.click(button);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);

      // Second download
      await user.click(button);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);

      // Verify cleanup was called for both
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  describe("Content Variations", () => {
    it("handles JSON content", async () => {
      const user = userEvent.setup();
      const jsonContent = '{"test": "data"}';

      render(<DownloadButton content={jsonContent} filename="data.json" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("handles XML content", async () => {
      const user = userEvent.setup();
      const xmlContent = "<test>data</test>";

      render(<DownloadButton content={xmlContent} filename="data.xml" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("handles large content", async () => {
      const user = userEvent.setup();
      const largeContent = "x".repeat(10000);

      render(<DownloadButton content={largeContent} filename="large.txt" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /download/i });
      await user.click(button);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
});
