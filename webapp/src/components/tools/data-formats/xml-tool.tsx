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
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { DownloadButton } from "../../common/download-button";
import { FileUploadButton } from "../../common/file-upload-button";
import { SyntaxHighlighterComponent } from "../../common/syntax-highlighter";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const XmlToolComponent: React.FC<BaseToolProps> = ({
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
      minify: false,
      indentSize: 2,
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
      <VStack spacing={6} align="stretch" h="full">
        <HStack spacing={8} align="end">
          <FormControl display="flex" alignItems="center" w="auto">
            <FormLabel htmlFor="minify" mb="0">
              Minify
            </FormLabel>
            <Switch
              id="minify"
              isChecked={Boolean(inputs.minify)}
              onChange={(e) => updateInput("minify", e.target.checked)}
            />
          </FormControl>
          <FormControl width="120px">
            <FormLabel fontSize="sm" mb={1}>
              Indent Size
            </FormLabel>
            <NumberInput
              size="sm"
              value={Number(inputs.indentSize) || 2}
              min={1}
              max={8}
              onChange={(_, valueAsNumber) =>
                updateInput("indentSize", valueAsNumber)
              }
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={6} align="stretch" flex={1} minH="0">
          <VStack flex={1} align="stretch" spacing={3} h="full">
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                XML Input
              </Text>
              <Spacer />
              <FileUploadButton
                onFileLoad={(content) => updateInput("text", content)}
                acceptedExtensions={[".xml", ".txt"]}
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
              placeholder="Enter XML to format..."
            />
          </VStack>
          <VStack flex={1} align="stretch" spacing={3} h="full">
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Result
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
              <DownloadButton
                content={String(outputs.result || "")}
                filename="formatted.xml"
                size="xs"
              />
            </HStack>
            <SyntaxHighlighterComponent
              code={String(outputs.result || "")}
              language="xml"
              fontSize="sm"
              maxHeight="full"
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
