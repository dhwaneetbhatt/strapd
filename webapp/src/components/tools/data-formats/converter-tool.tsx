import {
  FormControl,
  FormLabel,
  HStack,
  Select,
  Spacer,
  Switch,
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
import { DownloadButton } from "../../common/download-button";
import { FileUploadButton } from "../../common/file-upload-button";
import { SyntaxHighlighterComponent } from "../../common/syntax-highlighter";
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
      <VStack spacing={6} align="stretch" h="full">
        <HStack spacing={5} align="end">
          <FormControl width="200px">
            <FormLabel fontSize="sm" mb={1}>
              Source Format
            </FormLabel>
            <Select
              size="sm"
              value={sourceFormat}
              onChange={(e) => updateInput("sourceFormat", e.target.value)}
              bg="form.bg"
            >
              <option value="auto">Auto-detect</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="xml">XML</option>
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
              bg="form.bg"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="xml">XML</option>
            </Select>
          </FormControl>

          <FormControl width="auto">
            <FormLabel fontSize="sm" mb={1}>
              Minify
            </FormLabel>
            <Switch
              id="minify"
              isChecked={Boolean(inputs.minify)}
              onChange={(e) => updateInput("minify", e.target.checked)}
            />
          </FormControl>
        </HStack>

        <HStack spacing={6} align="stretch" flex={1} minH="0">
          <VStack flex={1} align="stretch" spacing={3} h="full">
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Input ({getSourceFormatDisplay()})
              </Text>
              <Spacer />
              <FileUploadButton
                onFileLoad={(content) => updateInput("text", content)}
                acceptedExtensions={[".json", ".yaml", ".yml", ".xml", ".txt"]}
                size="xs"
              />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              ref={inputRef}
              variant="input"
              h="full"
              minH="tool.textarea.min"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
              }}
              placeholder="Enter data to convert..."
            />
          </VStack>
          <VStack flex={1} align="stretch" spacing={3} h="full">
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Output ({targetFormat.toUpperCase()})
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
              <DownloadButton
                content={String(outputs.result || "")}
                filename={`converted.${targetFormat}`}
                size="xs"
              />
            </HStack>
            <SyntaxHighlighterComponent
              code={String(outputs.result || "")}
              language={targetFormat as "json" | "xml" | "yaml"}
              fontSize="sm"
              maxHeight="full"
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
