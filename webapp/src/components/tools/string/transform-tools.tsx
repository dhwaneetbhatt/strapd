import {
  FormControl,
  FormLabel,
  HStack,
  Input,
  Spacer,
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";
import { SingleInputOutputTool } from "../single-input-output-tool";

// Re-use SingleInputOutputTool for simple transforms like Reverse
export const ReverseToolComponent: React.FC<BaseToolProps> = (props) => {
  return (
    <SingleInputOutputTool
      {...props}
      inputPlaceholder="Enter text to reverse..."
      outputPlaceholder="Reversed text will appear here..."
    />
  );
};

export const ReplaceToolComponent: React.FC<BaseToolProps> = ({
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

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={4} align="start">
          <FormControl>
            <FormLabel>Search For</FormLabel>
            <Input
              value={String(inputs.search || "")}
              onChange={(e) => updateInput("search", e.target.value)}
              placeholder="Text to find..."
            />
          </FormControl>
          <FormControl>
            <FormLabel>Replace With</FormLabel>
            <Input
              value={String(inputs.replacement || "")}
              onChange={(e) => updateInput("replacement", e.target.value)}
              placeholder="Replacement text..."
            />
          </FormControl>
        </HStack>

        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Input Text
              </Text>
              <Spacer />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              variant="input"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
                onInputChange?.({ text: e.target.value });
              }}
              placeholder="Enter text..."
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
              value={String(outputs.result || "")}
              placeholder="Result..."
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};

export const SlugifyToolComponent: React.FC<BaseToolProps> = ({
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

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Input Text
              </Text>
              <Spacer />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              variant="input"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
                onInputChange?.({ text: e.target.value });
              }}
              placeholder="Enter text to slugify..."
            />
          </VStack>
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Slug
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
            </HStack>
            <Textarea
              variant="output"
              value={String(outputs.result || "")}
              placeholder="Slugified text..."
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};

export const WhitespaceToolComponent: React.FC<BaseToolProps> = ({
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
    left: true,
    right: true,
    all: false,
    ...initialInputs,
  });

  // Auto-process as user types
  useAutoProcess(processInputs, inputs);

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={8}>
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="trim-left" mb="0">
              Trim Left
            </FormLabel>
            <Switch
              id="trim-left"
              isChecked={Boolean(inputs.left)}
              onChange={(e) => updateInput("left", e.target.checked)}
            />
          </FormControl>
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="trim-right" mb="0">
              Trim Right
            </FormLabel>
            <Switch
              id="trim-right"
              isChecked={Boolean(inputs.right)}
              onChange={(e) => updateInput("right", e.target.checked)}
            />
          </FormControl>
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="trim-all" mb="0">
              Collapse All Whitespace
            </FormLabel>
            <Switch
              id="trim-all"
              isChecked={Boolean(inputs.all)}
              onChange={(e) => updateInput("all", e.target.checked)}
            />
          </FormControl>
        </HStack>

        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Input Text
              </Text>
              <Spacer />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              variant="input"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
                onInputChange?.({ text: e.target.value });
              }}
              placeholder="Enter text to trim..."
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
              value={String(outputs.result || "")}
              placeholder="Trimmed text..."
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
