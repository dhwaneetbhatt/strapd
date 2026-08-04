import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useAutoFocus } from "../../../hooks/use-auto-focus";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import type { DecodedJwt, JwtExpirationAnalysis } from "../../../lib/utils/jwt";
import { CopyButton } from "../../common/copy-button";
import { SyntaxHighlighterComponent } from "../../common/syntax-highlighter";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

type VerificationStatus = "UNVERIFIED" | "VERIFIED" | "MISMATCH";

const statusScheme = (status: string) => {
  if (status === "ACTIVE" || status === "VERIFIED") return "green";
  if (status === "EXPIRED" || status === "MISMATCH") return "red";
  if (status === "INVALID") return "orange";
  return "gray";
};

const formatJson = (value: Record<string, unknown> | undefined) =>
  value ? JSON.stringify(value, null, 2) : "";

const expirationDetail = (expiration?: JwtExpirationAnalysis) => {
  if (!expiration) return "Paste a token to inspect its expiration.";
  if (expiration.status === "NOT_PRESENT") return "No exp claim is present.";
  if (expiration.status === "INVALID")
    return "The exp claim is not a valid NumericDate.";
  const timestamp = expiration.expires_at
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "long",
        timeZone: "UTC",
      }).format(new Date(expiration.expires_at))
    : "Unknown time";
  const seconds = expiration.seconds_remaining ?? 0;
  return `${timestamp} UTC · ${seconds.toLocaleString()} seconds remaining`;
};

export const JwtInspectorToolComponent: React.FC<BaseToolProps> = ({
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

  const token = String(inputs.token ?? "");
  const secret = String(inputs.secret ?? "");
  const decoded = outputs.decoded as DecodedJwt | undefined;
  const verificationStatus = String(
    outputs.verificationStatus ?? "UNVERIFIED",
  ) as VerificationStatus;
  const header = formatJson(decoded?.header);
  const payload = formatJson(decoded?.payload);
  const expiration = decoded?.analysis?.expiration;
  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack align="stretch" spacing={5} minW={0} pb={1}>
        <FormControl>
          <FormLabel>JWT or authorization header</FormLabel>
          <Textarea
            data-testid="tool-default-input"
            ref={inputRef}
            value={token}
            onChange={(event) => updateInput("token", event.target.value)}
            placeholder="Paste a compact JWT or Authorization: Bearer value"
            minH="112px"
            fontFamily="mono"
            spellCheck={false}
          />
        </FormControl>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          <Box minW={0}>
            <HStack justify="space-between" mb={2}>
              <Text as="h2" fontWeight="semibold">
                Header
              </Text>
              <CopyButton value={header} size="sm" />
            </HStack>
            <SyntaxHighlighterComponent
              code={header || "{}"}
              language="json"
              maxHeight="260px"
            />
          </Box>
          <Box minW={0}>
            <HStack justify="space-between" mb={2}>
              <Text as="h2" fontWeight="semibold">
                Payload
              </Text>
              <CopyButton value={payload} size="sm" />
            </HStack>
            <SyntaxHighlighterComponent
              code={payload || "{}"}
              language="json"
              maxHeight="260px"
            />
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box
            border="1px solid"
            borderColor="border.base"
            borderRadius="md"
            bg="surface.raised"
            p={4}
          >
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">Expiration</Text>
              <Badge colorScheme={statusScheme(expiration?.status ?? "")}>
                {expiration?.status ?? "UNAVAILABLE"}
              </Badge>
            </HStack>
            <Text color="text.secondary" fontSize="sm">
              {expirationDetail(expiration)}
            </Text>
          </Box>

          <Box
            border="1px solid"
            borderColor="border.base"
            borderRadius="md"
            bg="surface.raised"
            p={4}
          >
            <HStack justify="space-between" mb={3}>
              <Text fontWeight="semibold">Signature</Text>
              <Badge colorScheme={statusScheme(verificationStatus)}>
                {verificationStatus}
              </Badge>
            </HStack>
            <FormControl>
              <FormLabel fontSize="sm">HMAC secret</FormLabel>
              <Input
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(event) => updateInput("secret", event.target.value)}
                placeholder="Enter a local verification secret"
              />
              <FormHelperText>
                The protected header selects HS256, HS384, or HS512.
              </FormHelperText>
            </FormControl>
            {typeof outputs.verificationError === "string" && (
              <Alert status="error" mt={3} size="sm">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {String(outputs.verificationError)}
                </AlertDescription>
              </Alert>
            )}
          </Box>
        </SimpleGrid>
      </VStack>
    </BaseToolLayout>
  );
};
