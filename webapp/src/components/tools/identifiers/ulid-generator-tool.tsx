import {
  FormControl,
  FormLabel,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect } from "react";
import { useProcessOnChange } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const UlidGeneratorToolComponent: React.FC<BaseToolProps> = ({
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
  } = useBaseTool(
    tool,
    {
      count: 1,
      ...initialInputs,
    },
    onInputChange,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: processInputs causes infinite loop
  useEffect(() => {
    processInputs();
  }, []);

  // Process only when count changes
  useProcessOnChange(processInputs, [Number(inputs.count)]);

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
            <FormLabel>Count</FormLabel>
            <NumberInput
              value={Number(inputs.count || 1)}
              onChange={(_, valueAsNumber) => {
                const count = Number.isNaN(valueAsNumber) ? 1 : valueAsNumber;
                updateInput("count", count);
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
              Generated ULIDs
            </Text>
            <Spacer />
            <CopyButton value={String(outputs.result || "")} />
          </HStack>
          <Textarea
            variant="toolOutput"
            value={String(outputs.result || "")}
            placeholder="ULIDs will appear here..."
            rows={12}
            isReadOnly
          />
        </VStack>
      </VStack>
    </BaseToolLayout>
  );
};
