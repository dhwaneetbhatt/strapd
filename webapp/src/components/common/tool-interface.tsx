import { Box, Text } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle } from "react";
import { TOOL_REGISTRY } from "../../tools";
import type { Tool } from "../../types";

interface ToolInterfaceProps {
  tool: Tool;
  initialInput?: string;
  onInputChange?: (input: string) => void;
}

export interface ToolInterfaceHandle {
  focusInput: () => void;
  clearAll: () => void;
}

export const ToolInterface = forwardRef<
  ToolInterfaceHandle,
  ToolInterfaceProps
>(({ tool, initialInput, onInputChange }, ref) => {
  // Look up the tool in the registry
  const toolDefinition = TOOL_REGISTRY[tool.id];

  // Expose methods to parent component via ref
  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => {
        // For now, we don't have access to the child component's methods
        // This could be enhanced by implementing refs in tool components
      },
      clearAll: () => {
        // For now, we don't have access to the child component's methods
        // This could be enhanced by implementing refs in tool components
      },
    }),
    [],
  );

  // Handle input changes and convert to the format expected by onInputChange
  const handleInputChange = (inputs: Record<string, unknown>) => {
    // For backward compatibility, pass the 'text' input as the main input
    onInputChange?.(String(inputs.text || ""));
  };

  if (!toolDefinition) {
    return (
      <Box w="full" maxW="6xl" mx="auto" p={8} textAlign="center">
        <Text color="red.500" fontSize="lg">
          Tool not found: {tool.id}
        </Text>
        <Text color="gray.600" mt={2}>
          This tool may not be implemented yet or has been removed.
        </Text>
      </Box>
    );
  }

  // Render the tool's custom component
  const ToolComponent = toolDefinition.component;

  return (
    <Box w="full" maxW="6xl" mx="auto">
      {/* Tool Description */}
      <Box
        p={4}
        bg="blue.50"
        _dark={{ bg: "blue.900" }}
        borderRadius="md"
        borderLeft="4px solid"
        borderColor="brand.500"
        mb={6}
      >
        <Text fontSize="2xl" display="inline" mr={3}>
          {tool.category === "string" ? "📝" : "🔧"}
        </Text>
        <Text
          fontSize="lg"
          fontWeight="semibold"
          color="brand.700"
          _dark={{ color: "brand.300" }}
          display="inline"
          mr={2}
        >
          {tool.name}
        </Text>
        <Text
          fontSize="sm"
          color="gray.600"
          _dark={{ color: "gray.400" }}
          display="inline"
        >
          - {tool.description}
        </Text>
      </Box>

      <ToolComponent
        tool={toolDefinition}
        initialInputs={initialInput ? { text: initialInput } : {}}
        onInputChange={handleInputChange}
      />
    </Box>
  );
});

ToolInterface.displayName = "ToolInterface";
