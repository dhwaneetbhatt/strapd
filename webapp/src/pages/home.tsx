import { HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Switch,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useState } from "react";
import { BsPinAngle, BsPinFill, BsStar, BsStarFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { CommandPalette, HelpModal } from "../components/common";
import { Layout, Sidebar } from "../components/layout";
import { getCategoryIcon } from "../constants/category-icons";
import { useSettings } from "../contexts/settings-context";
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
  const {
    isFavorite,
    toggleFavorite,
    pinnedToolId,
    togglePinnedTool,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
  } = useSettings();

  const displayedTools = showFavoritesOnly
    ? allTools.filter((tool) => isFavorite(tool.id))
    : allTools;

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

                  <HStack spacing={4} mt={4}>
                    <HStack
                      as="label"
                      cursor="pointer"
                      spacing={2}
                      p={2}
                      borderRadius="md"
                      _hover={{ bg: "surface.muted" }}
                    >
                      <Text fontSize="sm" fontWeight="medium">
                        Show Favorites Only
                      </Text>
                      <Switch
                        isChecked={showFavoritesOnly}
                        onChange={toggleShowFavoritesOnly}
                        colorScheme="brand"
                      />
                    </HStack>
                  </HStack>
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
                {displayedTools.map((tool) => {
                  const isPinned = pinnedToolId === tool.id;
                  const isFav = isFavorite(tool.id);

                  return (
                    <GridItem
                      key={tool.id}
                      as="div"
                      position="relative"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="border.base"
                      bg="surface.muted"
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
                      minH="200px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                    >
                      <Box
                        as="button"
                        onClick={() => handleToolClick(tool.id)}
                        p={4}
                        w="full"
                        h="full"
                        textAlign="left"
                        display="flex"
                        flexDirection="column"
                      >
                        <VStack align="start" spacing={2} flex={1} w="full">
                          <HStack spacing={2} w="full">
                            <Text fontSize="lg">
                              {getCategoryIcon(tool.category)}
                            </Text>
                            <Heading
                              size="sm"
                              color="text.primary"
                              noOfLines={1}
                              flex={1}
                            >
                              {tool.name}
                            </Heading>
                            {/* Actions */}
                            <HStack
                              spacing={1}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconButton
                                aria-label={
                                  isPinned ? "Unpin tool" : "Pin tool"
                                }
                                icon={isPinned ? <BsPinFill /> : <BsPinAngle />}
                                size="sm"
                                variant="action"
                                color={
                                  isPinned ? "brand.500" : "text.secondary"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePinnedTool(tool.id);
                                }}
                              />
                              <IconButton
                                aria-label={
                                  isFav
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }
                                icon={isFav ? <BsStarFill /> : <BsStar />}
                                size="sm"
                                variant="action"
                                color={isFav ? "yellow.400" : "text.secondary"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(tool.id);
                                }}
                              />
                            </HStack>
                          </HStack>
                          <Text
                            fontSize="sm"
                            color="text.secondary"
                            textAlign="left"
                            flex={1}
                            noOfLines={2}
                            w="full"
                          >
                            {tool.description}
                          </Text>
                        </VStack>
                      </Box>
                    </GridItem>
                  );
                })}
              </Grid>

              {displayedTools.length === 0 && (
                <Box textAlign="center" py={12}>
                  <Text color="text.secondary">
                    No tools found matching your criteria.
                  </Text>
                  {showFavoritesOnly && (
                    <Button
                      variant="link"
                      colorScheme="brand"
                      onClick={toggleShowFavoritesOnly}
                      mt={2}
                    >
                      Show all tools
                    </Button>
                  )}
                </Box>
              )}
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
