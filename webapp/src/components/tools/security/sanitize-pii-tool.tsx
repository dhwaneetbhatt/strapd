import {
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  SimpleGrid,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import {
  DEFAULT_PII_CATEGORIES,
  PII_CATEGORIES,
} from "../../../lib/utils/security/pii";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const SanitizePiiToolComponent: React.FC<BaseToolProps> = ({
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
      ...DEFAULT_PII_CATEGORIES,
      mode: "Mask",
      ...initialInputs,
    },
    onInputChange,
  );
  useAutoProcess(processInputs, inputs, 0);
  const inputRef = useAutoFocus<HTMLTextAreaElement>();
  const output = String(outputs.result ?? "");
  const enabled = PII_CATEGORIES.filter(
    ({ id }) => inputs[id] !== false,
  ).length;
  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack align="stretch" spacing={5} minW={0}>
        <FormControl as="fieldset">
          <FormLabel as="legend">Replacement</FormLabel>
          <RadioGroup
            value={String(inputs.mode ?? "Mask")}
            onChange={(value) => updateInput("mode", value)}
          >
            <HStack spacing={6} flexWrap="wrap">
              <Radio value="Mask">Mask</Radio>
              <Radio value="Pseudonymize">Pseudonymize</Radio>
            </HStack>
          </RadioGroup>
          <Text fontSize="sm" color="text.secondary" mt={2}>
            Pseudonyms keep repeated values linked within this input only.
          </Text>
        </FormControl>
        <FormControl as="fieldset">
          <FormLabel as="legend">Categories</FormLabel>
          <VStack align="stretch" spacing={3}>
            <Checkbox
              isChecked={enabled === PII_CATEGORIES.length}
              isIndeterminate={enabled > 0 && enabled < PII_CATEGORIES.length}
              onChange={(event) => {
                for (const { id } of PII_CATEGORIES)
                  updateInput(id, event.target.checked);
              }}
            >
              All categories
            </Checkbox>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={2}>
              {PII_CATEGORIES.map(({ id, label }) => (
                <Checkbox
                  key={id}
                  isChecked={inputs[id] !== false}
                  onChange={(event) => updateInput(id, event.target.checked)}
                >
                  {label}
                </Checkbox>
              ))}
            </SimpleGrid>
          </VStack>
        </FormControl>
        <Text fontSize="sm" color="text.secondary">
          Recognizes common formats locally. Cards and Aadhaar use checksums;
          PAN uses structural rules. Explicit labels also protect plausible
          mistyped values. Review the result before sharing.
        </Text>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} minW={0}>
          <FormControl minW={0}>
            <FormLabel>Input text</FormLabel>
            <Textarea
              data-testid="tool-default-input"
              ref={inputRef}
              value={String(inputs.text ?? "")}
              onChange={(event) => updateInput("text", event.target.value)}
              placeholder="Paste text containing personal identifiers..."
              minH="240px"
              h="240px"
              variant="toolInput"
              spellCheck={false}
            />
          </FormControl>
          <FormControl minW={0}>
            <FormLabel display="flex" alignItems="center">
              Result
              <Spacer />
              <CopyButton value={output} size="sm" />
            </FormLabel>
            <Textarea
              aria-label="Sanitized result"
              variant="toolOutput"
              value={output}
              placeholder="Sanitized text appears here..."
              minH="240px"
              h="240px"
              isReadOnly
            />
          </FormControl>
        </SimpleGrid>
        <Text fontSize="sm" color="text.secondary">
          Input stays in this browser and is excluded from shareable URLs.
          Identifiers are never verified with an external service.
        </Text>
      </VStack>
    </BaseToolLayout>
  );
};
