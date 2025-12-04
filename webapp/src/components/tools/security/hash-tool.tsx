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

export const HashToolComponent: React.FC<BaseToolProps> = ({
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
  } = useBaseTool(tool, initialInputs);

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
        <FormControl>
          <FormLabel>Input Text</FormLabel>
          <Textarea
            value={String(inputs.text || "")}
            onChange={(e) => {
              updateInput("text", e.target.value);
              onInputChange?.({ text: e.target.value });
            }}
            placeholder="Enter text to hash..."
            minH="100px"
          />
        </FormControl>

        {/* Output Section */}
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="md">
            Hashes
          </Text>
          {renderOutputField("MD5", String(outputs.md5 || ""))}
          {renderOutputField("SHA1", String(outputs.sha1 || ""))}
          {renderOutputField("SHA256", String(outputs.sha256 || ""))}
          {renderOutputField("SHA512", String(outputs.sha512 || ""))}
        </VStack>
      </VStack>
    </BaseToolLayout>
  );
};
