import { HStack, Spacer, Text, Textarea, VStack } from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../hooks/use-auto-focus";
import { useAutoProcess } from "../../hooks/use-tool-processing";
import { CopyButton } from "../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "./base-tool";

interface SingleInputOutputToolProps extends BaseToolProps {
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  outputPlaceholder?: string;
}

export const SingleInputOutputTool: React.FC<SingleInputOutputToolProps> = ({
  tool,
  initialInputs,
  onInputChange,
  inputLabel = "Input",
  outputLabel = "Output",
  inputPlaceholder = "Enter your text here...",
  outputPlaceholder = "Processed output will appear here...",
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

  const inputRef = useAutoFocus<HTMLTextAreaElement>();

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <HStack spacing={6} align="start">
        {/* Input Section */}
        <VStack flex={1} align="stretch" spacing={3}>
          <HStack minH="8">
            <Text fontSize="sm" fontWeight="medium" color="text.secondary">
              {inputLabel}
            </Text>
            <Spacer />
          </HStack>
          <Textarea
            data-testid="tool-default-input"
            ref={inputRef}
            variant="toolInput"
            value={String(inputs.text || "")}
            onChange={(e) => {
              updateInput("text", e.target.value);
            }}
            placeholder={inputPlaceholder}
            aria-label={`Input for ${tool.name}`}
            aria-describedby="tool-description"
            tabIndex={0}
          />
        </VStack>

        {/* Output Section */}
        <VStack flex={1} align="stretch" spacing={3}>
          <HStack minH="8">
            <Text fontSize="sm" fontWeight="medium" color="text.secondary">
              {outputLabel}
            </Text>
            <Spacer />
            <CopyButton value={String(outputs.result || "")} />
          </HStack>
          <Textarea
            variant="toolOutput"
            value={String(outputs.result || "")}
            placeholder={outputPlaceholder}
            isReadOnly
            aria-label={`Output from ${tool.name}`}
            aria-live="polite"
          />
        </VStack>
      </HStack>
    </BaseToolLayout>
  );
};
