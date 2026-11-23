import { CheckIcon, CopyIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormLabel,
  HStack,
  IconButton,
  Select,
  Text,
  Textarea,
  Tooltip,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useId, useMemo, useState } from "react";
import { GoArrowSwitch } from "react-icons/go";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { stringUtils } from "../../../lib/utils/string";
import {
  DEFAULT_DIFF_CONTEXT,
  FULL_DIFF_CONTEXT,
} from "../../../lib/utils/string/diff";
import type { TextDiff } from "../../../lib/wasm";
import type { ToolResult } from "../../../types";
import type { BaseToolProps } from "../base-tool";
import { DiffStatus, DiffViewer, type DiffViewMode } from "./diff-viewer";

const focus = { outline: "2px solid", outlineColor: "border.focus" };

function DiffViewToggle({
  mode,
  onChange,
  splitAllowed,
}: {
  mode: DiffViewMode;
  onChange: (mode: DiffViewMode) => void;
  splitAllowed: boolean;
}) {
  const name = useId();
  return (
    <HStack
      role="radiogroup"
      aria-label="Diff view"
      spacing={0}
      border="1px solid"
      borderColor="border.base"
      rounded="md"
      p="2px"
      flexShrink={0}
      sx={{
        "input:focus-visible + span": focus,
        "input:checked + span": { bg: "bg.selected", color: "text.primary" },
        "input:disabled + span": { opacity: 0.55, cursor: "not-allowed" },
      }}
    >
      {(["unified", "split"] as const).map((option) => (
        <Tooltip
          key={option}
          label="Split view needs a wider window"
          isDisabled={option !== "split" || splitAllowed}
        >
          <Box as="label" position="relative">
            <Box
              as="input"
              type="radio"
              name={name}
              checked={mode === option}
              disabled={option === "split" && !splitAllowed}
              onChange={() => onChange(option)}
              position="absolute"
              w="1px"
              h="1px"
              overflow="hidden"
              clipPath="inset(50%)"
            />
            <Box
              as="span"
              display="grid"
              placeItems="center"
              px={2}
              minH={7}
              rounded="base"
              fontSize="sm"
              cursor="pointer"
              _hover={{ bg: "bg.hover" }}
            >
              {option === "unified" ? "Unified" : "Split"}
            </Box>
          </Box>
        </Tooltip>
      ))}
    </HStack>
  );
}

export const DiffToolComponent = ({ tool }: BaseToolProps) => {
  const [texts, setTexts] = useState({ original: "", changed: "" });
  const { original, changed } = texts;
  const [context, setContext] = useState(DEFAULT_DIFF_CONTEXT);
  const [preferredMode, setMode] = useState<DiffViewMode>("unified");
  const splitAllowed = useBreakpointValue({ base: false, md: true }) ?? false;
  const mode = splitAllowed ? preferredMode : "unified";
  const originalRef = useAutoFocus<HTMLTextAreaElement>();
  const id = useId();
  const inputs = useMemo(
    () => ({ original, changed, context }),
    [original, changed, context],
  );
  const [result, setResult] = useState<{
    inputs: typeof inputs;
    response: ToolResult<{ diff?: TextDiff }>;
  }>();
  const [copy, setCopy] = useState<{
    inputs: typeof inputs;
    status: "copied" | "failed";
  }>();
  const empty = original === "" && changed === "";
  const processInputs = useCallback(async () => {
    if (!inputs.original && !inputs.changed) {
      setResult(undefined);
      return;
    }
    const response = await tool.operation(inputs);
    setResult({ inputs, response });
  }, [inputs, tool]);
  useAutoProcess(processInputs, inputs);

  const diff = !empty ? result?.response.diff : undefined;
  const current = inputs === result?.inputs;
  const copyStatus = copy?.inputs === inputs ? copy.status : undefined;
  const copyPatch = async () => {
    const patch = stringUtils.diff.unified(original, changed, context);
    try {
      if (!patch.success || !patch.result) throw new Error();
      await navigator.clipboard.writeText(patch.result);
      setCopy({ inputs, status: "copied" });
    } catch {
      setCopy({ inputs, status: "failed" });
    }
  };
  const error = current ? result?.response.error : undefined;

  return (
    <VStack spacing={4} align="stretch" minW={0}>
      <Box
        display="grid"
        gridTemplateColumns={{
          base: "minmax(0, 1fr) auto",
          md: "repeat(2, minmax(0, 1fr))",
        }}
        columnGap={4}
        rowGap={2}
        alignItems="center"
        position="relative"
      >
        <FormLabel htmlFor={`${id}-original`} m={0} fontSize="sm">
          Original
        </FormLabel>
        <Tooltip label="Swap original and changed">
          <IconButton
            type="button"
            aria-label="Swap original and changed"
            icon={<GoArrowSwitch />}
            size="sm"
            variant="ghost"
            gridColumn={{ base: 2, md: "auto" }}
            gridRow={{ base: 1, md: "auto" }}
            justifySelf="end"
            position={{ md: "absolute" }}
            left={{ md: "50%" }}
            top={{ md: 0 }}
            transform={{ md: "translateX(-50%)" }}
            onClick={() => setTexts({ original: changed, changed: original })}
            _focusVisible={focus}
          />
        </Tooltip>
        <Textarea
          id={`${id}-original`}
          ref={originalRef}
          data-testid="tool-default-input"
          variant="input"
          rows={7}
          minH="unset"
          wrap="off"
          spellCheck={false}
          border="1px solid"
          borderColor="form.border"
          gridColumn={{ base: "1 / -1", md: 1 }}
          gridRow={2}
          value={original}
          onChange={(event) =>
            setTexts({ original: event.target.value, changed })
          }
          _focusVisible={focus}
        />
        <FormLabel
          htmlFor={`${id}-changed`}
          m={0}
          mt={{ base: 2, md: 0 }}
          ps={{ md: 3 }}
          fontSize="sm"
          gridColumn={{ base: 1, md: 2 }}
          gridRow={{ base: 3, md: 1 }}
        >
          Changed
        </FormLabel>
        <Textarea
          id={`${id}-changed`}
          variant="input"
          rows={7}
          minH="unset"
          wrap="off"
          spellCheck={false}
          border="1px solid"
          borderColor="form.border"
          gridColumn={{ base: "1 / -1", md: 2 }}
          gridRow={{ base: 4, md: 2 }}
          value={changed}
          onChange={(event) =>
            setTexts({ original, changed: event.target.value })
          }
          _focusVisible={focus}
        />
      </Box>
      <Flex gap={3} wrap="wrap" align="center">
        <DiffViewToggle
          mode={mode}
          onChange={setMode}
          splitAllowed={splitAllowed}
        />
        <Select
          aria-label="Context lines"
          size="sm"
          rounded="md"
          bg="form.bg"
          borderColor="border.base"
          w="auto"
          value={context}
          onChange={(event) => setContext(Number(event.target.value))}
          _focusVisible={focus}
        >
          <option value={DEFAULT_DIFF_CONTEXT}>3 lines</option>
          <option value={10}>10 lines</option>
          <option value={FULL_DIFF_CONTEXT}>Full</option>
        </Select>
        <HStack
          spacing={2}
          fontSize="sm"
          aria-label={`${diff?.added ?? 0} added, ${diff?.removed ?? 0} removed`}
        >
          <Text color="diff.added.fg">+{diff?.added ?? 0}</Text>
          <Text color="diff.removed.fg">−{diff?.removed ?? 0}</Text>
        </HStack>
        <Button
          type="button"
          variant="copy"
          minH={8}
          ms="auto"
          leftIcon={copyStatus === "copied" ? <CheckIcon /> : <CopyIcon />}
          onClick={copyPatch}
          isDisabled={!current || !diff?.hunks.length}
          _focusVisible={focus}
        >
          {copyStatus === "copied" ? "Copied!" : "Copy patch"}
        </Button>
      </Flex>
      {error || copyStatus === "failed" ? (
        <Alert status="error" rounded="md">
          <AlertIcon />
          <AlertDescription>
            {error ?? "Could not copy the patch."}
          </AlertDescription>
        </Alert>
      ) : null}
      {empty && <DiffStatus empty />}
      {diff?.hunks.length ? <DiffViewer diff={diff} mode={mode} /> : null}
      {current && diff?.hunks.length === 0 && <DiffStatus empty={false} />}
    </VStack>
  );
};
