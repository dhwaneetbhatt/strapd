import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Container,
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
import { uppercaseTool } from "../tools/string-tools";
import type { Tool } from "../types";

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState(uppercaseTool);

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

  const handleToolClick = (toolId: string) => {
    navigate(`/tool/${toolId}`);
  };

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    navigate(`/tool/${tool.id}`);
    onCommandPaletteClose();
    // Auto-close sidebar after selection (especially useful on mobile)
    if (isSidebarOpen) {
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

          {/* Main Home Content */}
          <Flex flex={1} p={8}>
            <Container maxW="6xl">
              <VStack spacing={8} align="stretch">
                {/* Tool Categories */}
                {toolGroups.map((group) => (
                  <Box key={group.category}>
                    {/* Category Header */}
                    <HStack spacing={3} mb={6}>
                      <Text fontSize="3xl">
                        {getCategoryIcon(group.category)}
                      </Text>
                      <VStack align="start" spacing={0}>
                        <Heading size="lg" color="text.primary">
                          {group.name}
                        </Heading>
                        <Text fontSize="md" color="text.secondary">
                          {group.description}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Tool Cards Grid */}
                    <Grid
                      templateColumns={{
                        base: "repeat(auto-fill, minmax(160px, 1fr))",
                        md: "repeat(auto-fill, minmax(180px, 1fr))",
                      }}
                      gap={3}
                      mb={6}
                    >
                      {group.tools.map((tool) => (
                        <GridItem
                          key={tool.id}
                          as="button"
                          onClick={() => handleToolClick(tool.id)}
                          p={3}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="border.base"
                          bg="surface.muted"
                          _hover={{
                            borderColor: "border.hover",
                            bg: "bg.hover",
                            transform: "translateY(-1px)",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                          }}
                          _active={{
                            transform: "translateY(0)",
                          }}
                          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                          cursor="pointer"
                          textAlign="left"
                          aspectRatio="1"
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
                ))}
              </VStack>
            </Container>
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
