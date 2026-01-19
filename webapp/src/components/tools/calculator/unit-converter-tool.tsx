import {
  Button,
  Collapse,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useCommandI } from "../../../hooks/use-keyboard";
import { useAutoProcess } from "../../../hooks/use-tool-processing";
import { wasmWrapper } from "../../../lib/wasm";
import { CopyButton } from "../../common/copy-button";
import { BaseToolLayout, type BaseToolProps, useBaseTool } from "../base-tool";

interface Unit {
  canonical_name: string;
  aliases: string[];
  category: string;
}

export const UnitConverterToolComponent: React.FC<BaseToolProps> = ({
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
      category: "bytes",
      showAll: false,
      ...initialInputs,
    },
    onInputChange,
  );

  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [allResults, setAllResults] = useState<string>("");
  const valueInputRef = useRef<HTMLInputElement>(null);

  // Focus on value input when Cmd+I is pressed
  useCommandI(() => {
    valueInputRef.current?.focus();
  });

  // Load units when category changes
  useEffect(() => {
    const category = String(inputs.category || "bytes");
    const result = wasmWrapper.get_units_in_category(category);

    if (result.success && result.result) {
      try {
        const units: Unit[] = JSON.parse(result.result);
        setAvailableUnits(units);

        // Set default units if current ones are invalid for this category
        // Only set defaults if we have a value (meaning user is actively using the tool)
        const hasValue = inputs.value !== undefined && inputs.value !== "";
        const fromUnitValid = units.some(
          (u) => u.canonical_name === inputs.fromUnit,
        );
        const toUnitValid = units.some(
          (u) => u.canonical_name === inputs.toUnit,
        );

        if (!fromUnitValid && units.length > 0 && hasValue) {
          updateInput("fromUnit", units[0].canonical_name);
        }
        if (!toUnitValid && units.length > 1 && hasValue) {
          updateInput("toUnit", units[1].canonical_name);
        } else if (!toUnitValid && units.length > 0 && hasValue) {
          updateInput("toUnit", units[0].canonical_name);
        }

        // Ensure category is in URL when we have a value
        if (hasValue && inputs.category && !initialInputs?.category) {
          updateInput("category", inputs.category);
        }
      } catch (err) {
        console.error("Failed to parse units:", err);
      }
    }
  }, [
    inputs.category,
    inputs.value,
    initialInputs?.category,
    inputs.fromUnit,
    inputs.toUnit,
    updateInput,
  ]);

  // Auto-process when inputs change (no debounce for instant conversion)
  useAutoProcess(
    processInputs,
    {
      value: inputs.value,
      category: inputs.category,
      fromUnit: inputs.fromUnit,
      toUnit: inputs.toUnit,
    },
    0, // 0ms delay for instant conversion
  );

  // Update allResults when showAll changes
  useEffect(() => {
    if (inputs.showAll && inputs.value && inputs.fromUnit) {
      const result = wasmWrapper.convert_all(
        Number(inputs.value),
        String(inputs.fromUnit),
      );
      if (result.success && result.result) {
        setAllResults(result.result);
      }
    }
  }, [inputs.showAll, inputs.value, inputs.fromUnit]);

  const categories = [
    { value: "bytes", label: "Bytes" },
    { value: "time", label: "Time" },
    { value: "length", label: "Length" },
    { value: "temperature", label: "Temperature" },
  ];

  return (
    <BaseToolLayout
      onProcess={processInputs}
      onClear={clearAll}
      isProcessing={isProcessing}
      error={error}
    >
      <VStack spacing={4} align="stretch">
        {/* Category and Units Row */}
        <HStack spacing={2} align="flex-end">
          <FormControl flex={1}>
            <FormLabel fontSize="sm" color="text.secondary">
              Category
            </FormLabel>
            <Select
              value={String(inputs.category)}
              onChange={(e) => updateInput("category", e.target.value)}
              bg="form.bg"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl flex={1}>
            <FormLabel fontSize="sm" color="text.secondary">
              From
            </FormLabel>
            <Select
              value={String(inputs.fromUnit)}
              onChange={(e) => updateInput("fromUnit", e.target.value)}
              bg="form.bg"
              isDisabled={availableUnits.length === 0}
            >
              {availableUnits.map((unit) => (
                <option key={unit.canonical_name} value={unit.canonical_name}>
                  {unit.canonical_name}
                  {unit.aliases.length > 0 && ` (${unit.aliases[0]})`}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl flex={1}>
            <FormLabel fontSize="sm" color="text.secondary">
              To
            </FormLabel>
            <Select
              value={String(inputs.toUnit)}
              onChange={(e) => updateInput("toUnit", e.target.value)}
              bg="form.bg"
              isDisabled={availableUnits.length === 0}
            >
              {availableUnits.map((unit) => (
                <option key={unit.canonical_name} value={unit.canonical_name}>
                  {unit.canonical_name}
                  {unit.aliases.length > 0 && ` (${unit.aliases[0]})`}
                </option>
              ))}
            </Select>
          </FormControl>
        </HStack>

        {/* Value and Result Row */}
        <HStack spacing={2} align="flex-end">
          <FormControl flex={1}>
            <FormLabel fontSize="sm" color="text.secondary">
              Value
            </FormLabel>
            <Input
              ref={valueInputRef}
              type="number"
              variant="input"
              value={String(inputs.value ?? "")}
              onChange={(e) => updateInput("value", e.target.value)}
              placeholder="Enter value"
            />
          </FormControl>

          {Boolean(outputs.result) && (
            <FormControl flex={1}>
              <HStack justify="space-between" mb={2}>
                <FormLabel fontSize="sm" color="text.secondary" mb={0}>
                  Result
                </FormLabel>
                <CopyButton value={String(outputs.result)} />
              </HStack>
              <Input
                value={String(outputs.result)}
                readOnly
                variant="input"
                fontWeight="semibold"
              />
            </FormControl>
          )}
        </HStack>

        {/* Show All Conversions Toggle */}
        <Button
          variant="ghost"
          onClick={() => updateInput("showAll", !inputs.showAll)}
          size="sm"
        >
          {inputs.showAll ? "Hide" : "Show"} all conversions
        </Button>

        {/* All Conversions Display */}
        <Collapse in={Boolean(inputs.showAll)} animateOpacity>
          {allResults && (
            <VStack
              align="start"
              spacing={2}
              p={3}
              borderWidth={1}
              borderRadius="md"
              bg="white"
            >
              <Text fontWeight="medium" fontSize="sm" color="text.secondary">
                All {String(inputs.category)} conversions:
              </Text>
              <VStack align="start" spacing={1}>
                {allResults.split("\n").map((line) => (
                  <Text key={line}>• {line}</Text>
                ))}
              </VStack>
            </VStack>
          )}
        </Collapse>
      </VStack>
    </BaseToolLayout>
  );
};
