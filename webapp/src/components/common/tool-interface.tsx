import { StarIcon } from "@chakra-ui/icons";
import {
  Box,
  Divider,
  Heading,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { BsPinAngle, BsPinFill } from "react-icons/bs";
import { FiStar } from "react-icons/fi";
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
  const { isFavorite, toggleFavorite, pinnedToolId, setPinnedToolId } =
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

  return (
    <VStack w="full" h="tool.container" align="stretch" spacing={6}>
      {/* Tool Header */}
      <VStack align="stretch" spacing={4}>
        <HStack spacing={3}>
          <Text fontSize="2xl">{getCategoryIcon(tool.category)}</Text>
          <Heading size="lg" color="text.primary">
            {tool.name}
          </Heading>

          <HStack spacing={1}>
            <IconButton
              aria-label={isPinned ? "Unpin tool" : "Pin tool"}
              icon={isPinned ? <BsPinFill /> : <BsPinAngle />}
              size="md"
              variant="action"
              color={isPinned ? "brand.500" : "text.secondary"}
              onClick={() => setPinnedToolId(tool.id)}
            />
            <IconButton
              aria-label={
                isFavorite(tool.id)
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              icon={isFavorite(tool.id) ? <StarIcon /> : <FiStar />}
              size="md"
              variant="action"
              color={isFavorite(tool.id) ? "yellow.400" : "text.secondary"}
              onClick={() => toggleFavorite(tool.id)}
            />
          </HStack>
        </HStack>
        <Text fontSize="md" color="text.secondary">
          {tool.description}
        </Text>
        <Divider />
      </VStack>

      <Box flex={1} minH="0">
        <ToolComponent
          tool={toolDefinition}
          initialInputs={initialInput || {}}
          onInputChange={onInputChange}
        />
      </Box>
    </VStack>
  );
};
