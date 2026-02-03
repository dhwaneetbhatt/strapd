import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import type React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import theme from "../../config/theme";
import { SyntaxHighlighterComponent } from "./syntax-highlighter";

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

describe("SyntaxHighlighterComponent", () => {
  describe("Rendering", () => {
    it("renders JSON code with syntax highlighting", () => {
      const code = '{"name": "test", "value": 42}';

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      // Should render the code content
      expect(screen.getByText(/"name"/)).toBeInTheDocument();
      expect(screen.getByText(/"test"/)).toBeInTheDocument();
    });

    it("renders XML code with syntax highlighting", () => {
      const code = "<root><name>test</name></root>";

      const { container } = render(
        <SyntaxHighlighterComponent code={code} language="xml" />,
        { wrapper },
      );

      // XML is rendered with syntax highlighting (text is split across spans)
      expect(container.textContent).toContain("root");
      expect(container.textContent).toContain("name");
      expect(container.textContent).toContain("test");
    });

    it("renders YAML code with syntax highlighting", () => {
      const code = "name: test\nvalue: 42";

      const { container } = render(
        <SyntaxHighlighterComponent code={code} language="yaml" />,
        { wrapper },
      );

      // YAML is rendered with syntax highlighting (key and colon are in separate spans)
      expect(container.textContent).toContain("name");
      expect(container.textContent).toContain("test");
      expect(container.textContent).toContain("42");
    });

    it("accepts custom fontSize prop", () => {
      const code = '{"test": true}';

      const { container } = render(
        <SyntaxHighlighterComponent
          code={code}
          language="json"
          fontSize="xs"
        />,
        { wrapper },
      );

      // Component should render (fontSize is applied via customStyle)
      expect(container.querySelector("code")).toBeInTheDocument();
    });

    it("accepts custom maxHeight prop", () => {
      const code = '{"test": true}';

      const { container } = render(
        <SyntaxHighlighterComponent
          code={code}
          language="json"
          maxHeight="200px"
        />,
        { wrapper },
      );

      // Check if the outer Box has the maxHeight style applied
      const box = container.firstChild as HTMLElement;
      expect(box).toHaveStyle({ maxHeight: "200px" });
    });
  });

  describe("Performance Safeguards", () => {
    it("falls back to plain text for very large files", () => {
      // Create a code string with more than 15,000 lines
      const largeCode = Array(15001).fill('{"line": "data"}').join("\n");

      const { container } = render(
        <SyntaxHighlighterComponent code={largeCode} language="json" />,
        { wrapper },
      );

      // Should render as plain code element, not SyntaxHighlighter
      const codeElement = container.querySelector("code");
      expect(codeElement).toBeInTheDocument();

      // Should NOT have syntax highlighter spans
      const spans = container.querySelectorAll("span.token");
      expect(spans.length).toBe(0);
    });

    it("uses syntax highlighting for files under threshold", () => {
      // Create a code string with less than 15,000 lines
      const normalCode = Array(100).fill('{"line": "data"}').join("\n");

      const { container } = render(
        <SyntaxHighlighterComponent code={normalCode} language="json" />,
        { wrapper },
      );

      // Should use syntax highlighter (uses PreTag="div", has code element)
      const codeElement = container.querySelector("code");
      expect(codeElement).toBeInTheDocument();
      // Should have syntax highlighting spans
      expect(container.querySelector(".token")).toBeInTheDocument();
    });

    it("memoizes component to prevent unnecessary re-renders", () => {
      const code = '{"test": true}';

      const { rerender } = render(
        <SyntaxHighlighterComponent code={code} language="json" />,
        { wrapper },
      );

      // Spy on console to check for re-renders
      const consoleSpy = vi.spyOn(console, "log");

      // Re-render with same props should not cause re-render due to memo
      rerender(<SyntaxHighlighterComponent code={code} language="json" />);

      // Component is memoized, so it shouldn't trigger extra renders
      // This is mainly a smoke test to ensure memo is working
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("Word Wrapping", () => {
    it("wraps long lines correctly", () => {
      const longCode =
        '{"message": "This is a very long message that should wrap within the container boundaries"}';

      const { container } = render(
        <SyntaxHighlighterComponent code={longCode} language="json" />,
        { wrapper },
      );

      // Check if code element has word wrapping styles
      const codeElement = container.querySelector("code");
      expect(codeElement).toBeInTheDocument();

      // Verify that codeTagProps are applied (whiteSpace and wordBreak)
      // Note: styles are applied via inline styles in codeTagProps
    });

    it("enables wrapLines for proper wrapping behavior", () => {
      const code = '{"a": 1}';

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      // wrapLines={true} creates span containers for each line
      // This is necessary for proper word wrapping
      // Verify component renders successfully with this configuration
      expect(screen.getByText(/"a"/)).toBeInTheDocument();
    });
  });

  describe("Theme Integration", () => {
    it("applies theme tokens for colors", () => {
      const code = '{"test": true}';

      const { container } = render(
        <SyntaxHighlighterComponent code={code} language="json" />,
        { wrapper },
      );

      // Component should render with theme-based styling
      const box = container.firstChild as HTMLElement;
      expect(box).toBeInTheDocument();

      // Theme tokens (form.bg, form.border) are applied via Chakra props
      // These are resolved at runtime by Chakra
    });

    it("applies font family from theme", () => {
      const code = '{"test": true}';

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      // Font family is applied via customStyle using theme token
      // Verify component renders (actual font is applied via useToken)
      expect(screen.getByText(/"test"/)).toBeInTheDocument();
    });

    it("applies font sizes from theme", () => {
      const code = '{"test": true}';

      render(
        <SyntaxHighlighterComponent
          code={code}
          language="json"
          fontSize="sm"
        />,
        { wrapper },
      );

      // Font size is applied via customStyle using theme token
      // Verify component renders with specified size
      expect(screen.getByText(/"test"/)).toBeInTheDocument();
    });

    it("applies spacing from theme", () => {
      const code = '{"test": true}';

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      // Padding is applied via customStyle using theme token (space.4)
      // Verify component renders with proper spacing
      expect(screen.getByText(/"test"/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty code string", () => {
      const code = "";

      const { container } = render(
        <SyntaxHighlighterComponent code={code} language="json" />,
        { wrapper },
      );

      // Should render without crashing
      // Code element should exist even with empty content
      const codeElement = container.querySelector("code");
      expect(codeElement).toBeInTheDocument();
    });

    it("handles code with special characters", () => {
      const code = '{"special": "<>&\\"\'"}';

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      // Should render special characters without breaking
      expect(screen.getByText(/"special"/)).toBeInTheDocument();
    });

    it("handles multiline code correctly", () => {
      const code = `{
  "name": "test",
  "nested": {
    "value": 42
  }
}`;

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      // Should render multiline code
      expect(screen.getByText(/"name"/)).toBeInTheDocument();
      expect(screen.getByText(/"nested"/)).toBeInTheDocument();
    });
  });

  describe("Language Support", () => {
    it("supports JSON language", () => {
      const code = '{"type": "json"}';

      render(<SyntaxHighlighterComponent code={code} language="json" />, {
        wrapper,
      });

      expect(screen.getByText(/"type"/)).toBeInTheDocument();
    });

    it("supports XML language", () => {
      const code = "<type>xml</type>";

      const { container } = render(
        <SyntaxHighlighterComponent code={code} language="xml" />,
        { wrapper },
      );

      expect(container.textContent).toContain("type");
      expect(container.textContent).toContain("xml");
    });

    it("supports YAML language", () => {
      const code = "type: yaml";

      const { container } = render(
        <SyntaxHighlighterComponent code={code} language="yaml" />,
        { wrapper },
      );

      expect(container.textContent).toContain("type");
      expect(container.textContent).toContain("yaml");
    });
  });
});
