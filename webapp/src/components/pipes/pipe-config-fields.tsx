import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import type { ToolOption } from "../../types";

interface PipeConfigFieldsProps {
  options: ToolOption[];
  values: Record<string, unknown>;
  onChange: (optionId: string, value: string | number | boolean) => void;
  errors?: Record<string, string>;
  isDisabled?: boolean;
}

export const PipeConfigFields: React.FC<PipeConfigFieldsProps> = ({
  options,
  values,
  onChange,
  errors = {},
  isDisabled = false,
}) => {
  if (options.length === 0) return null;

  return (
    <VStack align="stretch" spacing={5}>
      {options.map((option) => {
        const fieldId = `pipe-option-${option.id}`;
        const value = values[option.id] ?? option.defaultValue;
        const error = errors[option.id];

        if (option.type === "boolean") {
          return (
            <FormControl key={option.id} isInvalid={Boolean(error)}>
              <HStack
                as="label"
                htmlFor={fieldId}
                align="flex-start"
                cursor={isDisabled ? "not-allowed" : "pointer"}
                spacing={3}
              >
                <Box
                  as="input"
                  id={fieldId}
                  type="checkbox"
                  checked={Boolean(value)}
                  disabled={isDisabled}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    onChange(option.id, event.target.checked)
                  }
                  mt={1}
                  w={4}
                  h={4}
                  accentColor="var(--chakra-colors-brand-600)"
                />
                <VStack align="start" spacing={0} ml={1}>
                  <FormLabel as="span" mb={0} cursor="inherit">
                    {option.name}
                  </FormLabel>
                  <FormHelperText mt={1}>{option.description}</FormHelperText>
                </VStack>
              </HStack>
              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </FormControl>
          );
        }

        return (
          <FormControl key={option.id} isInvalid={Boolean(error)}>
            <FormLabel htmlFor={fieldId}>{option.name}</FormLabel>
            {option.type === "select" ? (
              <Select
                id={fieldId}
                value={String(value)}
                isDisabled={isDisabled}
                onChange={(event) => onChange(option.id, event.target.value)}
                bg="form.bg"
              >
                {option.options?.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={fieldId}
                type={option.type === "number" ? "number" : "text"}
                value={String(value)}
                isDisabled={isDisabled}
                min={option.type === "number" ? option.min : undefined}
                max={option.type === "number" ? option.max : undefined}
                step={option.type === "number" ? option.step : undefined}
                onChange={(event) => {
                  if (option.type !== "number") {
                    onChange(option.id, event.target.value);
                    return;
                  }
                  onChange(
                    option.id,
                    event.target.value === "" ? "" : event.target.valueAsNumber,
                  );
                }}
              />
            )}
            <SimpleGrid columns={1}>
              {!error && <FormHelperText>{option.description}</FormHelperText>}
              {error && <FormErrorMessage>{error}</FormErrorMessage>}
            </SimpleGrid>
          </FormControl>
        );
      })}
    </VStack>
  );
};
