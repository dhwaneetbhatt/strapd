import {
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  Input,
  Select,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import type { JwtAlgorithm } from "../../../lib/utils/jwt";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

export const JwtSignerToolComponent: React.FC<BaseToolProps> = ({
  tool,
  initialInputs,
  onInputChange,
}) => {
  const inputRef = useAutoFocus<HTMLTextAreaElement>();
  const {
    inputs,
    outputs,
    isProcessing,
    error,
    updateInput,
    processInputs,
    clearAll,
  } = useBaseTool(tool, initialInputs, onInputChange);
  useAutoProcess(processInputs, inputs);

  const payload = String(inputs.payload ?? "");
  const secret = String(inputs.secret ?? "");
  const algorithm = String(inputs.algorithm ?? "HS256") as JwtAlgorithm;
  const expiration = String(inputs.expiration ?? "");
  const token = String(outputs.result ?? "");
  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack align="stretch" spacing={5} pb={1}>
        <FormControl>
          <FormLabel>JSON payload</FormLabel>
          <Textarea
            data-testid="tool-default-input"
            ref={inputRef}
            value={payload}
            onChange={(event) => updateInput("payload", event.target.value)}
            placeholder={'{\n  "sub": "123"\n}'}
            minH="180px"
            spellCheck={false}
          />
        </FormControl>

        <Grid templateColumns={{ base: "1fr", md: "1fr 180px 180px" }} gap={4}>
          <FormControl>
            <FormLabel>HMAC secret</FormLabel>
            <Input
              type="password"
              autoComplete="off"
              value={secret}
              onChange={(event) => updateInput("secret", event.target.value)}
              placeholder="Enter a local signing secret"
            />
            <FormHelperText>Never included in the URL.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Algorithm</FormLabel>
            <Select
              value={algorithm}
              onChange={(event) => updateInput("algorithm", event.target.value)}
            >
              <option value="HS256">HS256</option>
              <option value="HS384">HS384</option>
              <option value="HS512">HS512</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Expires in seconds</FormLabel>
            <Input
              type="number"
              min={1}
              step={1}
              value={expiration}
              onChange={(event) =>
                updateInput("expiration", event.target.value)
              }
              placeholder="Optional"
            />
            <FormHelperText>Replaces exp; does not change iat.</FormHelperText>
          </FormControl>
        </Grid>

        <FormControl>
          <HStack justify="space-between" mb={2}>
            <FormLabel mb={0}>Compact JWT</FormLabel>
            <CopyButton value={token} size="sm" />
          </HStack>
          <Textarea
            aria-label="Compact JWT output"
            value={token}
            isReadOnly
            minH="128px"
            bg="tool.output.bg"
            placeholder="Your signed token will appear here"
          />
        </FormControl>
      </VStack>
    </BaseToolLayout>
  );
};
