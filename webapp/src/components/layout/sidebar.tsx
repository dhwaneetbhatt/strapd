import {
  ChevronDownIcon,
  ChevronRightIcon,
  HamburgerIcon,
} from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Collapse,
  HStack,
  IconButton,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "../../contexts/settings-context";
import { toolGroups } from "../../tools";
import type { Tool, ToolCategory, ToolGroup } from "../../types";

const FOCUS_DELAY = 100; // Configurable constant instead of magic number

interface SidebarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface ToolGroupSectionProps {
  group: ToolGroup;
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  focusedToolIndex: number;
  groupStartIndex: number;
}

const ToolGroupSection: React.FC<ToolGroupSectionProps> = ({
  group,
  selectedTool,
  onToolSelect,
  focusedToolIndex,
  groupStartIndex,
}) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  return (
    <Box w="full">
      {/* Group Header */}
      <Button
        variant="ghost"
        justifyContent="flex-start"
        w="full"
        p={3}
        h="auto"
        fontWeight="medium"
        onClick={onToggle}
        leftIcon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        _hover={{ bg: "sidebar.item.hover" }}
      >
        <HStack spacing={2} flex={1}>
          <Text>{group.icon}</Text>
          <Text fontSize="sm">{group.name}</Text>
          <Spacer />
          <Badge size="sm" colorScheme="gray" variant="subtle">
            {group.tools.length}
          </Badge>
        </HStack>
      </Button>

      {/* Group Tools */}
      <Collapse in={isOpen}>
        <VStack spacing={1} align="stretch" pl={6} pr={2}>
          {group.tools.map((tool, toolIndex) => {
            const globalToolIndex = groupStartIndex + toolIndex;
            const isFocused = focusedToolIndex === globalToolIndex;
            const isSelected = selectedTool.id === tool.id;

            return (
              <Button
                key={tool.id}
                variant="ghost"
                justifyContent="flex-start"
                size="sm"
                w="full"
                py={2}
                px={3}
                h="auto"
                fontWeight="normal"
                onClick={() => onToolSelect(tool)}
                bg={
                  isSelected
                    ? "sidebar.item.active"
                    : isFocused
                      ? "sidebar.item.focused"
                      : "transparent"
                }
                borderLeft="2px solid"
                borderColor={
                  isSelected
                    ? "sidebar.border.active"
                    : isFocused
                      ? "sidebar.border.focused"
                      : "transparent"
                }
                _hover={{
                  bg: isSelected ? "sidebar.item.active" : "sidebar.item.hover",
                }}
                borderRadius="md"
                textAlign="left"
                aria-current={isSelected ? "page" : undefined}
                aria-describedby={
                  isFocused ? `tool-${tool.id}-description` : undefined
                }
              >
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    {tool.name}
                  </Text>
                </VStack>
              </Button>
            );
          })}
        </VStack>
      </Collapse>
    </Box>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTool,
  onToolSelect,
  isOpen,
  onToggle,
}) => {
  // Memoize all tools to avoid recalculation on every render
  const allTools = useMemo(
    () => toolGroups.flatMap((group) => group.tools),
    [],
  );
  const [focusedToolIndex, setFocusedToolIndex] = useState(-1);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { favorites } = useSettings();

  // Create Favorites Group
  const favoritesGroup = useMemo(() => {
    const favoriteTools = allTools.filter((tool) =>
      favorites.includes(tool.id),
    );
    return {
      name: "Favorites",
      category: "favorites" as ToolCategory,
      icon: "⭐",
      description: "Your favorite tools",
      tools: favoriteTools,
    };
  }, [allTools, favorites]);

  // Combined groups for display, favorites first if any exist
  const displayGroups = useMemo(() => {
    if (favoritesGroup.tools.length > 0) {
      return [favoritesGroup, ...toolGroups];
    }
    return toolGroups;
  }, [favoritesGroup]);

  // Memoize group start indices for keyboard navigation
  const groupStartIndices = useMemo(() => {
    return displayGroups.reduce(
      (acc, group, index) => {
        const startIndex = displayGroups
          .slice(0, index)
          .reduce((sum, g) => sum + g.tools.length, 0);
        acc[group.category] = startIndex;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [displayGroups]);

  // Reset focus when sidebar opens/closes
  useEffect(() => {
    if (isOpen) {
      setFocusedToolIndex(0); // Focus first tool when opening
      // Focus the sidebar container for keyboard events
      setTimeout(() => {
        sidebarRef.current?.focus();
      }, FOCUS_DELAY);
    } else {
      setFocusedToolIndex(-1);
    }
  }, [isOpen]);

  // Reset sidebar focus when a tool is selected
  // This prevents Enter key in tool inputs from triggering sidebar navigation
  useEffect(() => {
    if (selectedTool) {
      setFocusedToolIndex(-1);
      // Blur the sidebar to remove focus
      sidebarRef.current?.blur();
    }
  }, [selectedTool.id, selectedTool]);

  // Handle keyboard navigation
  useEffect(() => {
    const totalTools = displayGroups.reduce(
      (acc, group) => acc + group.tools.length,
      0,
    );
    const flattenedTools = displayGroups.flatMap((g) => g.tools);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || focusedToolIndex === -1) return;

      // Don't handle keyboard events if a modal is open (e.g., command palette)
      // Check for Chakra UI modal overlay which indicates a modal is active
      const isModalOpen = document.querySelector('[role="dialog"]') !== null;
      if (isModalOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedToolIndex((prev) => Math.min(prev + 1, totalTools - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedToolIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          if (focusedToolIndex >= 0 && focusedToolIndex < totalTools) {
            onToolSelect(flattenedTools[focusedToolIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onToggle();
          break;
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, focusedToolIndex, displayGroups, onToolSelect, onToggle]);

  return (
    <>
      {/* Sidebar */}
      <Box
        ref={sidebarRef}
        w={{ base: isOpen ? "280px" : "0", md: isOpen ? "280px" : "60px" }}
        bg="sidebar.bg"
        borderRight="1px"
        borderColor="sidebar.border"
        transition="width 0.2s"
        overflow="hidden"
        position={{ base: "fixed", md: "relative" }}
        left={{ base: 0, md: "auto" }}
        top={{ base: 0, md: "auto" }}
        h={{ base: "100vh", md: "100vh" }}
        zIndex={{ base: 10, md: "auto" }}
        flexShrink={0}
        tabIndex={-1}
        outline="none"
        role="navigation"
        aria-label="Developer tools navigation"
        aria-expanded={isOpen}
      >
        {/* Toggle Button - Desktop */}
        <IconButton
          aria-label="Toggle sidebar"
          icon={<HamburgerIcon />}
          variant="ghost"
          size="sm"
          position="absolute"
          top={2}
          right={2}
          display={{ base: "none", md: "flex" }}
          onClick={onToggle}
        />

        {/* Sidebar Content */}
        <Box
          p={4}
          pt={8}
          height="100%"
          overflowY="auto"
          sx={{
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "border.base",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "border.hover",
            },
          }}
        >
          {isOpen && (
            <VStack spacing={4} align="stretch">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Text Tools
              </Text>

              {displayGroups.map((group) => (
                <ToolGroupSection
                  key={group.category}
                  group={group}
                  selectedTool={selectedTool}
                  onToolSelect={onToolSelect}
                  focusedToolIndex={focusedToolIndex}
                  groupStartIndex={groupStartIndices[group.category]}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Box>

      {/* Overlay for mobile */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="overlay.base"
          zIndex={5}
          display={{ base: "block", md: "none" }}
          onClick={onToggle}
        />
      )}
    </>
  );
};
