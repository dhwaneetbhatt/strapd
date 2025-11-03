import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import {
  Button,
  HStack,
  Spacer,
  Text,
  Textarea,
  useClipboard,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
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
  } = useBaseTool(tool, initialInputs);

  const { hasCopied, onCopy } = useClipboard(String(outputs.result || ""));

  const handleCopy = () => {
    onCopy();
  };

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
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="gray.700"
              _dark={{ color: "gray.300" }}
            >
              {inputLabel}
            </Text>
            <Spacer />
          </HStack>
          <Textarea
            value={String(inputs.text || "")}
            onChange={(e) => {
              updateInput("text", e.target.value);
              onInputChange?.({ text: e.target.value });
            }}
            placeholder={inputPlaceholder}
            size="lg"
            resize="vertical"
            rows={8}
            fontFamily="mono"
            fontSize="sm"
            aria-label={`Input for ${tool.name}`}
            aria-describedby="tool-description"
            tabIndex={0}
          />
        </VStack>

        {/* Output Section */}
        <VStack flex={1} align="stretch" spacing={3}>
          <HStack minH="8">
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="gray.700"
              _dark={{ color: "gray.300" }}
            >
              {outputLabel}
            </Text>
            <Spacer />
            <Button
              size="sm"
              variant="ghost"
              leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
              onClick={handleCopy}
              colorScheme={hasCopied ? "green" : "brand"}
              isDisabled={!outputs.result}
              opacity={outputs.result ? 1 : 0.5}
              tabIndex={0}
            >
              {hasCopied ? "Copied!" : "Copy"}
            </Button>
          </HStack>
          <Textarea
            value={String(outputs.result || "")}
            placeholder={outputPlaceholder}
            size="lg"
            resize="vertical"
            rows={8}
            fontFamily="mono"
            fontSize="sm"
            isReadOnly
            bg="gray.50"
            _dark={{ bg: "gray.700" }}
            aria-label={`Output from ${tool.name}`}
            aria-live="polite"
          />
        </VStack>
      </HStack>
    </BaseToolLayout>
  );
};
