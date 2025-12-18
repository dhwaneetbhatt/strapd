import {
  Checkbox,
  HStack,
  Spacer,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const JsonToolComponent: React.FC<BaseToolProps> = ({
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
      sort: false,
      minify: false,
      ...initialInputs,
    },
    onInputChange,
  );

  useAutoProcess(processInputs, inputs);

  const inputRef = useAutoFocus<HTMLTextAreaElement>();

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <Stack direction="row" spacing={5}>
          <Checkbox
            isChecked={Boolean(inputs.sort)}
            onChange={(e) => updateInput("sort", e.target.checked)}
          >
            Sort Keys
          </Checkbox>
          <Checkbox
            isChecked={Boolean(inputs.minify)}
            onChange={(e) => updateInput("minify", e.target.checked)}
          >
            Minify
          </Checkbox>
        </Stack>

        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                JSON Input
              </Text>
              <Spacer />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              ref={inputRef}
              variant="input"
              minH="400px"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
              }}
              placeholder="Enter JSON to format..."
            />
          </VStack>
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Result
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
            </HStack>
            <Textarea
              variant="output"
              minH="400px"
              value={String(outputs.result || "")}
              placeholder="Result..."
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
