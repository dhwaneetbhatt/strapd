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
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toolGroups } from "../../tools";
import type { Tool, ToolGroup } from "../../types";

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
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const activeBorder = useColorModeValue("blue.200", "blue.600");
  const focusedBg = useColorModeValue("gray.100", "gray.600");
  const focusedBorder = useColorModeValue("gray.400", "gray.500");

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
        _hover={{ bg: hoverBg }}
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
                  isSelected ? activeBg : isFocused ? focusedBg : "transparent"
                }
                borderLeft="2px solid"
                borderColor={
                  isSelected
                    ? activeBorder
                    : isFocused
                      ? focusedBorder
                      : "transparent"
                }
                _hover={{ bg: isSelected ? activeBg : hoverBg }}
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
                  <Text
                    id={`tool-${tool.id}-description`}
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: "gray.400" }}
                  >
                    {tool.description}
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
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Memoize all tools to avoid recalculation on every render
  const allTools = useMemo(
    () => toolGroups.flatMap((group) => group.tools),
    [],
  );
  const [focusedToolIndex, setFocusedToolIndex] = useState(-1);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Memoize group start indices for keyboard navigation
  const groupStartIndices = useMemo(() => {
    return toolGroups.reduce(
      (acc, group, index) => {
        const startIndex = toolGroups
          .slice(0, index)
          .reduce((sum, g) => sum + g.tools.length, 0);
        acc[group.category] = startIndex;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, []);

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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || focusedToolIndex === -1) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setFocusedToolIndex((prev) =>
            Math.min(prev + 1, allTools.length - 1),
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedToolIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          if (focusedToolIndex >= 0 && focusedToolIndex < allTools.length) {
            onToolSelect(allTools[focusedToolIndex]);
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
  }, [isOpen, focusedToolIndex, allTools, onToolSelect, onToggle]);

  return (
    <>
      {/* Sidebar */}
      <Box
        ref={sidebarRef}
        w={{ base: isOpen ? "280px" : "0", md: isOpen ? "280px" : "60px" }}
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
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
              background: "gray.300",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "gray.400",
            },
          }}
        >
          {isOpen && (
            <VStack spacing={4} align="stretch">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="gray.500"
                _dark={{ color: "gray.400" }}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Developer Tools
              </Text>

              {toolGroups.map((group) => (
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
          bg="blackAlpha.600"
          zIndex={5}
          display={{ base: "block", md: "none" }}
          onClick={onToggle}
        />
      )}
    </>
  );
};
