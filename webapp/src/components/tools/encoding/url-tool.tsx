import {
  FormControl,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  Spacer,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const UrlToolComponent: React.FC<BaseToolProps> = ({
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
      mode: "encode",
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
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Mode</FormLabel>
          <RadioGroup
            value={String(inputs.mode || "encode")}
            onChange={(val) => {
              updateInput("mode", val);
              updateInput("text", "");
            }}
          >
            <Stack direction="row" spacing={5}>
              <Radio value="encode">Encode</Radio>
              <Radio value="decode">Decode</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                {inputs.mode === "decode" ? "URL Encoded Input" : "Text Input"}
              </Text>
              <Spacer />
            </HStack>
            <Textarea
              data-testid="tool-default-input"
              ref={inputRef}
              variant="input"
              value={String(inputs.text || "")}
              onChange={(e) => {
                updateInput("text", e.target.value);
              }}
              placeholder={
                inputs.mode === "decode"
                  ? "Enter URL encoded text to decode..."
                  : "Enter text to encode..."
              }
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
              isReadOnly
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
