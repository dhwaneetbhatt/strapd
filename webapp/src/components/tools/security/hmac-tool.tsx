import {
  FormControl,
  FormLabel,
  HStack,
  Input,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const HmacToolComponent: React.FC<BaseToolProps> = ({
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

  const renderOutputField = (label: string, value: string) => (
    <FormControl>
      <HStack mb={2}>
        <FormLabel mb={0} fontSize="sm" color="text.secondary">
          {label}
        </FormLabel>
        <Spacer />
        <CopyButton value={value} size="sm" />
      </HStack>
      <Input
        value={value}
        isReadOnly
        variant="filled"
        size="sm"
        fontFamily="mono"
      />
    </FormControl>
  );

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        {/* Input Section */}
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Input Text</FormLabel>
            <Textarea
              data-testid="tool-default-input"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
              }}
              placeholder="Enter text to hash..."
              minH="100px"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Secret Key</FormLabel>
            <Input
              value={String(inputs.key || "")}
              onChange={(e) => {
                updateInput("key", e.target.value);
              }}
              placeholder="Enter secret key..."
            />
          </FormControl>
        </VStack>

        {/* Output Section */}
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="md">
            HMACs
          </Text>
          {renderOutputField("SHA256", String(outputs.sha256 || ""))}
          {renderOutputField("SHA512", String(outputs.sha512 || ""))}
        </VStack>
      </VStack>
    </BaseToolLayout>
  );
};
