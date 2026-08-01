import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Kbd,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useClipboard,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  FiCopy,
  FiMaximize2,
  FiMinimize2,
  FiPlay,
  FiRotateCcw,
} from "react-icons/fi";
import { SyntaxHighlighterComponent } from "../common";
import { PipeStepRibbon } from "./pipe-step-ribbon";
import type { PipeRunState, PipeStepView } from "./types";

interface PipeRunnerProps {
  pipeName: string;
  steps: PipeStepView[];
  requiresInput: boolean;
  input: string;
  output: string;
  runState: PipeRunState;
  onInputChange: (input: string) => void;
  onRun: () => void;
  onReset: () => void;
  canRun?: boolean;
  isEditing?: boolean;
  activeStepId?: string;
  onSelectStep?: (stepId: string) => void;
}

const detectDataType = (
  value: string,
): { label: string; language?: "json" | "xml" | "yaml" } => {
  const trimmed = value.trim();
  if (!trimmed) return { label: "Plain text" };
  try {
    JSON.parse(trimmed);
    return { label: "JSON", language: "json" };
  } catch {
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
      return { label: "XML", language: "xml" };
    }
    return { label: "Plain text" };
  }
};

const bytes = (value: string): number => new TextEncoder().encode(value).length;

const DataPane: React.FC<{
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  actions?: React.ReactNode;
}> = ({ label, value, onChange, placeholder, actions }) => {
  const dataType = detectDataType(value);
  const lineCount = value ? value.split("\n").length : 1;
  const [isExpanded, setIsExpanded] = useState(false);
  const gutterRef = useRef<HTMLPreElement>(null);
  const paneName = label === "INPUT" ? "input" : "output";
  const lineNumbers = Array.from(
    { length: Math.min(lineCount, 10_000) },
    (_, index) => index + 1,
  ).join("\n");

  useEffect(() => {
    if (!isExpanded) return;
    const collapseOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", collapseOnEscape);
    return () => window.removeEventListener("keydown", collapseOnEscape);
  }, [isExpanded]);

  return (
    <Flex
      direction="column"
      minH={{ base: "280px", lg: "400px" }}
      h={isExpanded ? "calc(100vh - 2rem)" : "auto"}
      border="1px solid"
      borderColor="border.base"
      borderRadius="md"
      bg="surface.raised"
      overflow="hidden"
      position={isExpanded ? "fixed" : "relative"}
      inset={isExpanded ? { base: 2, md: 4 } : undefined}
      zIndex={isExpanded ? 1400 : "auto"}
      boxShadow={isExpanded ? "0 12px 32px rgba(0, 0, 0, 0.18)" : "none"}
    >
      <HStack
        justify="space-between"
        minH={12}
        px={4}
        borderBottom="1px solid"
        borderColor="border.base"
      >
        <Text fontSize="xs" fontWeight="bold" letterSpacing="0.04em">
          {label}
        </Text>
        <HStack spacing={2}>
          <Text fontSize="xs" color="text.secondary">
            {dataType.label}
          </Text>
          {actions}
          <Tooltip
            label={
              isExpanded
                ? `Restore ${paneName} pane`
                : `Expand ${paneName} pane`
            }
          >
            <IconButton
              aria-label={
                isExpanded
                  ? `Restore ${paneName} pane`
                  : `Expand ${paneName} pane`
              }
              aria-expanded={isExpanded}
              icon={isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded((expanded) => !expanded)}
            />
          </Tooltip>
        </HStack>
      </HStack>
      {!onChange && dataType.language && value ? (
        <Box
          role="region"
          aria-label="Final pipe output"
          flex={1}
          minH={{ base: "230px", lg: "350px" }}
          overflow="hidden"
          sx={{ "& > div": { border: 0, borderRadius: 0 } }}
        >
          <SyntaxHighlighterComponent
            code={value}
            language={dataType.language}
            maxHeight="100%"
            showLineNumbers
          />
        </Box>
      ) : onChange ? (
        <Flex flex={1} minH={{ base: "230px", lg: "350px" }} overflow="hidden">
          <Box
            ref={gutterRef}
            as="pre"
            data-testid="pipe-input-line-gutter"
            aria-hidden="true"
            flex="0 0 3rem"
            m={0}
            px={2}
            py={4}
            overflow="hidden"
            bg="surface.muted"
            borderRight="1px solid"
            borderColor="border.base"
            color="text.muted"
            textAlign="right"
            fontFamily="mono"
            fontSize="sm"
            lineHeight="tall"
            sx={{ fontVariantNumeric: "tabular-nums" }}
            userSelect="none"
          >
            {lineNumbers}
          </Box>
          <Textarea
            aria-label="Pipe input"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onScroll={(event) => {
              if (gutterRef.current) {
                gutterRef.current.scrollTop = event.currentTarget.scrollTop;
              }
            }}
            placeholder={placeholder}
            resize="none"
            minH={0}
            h="full"
            flex={1}
            border={0}
            borderRadius={0}
            fontFamily="mono"
            fontSize="sm"
            lineHeight="tall"
            _focusVisible={{
              boxShadow: "inset 0 0 0 2px var(--chakra-colors-brand-500)",
            }}
          />
        </Flex>
      ) : (
        <Textarea
          aria-label="Final pipe output"
          value={value}
          placeholder={placeholder}
          isReadOnly
          resize="vertical"
          minH={{ base: "230px", lg: "350px" }}
          flex={1}
          border={0}
          borderRadius={0}
          fontFamily="mono"
          fontSize="sm"
          lineHeight="tall"
          _focusVisible={{
            boxShadow: "inset 0 0 0 2px var(--chakra-colors-brand-500)",
          }}
        />
      )}
      <HStack
        minH={8}
        px={3}
        justify="flex-end"
        spacing={4}
        borderTop="1px solid"
        borderColor="border.base"
        color="text.secondary"
        fontSize="xs"
      >
        <Text>{lineCount} lines</Text>
        <Text>UTF-8</Text>
        <Text>{bytes(value)} B</Text>
      </HStack>
    </Flex>
  );
};

export const PipeRunner: React.FC<PipeRunnerProps> = ({
  pipeName,
  steps,
  requiresInput,
  input,
  output,
  runState,
  onInputChange,
  onRun,
  onReset,
  canRun,
  isEditing = false,
  activeStepId,
  onSelectStep,
}) => {
  const { hasCopied, onCopy } = useClipboard(output);
  const isRunning = runState.status === "running";
  const failedStepId =
    runState.status === "error" ? runState.stepId : undefined;

  return (
    <VStack align="stretch" spacing={5}>
      <Grid
        templateColumns={{
          base: "1fr",
          lg: "minmax(0, 1fr) auto minmax(0, 1fr)",
        }}
        gap={{ base: 4, lg: 3 }}
        alignItems="stretch"
      >
        {requiresInput ? (
          <DataPane
            label="INPUT"
            value={input}
            onChange={onInputChange}
            placeholder={`Paste input for ${pipeName}`}
          />
        ) : (
          <Flex
            minH={{ base: "160px", lg: "400px" }}
            border="1px solid"
            borderColor="border.base"
            borderRadius="md"
            bg="surface.raised"
            align="center"
            justify="center"
            p={8}
            textAlign="center"
          >
            <VStack spacing={2} maxW="320px">
              <Heading size="sm">No input required</Heading>
              <Text color="text.secondary" fontSize="sm">
                The first step generates the value for this pipe.
              </Text>
            </VStack>
          </Flex>
        )}

        <VStack justify="center" spacing={2} px={{ lg: 1 }}>
          <Tooltip label="Run pipe">
            <IconButton
              aria-label="Run pipe"
              icon={isRunning ? <Spinner size="sm" /> : <FiPlay />}
              colorScheme="brand"
              size="lg"
              w={{ base: "full", lg: 14 }}
              h={14}
              onClick={onRun}
              isDisabled={
                canRun === false || isRunning || (requiresInput && !input)
              }
            />
          </Tooltip>
          <Text fontSize="sm">Run</Text>
          <Kbd fontSize="xs">⌘↵</Kbd>
        </VStack>

        <DataPane
          label="OUTPUT (FINAL)"
          value={output}
          placeholder="The final output will appear here"
          actions={
            <Tooltip label={hasCopied ? "Copied" : "Copy final output"}>
              <IconButton
                aria-label="Copy final output"
                icon={<FiCopy />}
                size="sm"
                variant="ghost"
                onClick={onCopy}
                isDisabled={!output}
              />
            </Tooltip>
          }
        />
      </Grid>

      <Box aria-live="polite" aria-atomic="true">
        {runState.status === "success" && (
          <Alert status="success" variant="subtle" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              <HStack spacing={4} flexWrap="wrap">
                <Text fontWeight="semibold">Success</Text>
                <Text>{steps.length} steps completed</Text>
                <Text>{runState.durationMs} ms</Text>
              </HStack>
            </AlertDescription>
          </Alert>
        )}
        {runState.status === "error" && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>
              <Text fontWeight="semibold">
                {runState.stepName
                  ? `Step ${(runState.stepIndex ?? 0) + 1}, ${runState.stepName}, failed`
                  : "Pipe failed"}
              </Text>
              <Text>{runState.message}</Text>
            </AlertDescription>
          </Alert>
        )}
      </Box>

      <PipeStepRibbon
        steps={steps}
        failedStepId={failedStepId}
        activeStepId={activeStepId}
        isEditing={isEditing}
        onSelectStep={onSelectStep}
      />

      <HStack justify="flex-end">
        <Button
          leftIcon={<FiRotateCcw />}
          variant="ghost"
          size="sm"
          onClick={onReset}
          isDisabled={
            isRunning || (!input && !output && runState.status === "idle")
          }
        >
          Reset run
        </Button>
      </HStack>
    </VStack>
  );
};
