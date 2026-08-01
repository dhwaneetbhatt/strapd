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
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { FiArrowDown, FiArrowUp, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { ToolSearchCombobox } from "../common";
import { PipeConfigFields } from "./pipe-config-fields";
import type { PipeStepView, PipeToolView, PipeValidationView } from "./types";

interface PipeEditInspectorProps {
  name: string;
  steps: PipeStepView[];
  tools: PipeToolView[];
  selectedStepId?: string;
  validation: PipeValidationView;
  onNameChange: (name: string) => void;
  onAddStep: (toolId: string) => void;
  onConfigChange: (stepId: string, optionId: string, value: unknown) => void;
  onMoveStep: (stepId: string, direction: -1 | 1) => void;
  onRemoveStep: (stepId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PipeEditInspector: React.FC<PipeEditInspectorProps> = ({
  name,
  steps,
  tools,
  selectedStepId,
  validation,
  onNameChange,
  onAddStep,
  onConfigChange,
  onMoveStep,
  onRemoveStep,
  onSave,
  onCancel,
}) => {
  const selectedStep = steps.find(({ id }) => id === selectedStepId);
  const selectedIndex = selectedStep
    ? steps.findIndex(({ id }) => id === selectedStep.id)
    : -1;
  const stepErrors = selectedStep
    ? validation.steps?.[selectedStep.id]
    : undefined;

  return (
    <Box
      as="aside"
      aria-label="Pipe edit inspector"
      border="1px solid"
      borderColor="border.base"
      borderRadius="md"
      bg="surface.muted"
      minW={0}
      overflow="hidden"
    >
      <VStack align="stretch" spacing={5} p={5}>
        <Heading as="h2" size="sm">
          {selectedStep ? selectedStep.toolName : "Pipe settings"}
        </Heading>

        <FormControl isInvalid={Boolean(validation.name)}>
          <FormLabel htmlFor="inspector-pipe-name">Pipe name</FormLabel>
          <Input
            id="inspector-pipe-name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
          {validation.name && (
            <FormErrorMessage>{validation.name}</FormErrorMessage>
          )}
        </FormControl>

        {validation.form && validation.form.length > 0 && (
          <Alert status="error" alignItems="flex-start">
            <AlertIcon mt={0.5} />
            <AlertDescription>
              {validation.form.map((message) => (
                <Text key={message}>{message}</Text>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <Divider />

        {selectedStep ? (
          <VStack align="stretch" spacing={5}>
            <Text fontSize="sm" color="text.secondary">
              These values remain frozen for every run until this edit is saved.
            </Text>

            <HStack justify="space-between">
              <HStack spacing={1}>
                <Tooltip label={`Move ${selectedStep.toolName} up`}>
                  <IconButton
                    aria-label={`Move ${selectedStep.toolName} up`}
                    icon={<FiArrowUp />}
                    variant="ghost"
                    size="sm"
                    isDisabled={selectedIndex <= 0}
                    onClick={() => onMoveStep(selectedStep.id, -1)}
                  />
                </Tooltip>
                <Tooltip label={`Move ${selectedStep.toolName} down`}>
                  <IconButton
                    aria-label={`Move ${selectedStep.toolName} down`}
                    icon={<FiArrowDown />}
                    variant="ghost"
                    size="sm"
                    isDisabled={selectedIndex === steps.length - 1}
                    onClick={() => onMoveStep(selectedStep.id, 1)}
                  />
                </Tooltip>
              </HStack>
              <Button
                leftIcon={<FiTrash2 />}
                variant="ghost"
                color="text.error"
                size="sm"
                onClick={() => onRemoveStep(selectedStep.id)}
              >
                Remove
              </Button>
            </HStack>

            {selectedStep.unavailableReason ? (
              <Alert status="error" alignItems="flex-start">
                <AlertIcon mt={0.5} />
                <AlertDescription>
                  {selectedStep.unavailableReason}. This step is preserved and
                  will never be skipped silently.
                </AlertDescription>
              </Alert>
            ) : selectedStep.options.length > 0 ? (
              <PipeConfigFields
                options={selectedStep.options}
                values={selectedStep.config}
                errors={stepErrors?.fields}
                onChange={(optionId, value) =>
                  onConfigChange(selectedStep.id, optionId, value)
                }
              />
            ) : (
              <Text fontSize="sm" color="text.secondary">
                This step has no configurable options.
              </Text>
            )}

            {stepErrors?.messages.map((message) => (
              <Text key={message} fontSize="sm" color="text.error">
                {message}
              </Text>
            ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color="text.secondary">
            Select a step in the frozen sequence to inspect its configuration.
          </Text>
        )}

        <Divider />

        <FormControl>
          <FormLabel>Add another step</FormLabel>
          <ToolSearchCombobox
            items={
              steps.length > 0 ? tools.filter((tool) => !tool.isSource) : tools
            }
            onSelect={(tool) => onAddStep(tool.id)}
            label="Search compatible tools to add"
            showDefaultResults
            resultLimit={6}
            renderTrailing={(tool) =>
              tool.isSource ? <Badge colorScheme="blue">Source</Badge> : null
            }
          />
        </FormControl>

        <HStack justify="flex-end" pt={2}>
          <Button leftIcon={<FiX />} variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button leftIcon={<FiSave />} onClick={onSave}>
            Save pipe
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
