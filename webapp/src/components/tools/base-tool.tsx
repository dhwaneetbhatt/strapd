import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  HStack,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { appConfig } from "../../config";
import type { Tool, ToolResult } from "../../types";

// Tool definition interface with component
export interface ToolDefinition<T = object> extends Omit<Tool<T>, "operation"> {
  component: React.ComponentType<BaseToolProps>;
  operation: (
    inputs: Record<string, unknown>,
  ) => ToolResult<T> | Promise<ToolResult<T>>;
}

export interface BaseToolProps {
  tool: ToolDefinition;
  initialInputs?: Record<string, unknown>;
  onInputChange?: (inputs: Record<string, unknown>) => void;
}

interface BaseToolState {
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  isProcessing: boolean;
  error?: string;
}

// Helper to handle loose equality strictly (avoiding ==)
const looseEquals = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  // Handle number vs string (e.g. 5 vs "5")
  if (typeof a === "number" && String(a) === b) return true;
  if (typeof b === "number" && String(b) === a) return true;
  // Handle boolean vs string (e.g. false vs "false")
  if (typeof a === "boolean" && String(a) === b) return true;
  if (typeof b === "boolean" && String(b) === a) return true;
  return false;
};

// Hook for shared tool logic
export const useBaseTool = (
  tool: ToolDefinition,
  initialInputs?: Record<string, unknown>,
  onInputChange?: (inputs: Record<string, unknown>) => void,
) => {
  const [state, setState] = useState<BaseToolState>({
    inputs: initialInputs || {},
    outputs: {},
    isProcessing: false,
    error: undefined,
  });

  // Track previous inputs to avoid redundant updates from unstable object references
  const prevInitialInputsRef = useRef<Record<string, unknown>>({});

  // Update internal state when initialInputs change (e.g. from URL)
  // This is important for browser navigation (back/forward)
  useEffect(() => {
    if (initialInputs) {
      // Check if the new initialInputs are actually different from the last ones we processed
      const hasChangedFromLastProp = Object.entries(initialInputs).some(
        ([key, value]) =>
          !looseEquals(prevInitialInputsRef.current[key], value),
      );

      if (!hasChangedFromLastProp) {
        return;
      }

      // Update our ref
      prevInitialInputsRef.current = initialInputs;

      setState((prev) => {
        // Also check if they are different from CURRENT state (redundancy check)
        const hasChangedFromState = Object.entries(initialInputs).some(
          ([key, value]) => !looseEquals(prev.inputs[key], value),
        );

        if (!hasChangedFromState) {
          return prev;
        }

        return {
          ...prev,
          inputs: { ...prev.inputs, ...initialInputs },
        };
      });
    }
  }, [initialInputs]);

  const processInputs = useCallback(async () => {
    setState((prev) => ({ ...prev, isProcessing: true, error: undefined }));

    try {
      const result = await Promise.resolve(tool.operation(state.inputs));
      setState((prev) => ({
        ...prev,
        outputs: result.success ? result : {},
        error: result.success ? undefined : result.error,
        isProcessing: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        outputs: {},
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        isProcessing: false,
      }));
    }
  }, [tool, state.inputs]);

  const updateInput = useCallback(
    (key: string, value: unknown) => {
      setState((prev) => {
        const newInputs = { ...prev.inputs, [key]: value };
        // Propagate change to parent (URL update)
        onInputChange?.(newInputs);
        return {
          ...prev,
          inputs: newInputs,
        };
      });
    },
    [onInputChange],
  );

  const clearAll = useCallback(() => {
    const emptyInputs = {};
    setState({
      inputs: emptyInputs,
      outputs: {},
      isProcessing: false,
      error: undefined,
    });
    onInputChange?.(emptyInputs);
  }, [onInputChange]);

  return {
    ...state,
    updateInput,
    processInputs,
    clearAll,
  };
};

// Base component with common UI elements
export const BaseToolLayout: React.FC<{
  children: React.ReactNode;
  onProcess: () => void;
  onClear: () => void;
  isProcessing: boolean;
  error?: string;
}> = ({ children, onProcess, onClear, isProcessing, error }) => {
  return (
    <VStack spacing={6} align="stretch">
      {children}

      {error && (
        <Alert status="error" rounded="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <HStack w="full" justify="center" spacing={4}>
        {!appConfig.tools.autoProcess && (
          <Button
            colorScheme="brand"
            onClick={onProcess}
            isLoading={isProcessing}
            loadingText="Processing..."
            size="lg"
            tabIndex={0}
          >
            Transform
          </Button>
        )}
        <Button
          data-testid="tool-clear-button"
          variant="outline"
          onClick={onClear}
          size="md"
          colorScheme="red"
          tabIndex={0}
        >
          Reset
        </Button>
      </HStack>
    </VStack>
  );
};
