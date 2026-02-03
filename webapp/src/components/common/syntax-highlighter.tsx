import { Box, Code, useColorMode, useToken } from "@chakra-ui/react";
import type React from "react";
import { memo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

interface SyntaxHighlighterComponentProps {
  code: string;
  language: "json" | "xml" | "yaml";
  fontSize?: string;
  maxHeight?: string;
}

// Performance threshold - fallback to plain text for very large outputs
const LARGE_FILE_THRESHOLD = 15000; // lines

/**
 * Syntax highlighting component optimized for mobile performance
 * - Uses Prism.js light build for minimal bundle impact (~12KB)
 * - Adapts to Chakra UI color mode using theme tokens
 * - Auto-fallback to plain text for files > 15,000 lines
 * - Memoized to prevent unnecessary re-renders
 */
export const SyntaxHighlighterComponent: React.FC<SyntaxHighlighterComponentProps> =
  memo(({ code, language, fontSize = "sm", maxHeight = "full" }) => {
    const { colorMode } = useColorMode();

    // Get color theme tokens for consistent styling
    const [formBg, textPrimary] = useToken("colors", [
      "form.bg",
      "text.primary",
    ]);

    // Get typography and spacing from theme
    const monoFont = useToken("fonts", "mono");
    const [fontSizeXs, fontSizeSm, fontSizeMd] = useToken("fontSizes", [
      "xs",
      "sm",
      "md",
    ]);
    const spacing4 = useToken("space", "4");

    // Count lines for performance optimization
    const lineCount = code.split("\n").length;
    const isVeryLarge = lineCount > LARGE_FILE_THRESHOLD;

    // Fallback to plain text for very large outputs
    if (isVeryLarge) {
      return (
        <Box
          as="pre"
          fontFamily="mono"
          fontSize={fontSize}
          p={4}
          bg="form.bg"
          color="text.primary"
          borderRadius="md"
          border="1px solid"
          borderColor="form.border"
          overflowX="auto"
          overflowY="auto"
          maxH={maxHeight}
          h={maxHeight}
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          <Code
            fontSize={fontSize}
            bg="transparent"
            color="text.primary"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {code}
          </Code>
        </Box>
      );
    }

    // Use theme-appropriate syntax highlighting style
    const syntaxTheme = colorMode === "dark" ? oneDark : oneLight;

    return (
      <Box
        borderRadius="md"
        border="1px solid"
        borderColor="form.border"
        overflow="hidden"
        maxH={maxHeight}
        h={maxHeight}
        position="relative"
        bg="form.bg"
      >
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          customStyle={{
            margin: 0,
            padding: spacing4,
            fontSize:
              fontSize === "xs"
                ? fontSizeXs
                : fontSize === "sm"
                  ? fontSizeSm
                  : fontSizeMd,
            fontFamily: monoFont,
            height: "100%",
            maxHeight: "100%",
            overflow: "auto",
            // Force word wrapping to prevent horizontal overflow
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            // Use theme token colors
            backgroundColor: formBg,
            color: textPrimary,
          }}
          wrapLines={true}
          wrapLongLines={true}
          showLineNumbers={false}
          PreTag="div"
          codeTagProps={{
            style: {
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </Box>
    );
  });

SyntaxHighlighterComponent.displayName = "SyntaxHighlighterComponent";
