import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandPalette, HelpModal } from "../components/common";
import { Layout, Sidebar } from "../components/layout";
import { getCategoryIcon } from "../constants/category-icons";
import { toolGroups } from "../tools";
import { caseConverterTool } from "../tools/string-tools";
import type { Tool } from "../types";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState(caseConverterTool);

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

  const handleToolClick = (toolId: string) => {
    navigate(`/tool/${toolId}`);
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    navigate(`/tool/${tool.id}`);
    onCommandPaletteClose();
    // Auto-close sidebar after selection (especially useful on mobile)
    if (window.innerWidth < 768 && isSidebarOpen) {
      onSidebarToggle();
    }
  };

  // Flatten all tools from all groups
  const allTools = toolGroups.flatMap((group) => group.tools);

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

          {/* Main Home Content */}
          <Flex flex={1} p={8} w="full" justify="center">
            <Box w="full" maxW="1200px">
              {/* Header */}
              <VStack spacing={8} mb={12} align="center" textAlign="center">
                <VStack spacing={2}>
                  <Heading size="2xl" color="text.primary">
                    strapd 🛠️
                  </Heading>
                  <Text fontSize="lg" color="text.secondary">
                    Developer toolkit for common utilities
                  </Text>
                </VStack>
              </VStack>

              {/* All Tools Grid */}
              <Grid
                templateColumns={{
                  base: "repeat(1, 1fr)",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)",
                }}
                gap={6}
              >
                {allTools.map((tool) => (
                  <GridItem
                    key={tool.id}
                    as="button"
                    onClick={() => handleToolClick(tool.id)}
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="border.base"
                    bg="surface.muted"
                    minH="200px"
                    _hover={{
                      borderColor: "border.hover",
                      bg: "bg.hover",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    _active={{
                      transform: "translateY(0)",
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    cursor="pointer"
                    textAlign="left"
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                  >
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack spacing={2}>
                        <Text fontSize="lg">
                          {getCategoryIcon(tool.category)}
                        </Text>
                        <Heading size="sm" color="text.primary">
                          {tool.name}
                        </Heading>
                      </HStack>
                      <Text
                        fontSize="sm"
                        color="text.secondary"
                        textAlign="left"
                        flex={1}
                        noOfLines={2}
                      >
                        {tool.description}
                      </Text>
                    </VStack>
                  </GridItem>
                ))}
              </Grid>
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={onCommandPaletteClose}
        onToolSelect={handleToolSelect}
      />

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={onHelpModalClose} />
    </Layout>
  );
};
