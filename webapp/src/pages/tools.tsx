import { HamburgerIcon } from "@chakra-ui/icons";
import { Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CommandPalette, HelpModal, ToolInterface } from "../components/common";
import { Layout, Sidebar } from "../components/layout";
import {
  useCommandH,
  useCommandI,
  useCommandK,
  useCommandR,
  useEscapeBlur,
  useHelpKey,
} from "../hooks/use-keyboard";
import { getToolById } from "../tools";
import { uppercaseTool } from "../tools/string-tools";
import type { Tool } from "../types";

export const Tools: React.FC = () => {
  const { toolId } = useParams<{ toolId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState(uppercaseTool);

  // Handle URL-based tool selection and default tool redirect
  useEffect(() => {
    if (toolId) {
      const tool = getToolById(toolId);
      if (tool) {
        setSelectedTool(tool);
      } else {
        // Tool not found, redirect to default tool
        navigate(`/tool/${uppercaseTool.id}`, { replace: true });
      }
    } else {
      // No tool in URL, redirect to default tool
      navigate(`/tool/${uppercaseTool.id}`, { replace: true });
    }
  }, [toolId, navigate]);

  const { isOpen: isSidebarOpen, onToggle: onSidebarToggle } = useDisclosure({
    defaultIsOpen: false,
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

  // Set up CMD+K shortcut for search
  useCommandK(onCommandPaletteOpen);

  // Set up CMD+H shortcut for sidebar toggle
  useCommandH(onSidebarToggle);

  // Set up "." key shortcut for help modal
  useHelpKey(onHelpModalOpen);

  // Set up Esc key to remove focus from inputs
  useEscapeBlur();

  // Set up CMD+I to focus input
  useCommandI(() => {
    const input = document.querySelector(
      '[data-testid="tool-default-input"]',
    ) as HTMLTextAreaElement;
    input?.focus();
  });

  // Set up CMD+R to reset/clear
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
    if (isSidebarOpen) {
      onSidebarToggle();
    }
  };

  return (
    <Layout onSearchOpen={onCommandPaletteOpen} onHelpOpen={onHelpModalOpen}>
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
              initialInput={searchParams.get("input") || ""}
              onInputChange={(input: string) => {
                if (input.trim()) {
                  setSearchParams({ input }, { replace: true });
                } else {
                  setSearchParams({}, { replace: true });
                }
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
