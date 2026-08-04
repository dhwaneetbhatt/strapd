import {
  Box,
  Divider,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { Suspense } from "react";
import { BsPinAngle, BsPinFill, BsStar, BsStarFill } from "react-icons/bs";
import { getCategoryIcon } from "../../constants/category-icons";
import { useSettings } from "../../contexts/settings-context";
import { TOOL_REGISTRY } from "../../tools";
import type { Tool } from "../../types";

interface ToolInterfaceProps {
  tool: Tool;
  initialInput?: Record<string, unknown>;
  onInputChange?: (inputs: Record<string, unknown>) => void;
}

export const ToolInterface: React.FC<ToolInterfaceProps> = ({
  tool,
  initialInput,
  onInputChange,
}) => {
  const { isFavorite, toggleFavorite, pinnedToolId, togglePinnedTool } =
    useSettings();
  const isPinned = pinnedToolId === tool.id;

  // Look up the tool in the registry
  const toolDefinition = TOOL_REGISTRY[tool.id];

  if (!toolDefinition) {
    return (
      <Box w="full" maxW="6xl" mx="auto" p={8} textAlign="center">
        <Text color="text.error" fontSize="lg">
          Tool not found: {tool.id}
        </Text>
        <Text color="text.secondary" mt={2}>
          This tool may not be implemented yet or has been removed.
        </Text>
      </Box>
    );
  }

  // Render the tool's custom component
  const ToolComponent = toolDefinition.component;
  const usesPageScroll = toolDefinition.scrollMode === "page";

  return (
    <VStack
      w="full"
      maxW={{ base: "calc(100vw - 2rem)", md: "100%" }}
      minW={0}
      h={usesPageScroll ? "auto" : "tool.container"}
      minH={usesPageScroll ? "tool.container" : undefined}
      data-scroll-mode={usesPageScroll ? "page" : "contained"}
      align="stretch"
      spacing={6}
    >
      {/* Tool Header */}
      <VStack align="stretch" spacing={4}>
        <HStack spacing={3} flexWrap="wrap" minW={0}>
          <Text fontSize="2xl">{getCategoryIcon(tool.category)}</Text>
          <Heading size="lg" color="text.primary" minW={0}>
            {tool.name}
          </Heading>

          <HStack spacing={1}>
            <IconButton
              aria-label={isPinned ? "Unpin tool" : "Pin tool"}
              icon={isPinned ? <BsPinFill /> : <BsPinAngle />}
              size="md"
              variant="action"
              color={isPinned ? "brand.500" : "text.secondary"}
              onClick={() => togglePinnedTool(tool.id)}
            />
            <IconButton
              aria-label={
                isFavorite(tool.id)
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              icon={isFavorite(tool.id) ? <BsStarFill /> : <BsStar />}
              size="md"
              variant="action"
              color={isFavorite(tool.id) ? "yellow.400" : "text.secondary"}
              onClick={() => toggleFavorite(tool.id)}
            />
          </HStack>
        </HStack>
        <Text fontSize="md" color="text.secondary" overflowWrap="anywhere">
          {tool.description}
        </Text>
        <Divider />
      </VStack>

      <Box flex={usesPageScroll ? undefined : 1} minH="0">
        <Suspense
          fallback={
            <VStack h="full" justify="center" spacing={3} role="status">
              <Spinner color="text.brand" />
              <Text color="text.secondary" fontSize="sm">
                Loading tool…
              </Text>
            </VStack>
          }
        >
          <ToolComponent
            tool={toolDefinition}
            initialInputs={initialInput || {}}
            onInputChange={onInputChange}
          />
        </Suspense>
      </Box>
    </VStack>
  );
};
