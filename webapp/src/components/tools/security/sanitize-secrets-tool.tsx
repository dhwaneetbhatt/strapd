import {
  Alert,
  AlertDescription,
  AlertIcon,
  Checkbox,
  FormControl,
  FormLabel,
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
  DEFAULT_SANITIZATION_CATEGORIES,
  SANITIZATION_CATEGORIES,
} from "../../../lib/utils/security/sanitization";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const SanitizeSecretsToolComponent: React.FC<BaseToolProps> = ({
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
      ...DEFAULT_SANITIZATION_CATEGORIES,
      ...initialInputs,
    },
    onInputChange,
  );
  useAutoProcess(processInputs, inputs, 30);

  const inputRef = useAutoFocus<HTMLTextAreaElement>();
  const output = String(outputs.result ?? "");
  const enabledCount = SANITIZATION_CATEGORIES.filter(
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
        <Alert status="info" rounded="md" alignItems="start">
          <AlertIcon mt={1} />
          <AlertDescription fontSize="sm">
            Recognizes common credential patterns locally. Coverage is finite;
            review the result before sharing.
          </AlertDescription>
        </Alert>

        <FormControl as="fieldset">
          <FormLabel as="legend">Categories</FormLabel>
          <VStack align="stretch" spacing={3}>
            <Checkbox
              isChecked={enabledCount === SANITIZATION_CATEGORIES.length}
              isIndeterminate={
                enabledCount > 0 &&
                enabledCount < SANITIZATION_CATEGORIES.length
              }
              onChange={(event) => {
                for (const { id } of SANITIZATION_CATEGORIES) {
                  updateInput(id, event.target.checked);
                }
              }}
            >
              All categories
            </Checkbox>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={2}>
              {SANITIZATION_CATEGORIES.map(({ id, label }) => (
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

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} minW={0}>
          <FormControl minW={0}>
            <FormLabel>Input text</FormLabel>
            <Textarea
              data-testid="tool-default-input"
              ref={inputRef}
              value={String(inputs.text ?? "")}
              onChange={(event) => updateInput("text", event.target.value)}
              placeholder="Paste text that may contain credentials..."
              minH="240px"
              h="240px"
              variant="toolInput"
              fontFamily="var(--chakra-fonts-mono)"
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
              fontFamily="var(--chakra-fonts-mono)"
              isReadOnly
            />
          </FormControl>
        </SimpleGrid>
        <Text fontSize="sm" color="text.secondary">
          Input stays in this browser and is excluded from shareable URLs.
        </Text>
      </VStack>
    </BaseToolLayout>
  );
};
