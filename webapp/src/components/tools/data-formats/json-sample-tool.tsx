import {
  Code,
  FormControl,
  FormLabel,
  HStack,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import type { JsonSampleStats } from "../../../lib/wasm";
import { CopyButton } from "../../common/copy-button";
import { DownloadButton } from "../../common/download-button";
import { FileUploadButton } from "../../common/file-upload-button";
import { SyntaxHighlighterComponent } from "../../common/syntax-highlighter";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const JsonSampleToolComponent: React.FC<BaseToolProps> = ({
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
    { size: 3, seed: "0", ...initialInputs },
    onInputChange,
  );
  useAutoProcess(processInputs, inputs);
  const inputRef = useAutoFocus<HTMLTextAreaElement>();
  const hasInput = String(inputs.text ?? "").trim().length > 0;
  const output = hasInput ? String(outputs.result ?? "") : "";
  const filtered = hasInput
    ? (outputs.filtered as JsonSampleStats["filtered"] | undefined)
    : undefined;
  const sampling = hasInput
    ? (outputs.sampling as JsonSampleStats["sampling"] | undefined)
    : undefined;
  const sampleSize = Number(inputs.size ?? 3);

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={hasInput ? error : undefined}
    >
      <VStack align="stretch" spacing={5} minW={0}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} alignItems="end">
          <FormControl>
            <FormLabel htmlFor="json-sample-size">Entries per array</FormLabel>
            <NumberInput
              min={1}
              step={1}
              value={Number.isFinite(sampleSize) ? sampleSize : ""}
              onChange={(_, value) => updateInput("size", value)}
            >
              <NumberInputField id="json-sample-size" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="json-sample-seed">Seed</FormLabel>
            <Input
              id="json-sample-seed"
              inputMode="numeric"
              value={String(inputs.seed ?? "0")}
              onChange={(event) => updateInput("seed", event.target.value)}
            />
          </FormControl>
        </SimpleGrid>
        <Text fontSize="sm" color="text.secondary">
          Each array keeps a repeatable random sample. Null and empty-array
          entries are removed from arrays first; object fields stay intact.
          Change the seed for a different sample. Processing stays in this
          browser.
        </Text>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} minW={0}>
          <VStack align="stretch" spacing={2} minW={0}>
            <HStack minH={8}>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                JSON input
              </Text>
              <Spacer />
              <FileUploadButton
                onFileLoad={(content) => updateInput("text", content)}
                acceptedExtensions={[".json", ".txt"]}
                size="xs"
              />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              ref={inputRef}
              value={String(inputs.text ?? "")}
              onChange={(event) => updateInput("text", event.target.value)}
              placeholder='Paste JSON, for example {"items":[1,null,2,3,4]}'
              minH="280px"
              h="280px"
              variant="toolInput"
              spellCheck={false}
            />
          </VStack>
          <VStack align="stretch" spacing={2} minW={0}>
            <HStack minH={8}>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Sampled JSON
              </Text>
              <Spacer />
              <CopyButton value={output} />
              <DownloadButton
                content={output}
                filename="sampled.json"
                size="xs"
              />
            </HStack>
            <SyntaxHighlighterComponent
              code={output}
              language="json"
              fontSize="sm"
              maxHeight="280px"
            />
          </VStack>
        </SimpleGrid>
        {filtered && sampling && (
          <VStack align="stretch" spacing={2} aria-label="Sampling summary">
            <Text fontSize="sm" fontWeight="medium">
              Removed from data
            </Text>
            <Text fontSize="sm" color="text.secondary">
              {filtered.nulls} nulls · {filtered.emptyArrays} empty arrays
            </Text>
            <Text fontSize="sm" color="text.secondary">
              {sampling.omittedTotal} array entries omitted by sampling
            </Text>
            {sampling.arrays.map(({ path, omitted }) => (
              <Text key={path} fontSize="sm" color="text.secondary">
                <Code>{path || "(root)"}</Code> {omitted} omitted
              </Text>
            ))}
          </VStack>
        )}
      </VStack>
    </BaseToolLayout>
  );
};
