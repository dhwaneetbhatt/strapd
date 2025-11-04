import { Box, Divider, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import type React from "react";
import { getCategoryIcon } from "../../constants/category-icons";
import { TOOL_REGISTRY } from "../../tools";
import type { Tool } from "../../types";

interface ToolInterfaceProps {
  tool: Tool;
  initialInput?: string;
  onInputChange?: (input: string) => void;
}

export const ToolInterface: React.FC<ToolInterfaceProps> = ({
  tool,
  initialInput,
  onInputChange,
}) => {
  // Look up the tool in the registry
  const toolDefinition = TOOL_REGISTRY[tool.id];

  // Handle input changes and convert to the format expected by onInputChange
  const handleInputChange = (inputs: Record<string, unknown>) => {
    // For backward compatibility, pass the 'text' input as the main input
    onInputChange?.(String(inputs.text || ""));
  };

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
    <Box w="full" maxW="6xl" mx="auto">
      {/* Tool Header */}
      <VStack align="stretch" spacing={4} mb={6}>
        <HStack spacing={3}>
          <Text fontSize="2xl">{getCategoryIcon(tool.category)}</Text>
          <Heading size="lg" color="text.primary">
            {tool.name}
          </Heading>
        </HStack>
        <Text fontSize="md" color="text.secondary">
          {tool.description}
        </Text>
        <Divider />
      </VStack>

      <ToolComponent
        tool={toolDefinition}
        initialInputs={initialInput ? { text: initialInput } : {}}
        onInputChange={handleInputChange}
      />
    </Box>
  );
};
