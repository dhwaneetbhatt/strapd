import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  VStack,
  HStack,
  Textarea,
  Button,
  Text,
  useClipboard,
  useToast,
  Flex,
  Spacer,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { Tool, InputOutputState } from '../../types';
import { appConfig } from '../../config';

interface ToolInterfaceProps {
  tool: Tool;
  initialInput?: string;
  onInputChange?: (input: string) => void;
}

export interface ToolInterfaceHandle {
  focusInput: () => void;
  clearAll: () => void;
}

const FOCUS_DELAY = 100; // Configurable constant instead of magic number

export const ToolInterface = forwardRef<ToolInterfaceHandle, ToolInterfaceProps>(({ tool, initialInput, onInputChange }, ref) => {
  const [state, setState] = useState<InputOutputState>({
    input: '',
    output: '',
    isProcessing: false,
    error: undefined,
  });

  const { hasCopied, onCopy } = useClipboard(state.output);
  const toast = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const currentToolIdRef = useRef(tool.id);

  // Clear all content
  const handleClear = useCallback(() => {
    setState({
      input: '',
      output: '',
      isProcessing: false,
      error: undefined,
    });
    // Clear URL parameter when clearing input
    onInputChange?.('');
  }, [onInputChange]);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      inputRef.current?.focus();
    },
    clearAll: () => {
      handleClear();
    },
  }), [handleClear]);

  // Process initial input from URL parameters
  const processInitialInput = useCallback(async (input: string) => {
    if (!input.trim()) return;

    setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

    try {
      const result = await Promise.resolve(tool.operation(input));
      setState(prev => ({
        ...prev,
        output: result.success ? result.result || '' : '',
        error: result.success ? undefined : result.error,
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isProcessing: false,
      }));
    }
  }, [tool]);

  // Handle initial input from URL parameters and auto-process
  useEffect(() => {
    if (initialInput && initialInput !== state.input) {
      setState(prev => ({
        ...prev,
        input: initialInput,
      }));

      // Auto-process URL-provided input to generate shareable results
      if (initialInput.trim()) {
        processInitialInput(initialInput);
      }
    }
  }, [initialInput, processInitialInput]);

  // Auto-focus input when tool changes
  useEffect(() => {
    // Update current tool ID ref
    currentToolIdRef.current = tool.id;

    // Clear state when tool changes, but preserve URL input if available
    setState({
      input: initialInput || '',
      output: '',
      isProcessing: false,
      error: undefined,
    });

    // Focus input after a short delay to ensure component is rendered
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, FOCUS_DELAY);

    return () => {
      clearTimeout(focusTimer);
    };
  }, [tool.id, initialInput]);

  // Don't auto-focus copy button - let user tab navigate naturally

  // Process the input with the tool
  const processInput = useCallback(async () => {
    // Capture current values to avoid stale closure issues
    const currentInput = state.input;
    const currentTool = tool;
    const processingToolId = currentToolIdRef.current;

    if (!currentInput.trim()) {
      setState(prev => ({ ...prev, output: '', error: undefined }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

    try {
      const result = await Promise.resolve(currentTool.operation(currentInput));

      // Only update state if we're still on the same tool
      if (currentToolIdRef.current === processingToolId) {
        setState(prev => ({
          ...prev,
          output: result.success ? result.result || '' : '',
          error: result.success ? undefined : result.error,
          isProcessing: false,
        }));
      }
    } catch (error) {
      // Only update state if we're still on the same tool
      if (currentToolIdRef.current === processingToolId) {
        setState(prev => ({
          ...prev,
          output: '',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          isProcessing: false,
        }));
      }
    }
  }, [state.input, tool]); // Include full tool object to detect changes

  // Auto-process if enabled and input changes
  useEffect(() => {
    if (appConfig.tools.autoProcess && state.input.trim()) {
      const timer = setTimeout(processInput, appConfig.tools.debounceDelay);
      return () => clearTimeout(timer);
    } else if (appConfig.tools.autoProcess && !state.input.trim()) {
      // Clear output when input is empty
      setState(prev => ({ ...prev, output: '', error: undefined }));
    }
  }, [state.input, processInput]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setState(prev => ({ ...prev, input: newInput }));
    // Update URL with input parameter
    onInputChange?.(newInput);
  };

  // Handle copy with toast
  const handleCopy = () => {
    onCopy();
    toast({
      title: 'Copied!',
      description: 'Result copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };


  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800' }}
      rounded="lg"
      shadow="md"
      p={6}
      w="full"
    >
      {/* Tool Header */}
      <Flex mb={6} align="center">
        <VStack align="start" spacing={1}>
          <HStack>
            <Text fontSize="xl" fontWeight="bold">
              {tool.name}
            </Text>
            <Badge colorScheme="brand" variant="subtle">
              {tool.category}
            </Badge>
          </HStack>
          <Text
            id="tool-description"
            color="gray.600"
            _dark={{ color: 'gray.400' }}
            fontSize="sm"
          >
            {tool.description}
          </Text>
        </VStack>
        <Spacer />
      </Flex>

      {/* Input/Output Interface */}
      <VStack spacing={6}>
        <HStack spacing={6} align="start" w="full">
          {/* Input Section */}
          <VStack flex={1} align="stretch" spacing={3}>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: 'gray.300' }}>
              Input
            </Text>
            <Textarea
              ref={inputRef}
              value={state.input}
              onChange={handleInputChange}
              placeholder="Enter your text here..."
              size="lg"
              resize="vertical"
              rows={8}
              fontFamily="mono"
              fontSize="sm"
              aria-label={`Input for ${tool.name}`}
              aria-describedby="tool-description"
              tabIndex={1}
            />
          </VStack>

          {/* Output Section */}
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: 'gray.300' }}>
                Output
              </Text>
              <Spacer />
              <Button
                ref={copyButtonRef}
                size="sm"
                variant="ghost"
                leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                onClick={handleCopy}
                colorScheme={hasCopied ? 'green' : 'brand'}
                isDisabled={!state.output}
                opacity={state.output ? 1 : 0.5}
                tabIndex={2}
              >
                {hasCopied ? 'Copied!' : 'Copy'}
              </Button>
            </HStack>
            <Textarea
              value={state.output}
              placeholder="Processed output will appear here..."
              size="lg"
              resize="vertical"
              rows={8}
              fontFamily="mono"
              fontSize="sm"
              isReadOnly
              bg="gray.50"
              _dark={{ bg: 'gray.700' }}
              aria-label={`Output from ${tool.name}`}
              aria-live="polite"
            />
          </VStack>
        </HStack>

        {/* Error Display */}
        {state.error && (
          <Alert status="error" rounded="md">
            <AlertIcon />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <HStack w="full" justify="center" spacing={4}>
          {!appConfig.tools.autoProcess && (
            <Button
              colorScheme="brand"
              onClick={processInput}
              isLoading={state.isProcessing}
              loadingText="Processing..."
              size="lg"
              tabIndex={3}
            >
              Transform
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleClear}
            size="md"
            colorScheme="red"
            tabIndex={4}
          >
            Reset
          </Button>
        </HStack>

      </VStack>
    </Box>
  );
});

ToolInterface.displayName = 'ToolInterface';