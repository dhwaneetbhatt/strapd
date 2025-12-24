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

export const RandomNumberToolComponent: React.FC<BaseToolProps> = ({
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
      min: 0,
      max: 100,
      count: 1,
      ...initialInputs,
    },
    onInputChange,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: processInputs causes infinite loop
  useEffect(() => {
    processInputs();
  }, []);

  useProcessOnChange(processInputs, [
    Number(inputs.min),
    Number(inputs.max),
    Number(inputs.count),
  ]);

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={6} align="stretch">
          {/* Configuration Column */}
          <VStack flex={1} align="stretch" spacing={4}>
            <Text fontSize="sm" fontWeight="medium" color="text.secondary">
              Configuration
            </Text>

            <FormControl>
              <FormLabel>Minimum Value</FormLabel>
              <NumberInput
                value={Number(inputs.min)}
                onChange={(_, val) => updateInput("min", val)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Maximum Value</FormLabel>
              <NumberInput
                value={Number(inputs.max)}
                onChange={(_, val) => updateInput("max", val)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>Count</FormLabel>
              <NumberInput
                value={Number(inputs.count)}
                onChange={(_, val) => updateInput("count", val)}
                min={1}
                max={1000}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </VStack>

          {/* Result Column */}
          <VStack flex={1} align="stretch" spacing={3} justify="start">
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Result
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
            </HStack>
            <Textarea
              variant="output"
              value={String(outputs.result || "")}
              placeholder="Generated numbers will appear here..."
              flex={1}
              isReadOnly
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
