import { ChakraProvider } from "@chakra-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../config/theme";
import { FileUploadButton } from "./file-upload-button";

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

describe("FileUploadButton", () => {
  describe("Rendering", () => {
    it("renders upload button", () => {
      const mockOnFileLoad = vi.fn();
      render(<FileUploadButton onFileLoad={mockOnFileLoad} />, { wrapper });

      expect(
        screen.getByRole("button", { name: /upload file/i }),
      ).toBeInTheDocument();
    });

    it("renders with custom size", () => {
      const mockOnFileLoad = vi.fn();
      render(<FileUploadButton onFileLoad={mockOnFileLoad} size="lg" />, {
        wrapper,
      });

      const button = screen.getByRole("button", { name: /upload file/i });
      expect(button).toBeInTheDocument();
    });

    it("renders drop zone when showDropZone is true", () => {
      const mockOnFileLoad = vi.fn();
      render(<FileUploadButton onFileLoad={mockOnFileLoad} showDropZone />, {
        wrapper,
      });

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });
  });

  describe("File Upload", () => {
    it("calls onFileLoad with file content when valid file is selected", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      render(<FileUploadButton onFileLoad={mockOnFileLoad} />, { wrapper });

      const fileInput = screen.getByLabelText(/upload file input/i);
      const file = new File(['{"test": true}'], "test.json", {
        type: "application/json",
      });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith(
          '{"test": true}',
          "test.json",
        );
      });
    });

    it("accepts multiple file extensions", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      render(
        <FileUploadButton
          onFileLoad={mockOnFileLoad}
          acceptedExtensions={[".json", ".xml", ".yaml"]}
        />,
        { wrapper },
      );

      const fileInput = screen.getByLabelText(/upload file input/i);

      // Test JSON file
      const jsonFile = new File(['{"test": true}'], "test.json", {
        type: "application/json",
      });
      await user.upload(fileInput, jsonFile);

      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith(
          '{"test": true}',
          "test.json",
        );
      });

      // Test XML file
      const xmlFile = new File(["<test>true</test>"], "test.xml", {
        type: "application/xml",
      });
      await user.upload(fileInput, xmlFile);

      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith(
          "<test>true</test>",
          "test.xml",
        );
      });
    });
  });

  describe("File Validation", () => {
    it("rejects files exceeding size limit", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      // Set max size to 1KB
      render(
        <FileUploadButton onFileLoad={mockOnFileLoad} maxSizeInBytes={1024} />,
        { wrapper },
      );

      const fileInput = screen.getByLabelText(/upload file input/i);

      // Create a file larger than 1KB
      const largeContent = "x".repeat(2000);
      const largeFile = new File([largeContent], "large.json", {
        type: "application/json",
      });

      await user.upload(fileInput, largeFile);

      // Wait to ensure FileReader completes
      await waitFor(() => {
        // onFileLoad should NOT be called
        expect(mockOnFileLoad).not.toHaveBeenCalled();
      });

      // Should show error toast (check for error message in document)
      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
      });
    });

    it("rejects files with unsupported extensions", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      render(
        <FileUploadButton
          onFileLoad={mockOnFileLoad}
          acceptedExtensions={[".json"]}
        />,
        { wrapper },
      );

      const fileInput = screen.getByLabelText(/upload file input/i);

      // Try to upload a .pdf file
      const pdfFile = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await user.upload(fileInput, pdfFile);

      await waitFor(() => {
        expect(mockOnFileLoad).not.toHaveBeenCalled();
      });
    });

    it("accepts files with default extensions", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      render(<FileUploadButton onFileLoad={mockOnFileLoad} />, { wrapper });

      const fileInput = screen.getByLabelText(/upload file input/i);

      // Test each default extension
      const testFiles = [
        { name: "test.json", content: '{"test": true}' },
        { name: "test.xml", content: "<test>true</test>" },
        { name: "test.yaml", content: "test: true" },
        { name: "test.yml", content: "test: true" },
        { name: "test.txt", content: "test content" },
      ];

      for (const { name, content } of testFiles) {
        const file = new File([content], name, { type: "text/plain" });
        await user.upload(fileInput, file);

        await waitFor(() => {
          expect(mockOnFileLoad).toHaveBeenCalledWith(content, name);
        });

        mockOnFileLoad.mockClear();
      }
    });
  });

  describe("User Interaction", () => {
    it("opens file picker when button is clicked", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      render(<FileUploadButton onFileLoad={mockOnFileLoad} />, { wrapper });

      const button = screen.getByRole("button", { name: /upload file/i });
      const fileInput = screen.getByLabelText(
        /upload file input/i,
      ) as HTMLInputElement;

      // Mock click on hidden input
      const clickSpy = vi.spyOn(fileInput, "click");

      await user.click(button);

      expect(clickSpy).toHaveBeenCalled();

      clickSpy.mockRestore();
    });

    it("resets input value after file selection", async () => {
      const mockOnFileLoad = vi.fn();
      const user = userEvent.setup();

      render(<FileUploadButton onFileLoad={mockOnFileLoad} />, { wrapper });

      const fileInput = screen.getByLabelText(
        /upload file input/i,
      ) as HTMLInputElement;
      const file = new File(['{"test": true}'], "test.json", {
        type: "application/json",
      });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalled();
        // Input should be reset to allow same file to be uploaded again
        expect(fileInput.value).toBe("");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper aria labels", () => {
      const mockOnFileLoad = vi.fn();
      render(<FileUploadButton onFileLoad={mockOnFileLoad} />, { wrapper });

      expect(screen.getByLabelText(/upload file input/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /upload file/i }),
      ).toBeInTheDocument();
    });

    it("file input has correct accept attribute", () => {
      const mockOnFileLoad = vi.fn();
      render(
        <FileUploadButton
          onFileLoad={mockOnFileLoad}
          acceptedExtensions={[".json", ".xml"]}
        />,
        { wrapper },
      );

      const fileInput = screen.getByLabelText(/upload file input/i);
      expect(fileInput).toHaveAttribute("accept", ".json,.xml");
    });
  });
});
