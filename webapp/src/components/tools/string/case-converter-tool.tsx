import { HStack, Spacer, Text, Textarea, VStack } from "@chakra-ui/react";
import type React from "react";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

const OutputSection: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
}> = ({ label, value, placeholder }) => {
  return (
    <VStack align="stretch" spacing={2}>
      <HStack minH="8">
        <Text fontSize="sm" fontWeight="medium" color="text.secondary">
          {label}
        </Text>
        <Spacer />
        <CopyButton value={value} />
      </HStack>
      <Textarea
        variant="output"
        value={value}
        placeholder={placeholder}
        rows={3}
        isReadOnly
      />
    </VStack>
  );
};

export const CaseConverterToolComponent: React.FC<BaseToolProps> = ({
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
            variant="toolInput"
            value={String(inputs.text || "")}
            onChange={(e) => {
              updateInput("text", e.target.value);
            }}
            placeholder="Enter text to convert..."
          />
        </VStack>

        {/* Output Section */}
        <VStack flex={1} align="stretch" spacing={4}>
          <OutputSection
            label="Uppercase"
            value={String(outputs.uppercase || "")}
            placeholder="UPPERCASE RESULT..."
          />
          <OutputSection
            label="Lowercase"
            value={String(outputs.lowercase || "")}
            placeholder="lowercase result..."
          />
          <OutputSection
            label="Capital Case"
            value={String(outputs.capitalcase || "")}
            placeholder="Capital Case Result..."
          />
        </VStack>
      </HStack>
    </BaseToolLayout>
  );
};
