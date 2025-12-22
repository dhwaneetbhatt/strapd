import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Spacer,
  Stack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const TimestampToolComponent: React.FC<BaseToolProps> = ({
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
      timestamp: "",
      isMillis: false,
      format: "Human",
      ...initialInputs,
    },
    onInputChange,
  );

  useAutoProcess(processInputs, {
    timestamp: inputs.timestamp,
    isMillis: inputs.isMillis,
    format: inputs.format,
  });

  // Special handler for "Now" button
  const handleNow = () => {
    // We can't call wasmWrapper.datetime_now directly here because we want to trigger the tool's process logic
    // But actually we can just update the input with the current time
    const result = tool.operation({ ...inputs, useNow: true });
    // operation in this project is synchronous
    const syncResult = result as { success: boolean; result: string };
    if (syncResult.success) {
      updateInput("timestamp", syncResult.result);
    }
  };

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={6} align="stretch">
        <HStack spacing={6}>
          <FormControl display="flex" alignItems="center" width="auto">
            <FormLabel htmlFor="is-millis" mb="0" fontSize="sm">
              Milliseconds
            </FormLabel>
            <Switch
              id="is-millis"
              isChecked={Boolean(inputs.isMillis)}
              onChange={(e) => updateInput("isMillis", e.target.checked)}
            />
          </FormControl>

          <FormControl width="auto">
            <HStack spacing={4}>
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Format:
              </Text>
              <RadioGroup
                value={String(inputs.format || "Human")}
                onChange={(val) => updateInput("format", val)}
              >
                <Stack direction="row" spacing={4}>
                  <Radio value="Human" size="sm">
                    Human
                  </Radio>
                  <Radio value="Iso" size="sm">
                    ISO
                  </Radio>
                </Stack>
              </RadioGroup>
            </HStack>
          </FormControl>
        </HStack>

        <HStack spacing={6} align="start">
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Timestamp
              </Text>
              <Spacer />
              <Button
                size="xs"
                colorScheme="blue"
                variant="ghost"
                onClick={handleNow}
              >
                Get Now
              </Button>
            </HStack>
            <Input
              variant="input"
              value={String(inputs.timestamp || "")}
              onChange={(e) => updateInput("timestamp", e.target.value)}
              placeholder="Enter timestamp to convert..."
            />
          </VStack>

          <VStack flex={1} align="stretch" spacing={3}>
            <HStack minH="8">
              <Text fontSize="sm" fontWeight="medium" color="text.secondary">
                Date result
              </Text>
              <Spacer />
              <CopyButton value={String(outputs.result || "")} />
            </HStack>
            <Input
              variant="output"
              readOnly
              value={String(outputs.result || "")}
              placeholder="Converted date will appear here..."
            />
          </VStack>
        </HStack>
      </VStack>
    </BaseToolLayout>
  );
};
