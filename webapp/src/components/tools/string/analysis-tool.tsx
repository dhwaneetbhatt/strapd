import {
  Box,
  HStack,
  SimpleGrid,
  Spacer,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

const StatBox: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <Box p={4} borderWidth="1px" borderRadius="lg" bg="bg.surface">
    <Stat>
      <StatLabel color="text.secondary">{label}</StatLabel>
      <StatNumber fontSize="2xl" color="text.primary">
        {value}
      </StatNumber>
    </Stat>
  </Box>
);

export const AnalysisToolComponent: React.FC<BaseToolProps> = ({
  tool,
  initialInputs,
  onInputChange,
}) => {
  const {
    inputs,
    outputs,
    isProcessing,
    error,
    updateInput,
    processInputs,
    clearAll,
  } = useBaseTool(tool, initialInputs, onInputChange);

  // Auto-process as user types
  useAutoProcess(processInputs, inputs);

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <HStack spacing={6} align="start" alignItems="stretch">
        {/* Input Section */}
        <VStack flex={1} align="stretch" spacing={3}>
          <HStack minH="8">
            <Text fontSize="sm" fontWeight="medium" color="text.secondary">
              Input Text
            </Text>
            <Spacer />
          </HStack>
          <Textarea
            data-testid="tool-default-input"
            value={String(inputs.text || "")}
            onChange={(e) => {
              updateInput("text", e.target.value);
            }}
            placeholder="Enter text to analyze..."
            size="lg"
            resize="vertical"
            rows={12}
            fontFamily="mono"
            fontSize="sm"
            h="full"
          />
        </VStack>

        {/* Output Section */}
        <VStack flex={1} align="stretch" spacing={4}>
          <HStack minH="8">
            <Text fontSize="sm" fontWeight="medium" color="text.secondary">
              Analysis Results
            </Text>
          </HStack>
          <SimpleGrid columns={2} spacing={4}>
            <StatBox
              label="Lines"
              value={outputs.lines ? String(outputs.lines) : "-"}
            />
            <StatBox
              label="Words"
              value={outputs.words ? String(outputs.words) : "-"}
            />
            <StatBox
              label="Characters"
              value={outputs.chars ? String(outputs.chars) : "-"}
            />
            <StatBox
              label="Bytes"
              value={outputs.bytes ? String(outputs.bytes) : "-"}
            />
          </SimpleGrid>
        </VStack>
      </HStack>
    </BaseToolLayout>
  );
};
