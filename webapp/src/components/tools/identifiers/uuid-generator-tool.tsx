import {
  FormControl,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useProcessOnChange } from "../../../hooks/use-tool-processing";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const UuidGeneratorToolComponent: React.FC<BaseToolProps> = ({
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
  } = useBaseTool(tool, {
    version: "v4",
    count: 1,
    ...initialInputs,
  });

  // Process only when version or count changes
  useProcessOnChange(processInputs, [inputs.version, inputs.count]);

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={4}>
          <FormControl maxW="xs">
            <FormLabel>UUID Version</FormLabel>
            <Select
              value={String(inputs.version || "v4")}
              onChange={(e) => {
                updateInput("version", e.target.value);
                onInputChange?.({ ...inputs, version: e.target.value });
              }}
              bg="form.bg"
            >
              <option value="v4">UUID v4 (Random)</option>
              <option value="v7">UUID v7 (Timestamp-based)</option>
            </Select>
          </FormControl>

          <FormControl maxW="xs">
            <FormLabel>Count</FormLabel>
            <NumberInput
              value={Number(inputs.count || 1)}
              onChange={(_, valueAsNumber) => {
                const count = Number.isNaN(valueAsNumber) ? 1 : valueAsNumber;
                updateInput("count", count);
                onInputChange?.({ ...inputs, count });
              }}
              min={1}
              max={100}
              bg="form.bg"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <VStack align="stretch" spacing={3}>
          <HStack minH="8">
            <Text fontSize="sm" fontWeight="medium" color="text.secondary">
              Generated UUIDs
            </Text>
            <Spacer />
          </HStack>
          <Textarea
            value={String(outputs.result || "")}
            placeholder="UUIDs will appear here..."
            rows={12}
            fontFamily="mono"
            fontSize="sm"
            isReadOnly
            bg="tool.output.bg"
          />
        </VStack>
      </VStack>
    </BaseToolLayout>
  );
};
