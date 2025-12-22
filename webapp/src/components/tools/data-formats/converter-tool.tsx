import {
  FormControl,
  FormLabel,
  HStack,
  Select,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect } from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { detectFormat } from "../../../lib/utils/data-formats";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const ConverterToolComponent: React.FC<BaseToolProps> = ({
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
      sourceFormat: "auto",
      targetFormat: "yaml",
      ...initialInputs,
    },
    onInputChange,
  );

  useAutoProcess(processInputs, inputs);

  const inputRef = useAutoFocus<HTMLTextAreaElement>();

  // Auto-detect format when input changes
  useEffect(() => {
    if (inputs.sourceFormat === "auto" && inputs.text) {
      const detected = detectFormat(String(inputs.text));
      if (detected !== "unknown" && inputs.detectedFormat !== detected) {
        updateInput("detectedFormat", detected);
      }
    }
  }, [inputs.text, inputs.sourceFormat, inputs.detectedFormat, updateInput]);

  const detectedFormat = String(inputs.detectedFormat || "unknown");
  const sourceFormat = String(inputs.sourceFormat || "auto");
  const targetFormat = String(inputs.targetFormat || "yaml");

  const getSourceFormatDisplay = () => {
    if (sourceFormat === "auto") {
      return detectedFormat === "unknown"
        ? "Auto (detecting...)"
        : `Auto (${detectedFormat.toUpperCase()})`;
    }
    return sourceFormat.toUpperCase();
  };

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={5} align="end">
          <FormControl width="200px">
            <FormLabel fontSize="sm" mb={1}>
              Source Format
            </FormLabel>
            <Select
              size="sm"
              value={sourceFormat}
              onChange={(e) => updateInput("sourceFormat", e.target.value)}
            >
              <option value="auto">Auto-detect</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </Select>
          </FormControl>

          <Text fontSize="2xl" color="text.secondary" pb={1}>
            →
          </Text>

          <FormControl width="200px">
            <FormLabel fontSize="sm" mb={1}>
              Target Format
            </FormLabel>
            <Select
              size="sm"
              value={targetFormat}
              onChange={(e) => updateInput("targetFormat", e.target.value)}
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </Select>
          </FormControl>
        </HStack>

        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Input ({getSourceFormatDisplay()})
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
              placeholder="Enter data to convert..."
            />
          </VStack>
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Output ({targetFormat.toUpperCase()})
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
            </HStack>
            <Textarea
              variant="output"
              minH="400px"
              value={String(outputs.result || "")}
              placeholder="Converted output..."
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
