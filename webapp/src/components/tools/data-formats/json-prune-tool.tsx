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
  Switch,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import type { JsonPruneStats } from "../../../lib/wasm";
import { CopyButton } from "../../common/copy-button";
import { DownloadButton } from "../../common/download-button";
import { FileUploadButton } from "../../common/file-upload-button";
import { SyntaxHighlighterComponent } from "../../common/syntax-highlighter";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const JsonPruneToolComponent: React.FC<BaseToolProps> = ({
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
    { dropKeys: "", sample: false, sampleSize: 3, ...initialInputs },
    onInputChange,
  );
  useAutoProcess(processInputs, inputs);
  const inputRef = useAutoFocus<HTMLTextAreaElement>();
  const hasInput = String(inputs.text ?? "").trim().length > 0;
  const output = hasInput ? String(outputs.result ?? "") : "";
  const pruned = hasInput
    ? (outputs.pruned as JsonPruneStats["pruned"] | undefined)
    : undefined;
  const sampling = hasInput
    ? (outputs.sampling as JsonPruneStats["sampling"] | undefined)
    : undefined;
  const sampleSize = Number(inputs.sampleSize ?? 3);

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={hasInput ? error : undefined}
    >
      <VStack align="stretch" spacing={5} minW={0}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} alignItems="end">
          <FormControl>
            <FormLabel htmlFor="json-prune-drop-keys">Drop keys</FormLabel>
            <Input
              id="json-prune-drop-keys"
              value={String(inputs.dropKeys ?? "")}
              onChange={(event) => updateInput("dropKeys", event.target.value)}
              placeholder="debug, trace"
            />
          </FormControl>
          <FormControl display="flex" alignItems="center" pb={2}>
            <FormLabel htmlFor="json-prune-sample" mb={0}>
              Sample long arrays
            </FormLabel>
            <Switch
              id="json-prune-sample"
              isChecked={inputs.sample === true}
              onChange={(event) => updateInput("sample", event.target.checked)}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="json-prune-sample-size">
              Leading entries
            </FormLabel>
            <NumberInput
              min={1}
              step={1}
              value={Number.isFinite(sampleSize) ? sampleSize : ""}
              isDisabled={inputs.sample !== true}
              onChange={(_, value) => updateInput("sampleSize", value)}
            >
              <NumberInputField id="json-prune-sample-size" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </SimpleGrid>
        <Text fontSize="sm" color="text.secondary">
          Empty values are removed recursively. With sampling on, arrays longer
          than twice the leading entry count keep those entries and the final
          one. Processing stays in this browser.
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
              placeholder='Paste JSON, for example {"items":[1,null,2]}'
              minH="280px"
              h="280px"
              variant="toolInput"
              spellCheck={false}
            />
          </VStack>
          <VStack align="stretch" spacing={2} minW={0}>
            <HStack minH={8}>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Pruned JSON
              </Text>
              <Spacer />
              <CopyButton value={output} />
              <DownloadButton
                content={output}
                filename="pruned.json"
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
        {pruned && sampling && (
          <VStack align="stretch" spacing={2} aria-label="Pruning summary">
            <Text fontSize="sm" fontWeight="medium">
              Removed from data
            </Text>
            <Text fontSize="sm" color="text.secondary">
              {pruned.nulls} nulls · {pruned.emptyStrings} empty strings ·{" "}
              {pruned.emptyObjects} empty objects · {pruned.emptyArrays} empty
              arrays · {pruned.droppedKeys} keys
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
