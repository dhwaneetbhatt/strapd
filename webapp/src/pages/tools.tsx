import { HamburgerIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CommandPalette, HelpModal, ToolInterface } from "../components/common";
import { Layout, Sidebar } from "../components/layout";
import { useCommandI, useCommandR, useEscapeBlur } from "../hooks/use-keyboard";
import { getToolById } from "../tools";
import { caseConverterTool } from "../tools/string-tools";
import type { Tool } from "../types";

export const Tools: React.FC = () => {
  const { toolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState(caseConverterTool);
  const debounceRef = useRef<number>();

  // Handle URL-based tool selection and redirect logic
  useEffect(() => {
    if (toolId) {
      const tool = getToolById(toolId);
      if (tool) {
        setSelectedTool(tool);
      } else {
        // Tool not found, redirect to home page
        navigate("/", { replace: true });
      }
    } else {
      // No tool in URL, redirect to home page
      navigate("/", { replace: true });
    }
  }, [toolId, navigate]);

  const { isOpen: isSidebarOpen, onToggle: onSidebarToggle } = useDisclosure({
    defaultIsOpen:
      typeof window !== "undefined" ? window.innerWidth >= 768 : false,
  });

  const {
    isOpen: isCommandPaletteOpen,
    onOpen: onCommandPaletteOpen,
    onClose: onCommandPaletteClose,
  } = useDisclosure();

  const {
    isOpen: isHelpModalOpen,
    onOpen: onHelpModalOpen,
    onClose: onHelpModalClose,
  } = useDisclosure();

  // Set up Esc key to remove focus from inputs (tool-specific)
  useEscapeBlur();

  // Set up CMD+I to focus input (tool-specific)
  useCommandI(() => {
    const input = document.querySelector(
      '[data-testid="tool-default-input"]',
    ) as HTMLTextAreaElement;
    input?.focus();
  });

  // Set up CMD+R to reset/clear (tool-specific)
  useCommandR(() => {
    const clearButton = document.querySelector(
      '[data-testid="tool-clear-button"]',
    ) as HTMLButtonElement;
    clearButton?.click();
  });

  // Handle tool selection with auto-close sidebar and URL update
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    // Update URL to reflect selected tool
    navigate(`/tool/${tool.id}`, { replace: true });
    // Auto-close sidebar after selection (especially useful on mobile)
    if (window.innerWidth < 768 && isSidebarOpen) {
      onSidebarToggle();
    }
  };

  return (
    <Layout
      onSearchOpen={onCommandPaletteOpen}
      onHelpOpen={onHelpModalOpen}
      onSidebarToggle={onSidebarToggle}
    >
      <Box position="relative">
        {/* Mobile sidebar toggle button */}
        <IconButton
          aria-label="Toggle navigation"
          icon={<HamburgerIcon />}
          variant="ghost"
          display={{ base: "flex", md: "none" }}
          position="absolute"
          top={4}
          left={4}
          zIndex={15}
          onClick={onSidebarToggle}
        />

        <Flex>
          {/* Sidebar */}
          <Sidebar
            selectedTool={selectedTool}
            onToolSelect={handleToolSelect}
            isOpen={isSidebarOpen}
            onToggle={onSidebarToggle}
          />

          {/* Main Tool Interface */}
          <Flex flex={1} p={8}>
            <ToolInterface
              tool={selectedTool}
              initialInput={useMemo(() => {
                const params: Record<string, unknown> = {};
                searchParams.forEach((value, key) => {
                  // Parse boolean strings from URL
                  if (value === "true") {
                    params[key] = true;
                  } else if (value === "false") {
                    params[key] = false;
                  } else {
                    // Keep as string, will be converted by components/operations as needed
                    params[key] = value;
                  }
                });
                return params;
              }, [searchParams])}
              onInputChange={(inputs: Record<string, unknown>) => {
                // Debounce URL updates to prevent history spam/crashes
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                }

                debounceRef.current = setTimeout(() => {
                  // Serialize inputs to URL params
                  const params: Record<string, string> = {};
                  Object.entries(inputs).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                      params[key] = String(value);
                    }
                  });
                  setSearchParams(params, { replace: true });
                }, 300);
              }}
            />
          </Flex>
        </Flex>

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={onCommandPaletteClose}
          onToolSelect={handleToolSelect}
        />

        {/* Help Modal */}
        <HelpModal isOpen={isHelpModalOpen} onClose={onHelpModalClose} />
      </Box>
    </Layout>
  );
};
