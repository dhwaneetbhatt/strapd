import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  Tooltip,
  usePrefersReducedMotion,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { FiArrowDown, FiArrowUp, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { ToolSearchCombobox } from "../common";
import { PipeConfigFields } from "./pipe-config-fields";
import type { PipeStepView, PipeToolView, PipeValidationView } from "./types";

interface PipeEditorProps {
  name: string;
  steps: PipeStepView[];
  tools: PipeToolView[];
  selectedStepId?: string;
  validation: PipeValidationView;
  isSaving?: boolean;
  onNameChange: (name: string) => void;
  onAddStep: (toolId: string) => void;
  onSelectStep: (stepId: string) => void;
  onConfigChange: (stepId: string, optionId: string, value: unknown) => void;
  onMoveStep: (stepId: string, direction: -1 | 1) => void;
  onRemoveStep: (stepId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PipeEditor: React.FC<PipeEditorProps> = ({
  name,
  steps,
  tools,
  selectedStepId,
  validation,
  isSaving = false,
  onNameChange,
  onAddStep,
  onSelectStep,
  onConfigChange,
  onMoveStep,
  onRemoveStep,
  onSave,
  onCancel,
}) => {
  const reduceMotion = usePrefersReducedMotion();
  const selectedStep = steps.find((step) => step.id === selectedStepId);
  const stepErrors = selectedStep
    ? validation.steps?.[selectedStep.id]
    : undefined;

  return (
    <Grid
      templateColumns={{ base: "1fr", xl: "minmax(0, 1fr) 320px" }}
      minH={{ xl: "calc(100vh - 150px)" }}
      border="1px solid"
      borderColor="border.base"
      borderRadius="md"
      bg="surface.raised"
      overflow="hidden"
    >
      <VStack align="stretch" spacing={6} p={{ base: 4, md: 6 }}>
        <FormControl isInvalid={Boolean(validation.name)} maxW="680px">
          <FormLabel htmlFor="pipe-name">Pipe name</FormLabel>
          <Input
            id="pipe-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Normalize API payload"
          />
          {validation.name && (
            <FormErrorMessage>{validation.name}</FormErrorMessage>
          )}
        </FormControl>

        {validation.form && validation.form.length > 0 && (
          <Alert status="error" alignItems="flex-start">
            <AlertIcon mt={0.5} />
            <AlertDescription>
              <VStack as="ul" align="stretch" spacing={1} pl={4}>
                {validation.form.map((message) => (
                  <Text as="li" key={message}>
                    {message}
                  </Text>
                ))}
              </VStack>
            </AlertDescription>
          </Alert>
        )}

        <Box as="section" aria-labelledby="pipe-steps-heading">
          <HStack justify="space-between" mb={3} align="end">
            <Box>
              <Heading id="pipe-steps-heading" size="sm">
                Ordered steps
              </Heading>
              <Text fontSize="sm" color="text.secondary" mt={1}>
                Each output becomes the next step&apos;s input.
              </Text>
            </Box>
            <Badge colorScheme="gray">{steps.length} steps</Badge>
          </HStack>

          {steps.length === 0 ? (
            <Box
              border="1px dashed"
              borderColor="border.hover"
              borderRadius="md"
              p={8}
              textAlign="center"
              bg="surface.muted"
            >
              <Heading size="sm">Add the first step</Heading>
              <Text color="text.secondary" fontSize="sm" mt={2}>
                Start with a generator or a tool that accepts pasted input.
              </Text>
            </Box>
          ) : (
            <VStack as="ol" listStyleType="none" align="stretch" spacing={2}>
              {steps.map((step, index) => {
                const isSelected = step.id === selectedStepId;
                const errors = validation.steps?.[step.id]?.messages ?? [];
                return (
                  <Box
                    as="li"
                    key={step.id}
                    border="1px solid"
                    borderColor={
                      errors.length > 0 || step.unavailableReason
                        ? "red.400"
                        : isSelected
                          ? "border.focus"
                          : "border.base"
                    }
                    borderRadius="md"
                    bg={isSelected ? "bg.selected" : "surface.raised"}
                    p={3}
                    transition={
                      reduceMotion
                        ? "none"
                        : "border-color 140ms ease-out, background-color 140ms ease-out, transform 140ms ease-out"
                    }
                  >
                    <HStack align="center" spacing={3}>
                      <Button
                        aria-label={`Configure step ${index + 1}: ${step.toolName}`}
                        variant="ghost"
                        h="auto"
                        flex={1}
                        justifyContent="flex-start"
                        textAlign="left"
                        px={1}
                        onClick={() => onSelectStep(step.id)}
                      >
                        <HStack align="flex-start" spacing={3} w="full">
                          <Box
                            display="grid"
                            placeItems="center"
                            w={7}
                            h={7}
                            borderRadius="full"
                            bg={
                              step.unavailableReason ? "red.500" : "brand.600"
                            }
                            color="white"
                            fontSize="xs"
                            flex="0 0 auto"
                          >
                            {index + 1}
                          </Box>
                          <VStack align="start" spacing={0} minW={0}>
                            <Text fontWeight="semibold" noOfLines={1}>
                              {step.toolName}
                            </Text>
                            <Text
                              fontSize="xs"
                              color="text.secondary"
                              noOfLines={1}
                            >
                              {step.unavailableReason ??
                                step.summary[0] ??
                                "Default configuration"}
                            </Text>
                          </VStack>
                        </HStack>
                      </Button>

                      <HStack spacing={0}>
                        <Tooltip label={`Move ${step.toolName} up`}>
                          <IconButton
                            aria-label={`Move ${step.toolName} up`}
                            icon={<FiArrowUp />}
                            variant="ghost"
                            size="sm"
                            isDisabled={index === 0}
                            onClick={() => onMoveStep(step.id, -1)}
                          />
                        </Tooltip>
                        <Tooltip label={`Move ${step.toolName} down`}>
                          <IconButton
                            aria-label={`Move ${step.toolName} down`}
                            icon={<FiArrowDown />}
                            variant="ghost"
                            size="sm"
                            isDisabled={index === steps.length - 1}
                            onClick={() => onMoveStep(step.id, 1)}
                          />
                        </Tooltip>
                        <Tooltip label={`Remove ${step.toolName}`}>
                          <IconButton
                            aria-label={`Remove ${step.toolName}`}
                            icon={<FiTrash2 />}
                            variant="ghost"
                            color="text.error"
                            size="sm"
                            onClick={() => onRemoveStep(step.id)}
                          />
                        </Tooltip>
                      </HStack>
                    </HStack>
                    {errors.length > 0 && (
                      <VStack align="stretch" spacing={0} mt={2} pl={10}>
                        {errors.map((error) => (
                          <Text key={error} fontSize="xs" color="text.error">
                            {error}
                          </Text>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}

          <Box mt={4}>
            <ToolSearchCombobox
              items={
                steps.length > 0
                  ? tools.filter((tool) => !tool.isSource)
                  : tools
              }
              onSelect={(tool) => onAddStep(tool.id)}
              label="Find a tool to add"
              showDefaultResults
              resultLimit={6}
              renderTrailing={(tool) =>
                tool.isSource ? <Badge colorScheme="blue">Source</Badge> : null
              }
            />
          </Box>
        </Box>

        <HStack justify="flex-end" mt="auto">
          <Button leftIcon={<FiX />} variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            leftIcon={<FiSave />}
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving"
          >
            Save pipe
          </Button>
        </HStack>
      </VStack>

      <Box
        as="aside"
        aria-label="Step configuration"
        borderLeft={{ xl: "1px solid" }}
        borderTop={{ base: "1px solid", xl: "none" }}
        borderColor="border.base"
        bg="surface.muted"
        p={{ base: 4, md: 5 }}
      >
        {selectedStep ? (
          <VStack align="stretch" spacing={5}>
            <Box>
              <Heading as="h2" size="sm">
                {selectedStep.toolName}
              </Heading>
              <Text fontSize="xs" color="text.secondary" mt={1}>
                Saved values stay frozen until this pipe is edited again.
              </Text>
            </Box>
            <Divider />
            {selectedStep.unavailableReason ? (
              <Alert status="error" alignItems="flex-start">
                <AlertIcon mt={0.5} />
                <AlertDescription>
                  {selectedStep.unavailableReason} This step is preserved and
                  will not be skipped.
                </AlertDescription>
              </Alert>
            ) : selectedStep.options.length > 0 ? (
              <PipeConfigFields
                options={selectedStep.options}
                values={selectedStep.config}
                onChange={(optionId, value) =>
                  onConfigChange(selectedStep.id, optionId, value)
                }
                errors={Object.fromEntries(
                  Object.entries(stepErrors?.fields ?? {}),
                )}
              />
            ) : (
              <Text fontSize="sm" color="text.secondary">
                This step has no configurable options.
              </Text>
            )}
          </VStack>
        ) : (
          <VStack align="start" spacing={2} py={8}>
            <Heading size="sm">Select a step</Heading>
            <Text fontSize="sm" color="text.secondary">
              Choose a step to inspect and edit its frozen configuration.
            </Text>
          </VStack>
        )}
      </Box>
    </Grid>
  );
};
