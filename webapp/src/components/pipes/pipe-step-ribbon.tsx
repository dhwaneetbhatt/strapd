import {
  Box,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  usePrefersReducedMotion,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { FiAlertTriangle, FiCheck, FiEdit3 } from "react-icons/fi";
import type { PipeStepView } from "./types";

interface PipeStepRibbonProps {
  steps: PipeStepView[];
  activeStepId?: string;
  failedStepId?: string;
  isEditing?: boolean;
  onSelectStep?: (stepId: string) => void;
}

export const PipeStepRibbon: React.FC<PipeStepRibbonProps> = ({
  steps,
  activeStepId,
  failedStepId,
  isEditing = false,
  onSelectStep,
}) => {
  const reduceMotion = usePrefersReducedMotion();
  return (
    <Box as="section" aria-labelledby="pipe-sequence-heading" minW={0}>
      <Text
        id="pipe-sequence-heading"
        fontSize="xs"
        fontWeight="semibold"
        color="text.secondary"
        mb={3}
      >
        Frozen sequence
      </Text>
      <HStack
        as="ol"
        listStyleType="none"
        spacing={0}
        align="stretch"
        overflowX="auto"
        pb={2}
        sx={{ scrollbarWidth: "thin" }}
      >
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId;
          const isFailed = step.id === failedStepId;
          const isUnavailable = Boolean(step.unavailableReason);
          return (
            <Box
              as="li"
              key={step.id}
              display="flex"
              alignItems="stretch"
              flex="0 0 auto"
            >
              {index > 0 && (
                <Box
                  aria-hidden
                  alignSelf="center"
                  h="1px"
                  w={{ base: 5, md: 7 }}
                  bg="border.hover"
                  flex="0 0 auto"
                />
              )}
              <Box
                minW={{ base: "210px", md: "230px" }}
                maxW="260px"
                p={4}
                bg="surface.raised"
                border="1px solid"
                borderColor={
                  isFailed || isUnavailable
                    ? "red.400"
                    : isActive
                      ? "border.focus"
                      : "border.base"
                }
                borderRadius="md"
                transition={
                  reduceMotion
                    ? "none"
                    : "border-color 140ms ease-out, background-color 140ms ease-out, transform 140ms ease-out"
                }
              >
                <HStack align="flex-start" spacing={3}>
                  <Box
                    display="grid"
                    placeItems="center"
                    flex="0 0 auto"
                    w={7}
                    h={7}
                    borderRadius="full"
                    bg={isFailed || isUnavailable ? "red.500" : "brand.600"}
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {index + 1}
                  </Box>
                  <VStack align="start" spacing={1} flex={1} minW={0}>
                    <HStack w="full" spacing={2}>
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                        {step.toolName}
                      </Text>
                      <Box flex={1} />
                      {isFailed || isUnavailable ? (
                        <Tooltip
                          label={step.unavailableReason ?? "Step failed"}
                        >
                          <span>
                            <Icon as={FiAlertTriangle} color="text.error" />
                          </span>
                        </Tooltip>
                      ) : (
                        <Icon
                          as={FiCheck}
                          color="green.500"
                          aria-label="Available"
                        />
                      )}
                      {isEditing && onSelectStep && (
                        <IconButton
                          aria-label={`Edit ${step.toolName}`}
                          icon={<FiEdit3 />}
                          size="xs"
                          minW={{ base: 10, md: 8 }}
                          h={{ base: 10, md: 8 }}
                          variant="ghost"
                          onClick={() => onSelectStep(step.id)}
                        />
                      )}
                    </HStack>
                    {step.summary.length > 0 ? (
                      step.summary.slice(0, 2).map((line) => (
                        <Text
                          key={line}
                          fontSize="xs"
                          color="text.secondary"
                          noOfLines={1}
                        >
                          {line}
                        </Text>
                      ))
                    ) : (
                      <Text fontSize="xs" color="text.secondary">
                        Default configuration
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
};
