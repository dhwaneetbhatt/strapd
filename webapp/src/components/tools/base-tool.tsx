import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  HStack,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useCallback, useState } from "react";
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

// Hook for shared tool logic
export const useBaseTool = (
  tool: ToolDefinition,
  initialInputs?: Record<string, unknown>,
) => {
  const [state, setState] = useState<BaseToolState>({
    inputs: initialInputs || {},
    outputs: {},
    isProcessing: false,
    error: undefined,
  });

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

  const updateInput = useCallback((key: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      inputs: { ...prev.inputs, [key]: value },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState({
      inputs: {},
      outputs: {},
      isProcessing: false,
      error: undefined,
    });
  }, []);

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
