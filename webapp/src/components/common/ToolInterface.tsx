import React, { useState, useCallback, useEffect } from 'react';
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
}

export const ToolInterface: React.FC<ToolInterfaceProps> = ({ tool }) => {
  const [state, setState] = useState<InputOutputState>({
    input: '',
    output: '',
    isProcessing: false,
    error: undefined,
  });

  const { hasCopied, onCopy } = useClipboard(state.output);
  const toast = useToast();

  // Process the input with the tool
  const processInput = useCallback(async () => {
    if (!state.input.trim()) {
      setState(prev => ({ ...prev, output: '', error: undefined }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

    try {
      const result = await Promise.resolve(tool.operation(state.input));

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
  }, [state.input, tool.operation]);

  // Auto-process if enabled and input changes
  useEffect(() => {
    if (appConfig.tools.autoProcess) {
      const timer = setTimeout(processInput, appConfig.tools.debounceDelay);
      return () => clearTimeout(timer);
    }
  }, [state.input, processInput]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, input: e.target.value }));
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

  // Clear all content
  const handleClear = () => {
    setState({
      input: '',
      output: '',
      isProcessing: false,
      error: undefined,
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
          <Text color="gray.600" _dark={{ color: 'gray.400' }} fontSize="sm">
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
              value={state.input}
              onChange={handleInputChange}
              placeholder="Enter your text here..."
              size="lg"
              resize="vertical"
              rows={8}
              fontFamily="mono"
              fontSize="sm"
            />
          </VStack>

          {/* Output Section */}
          <VStack flex={1} align="stretch" spacing={3}>
            <HStack>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" _dark={{ color: 'gray.300' }}>
                Output
              </Text>
              <Spacer />
              {state.output && (
                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                  onClick={handleCopy}
                  colorScheme={hasCopied ? 'green' : 'brand'}
                >
                  {hasCopied ? 'Copied!' : 'Copy'}
                </Button>
              )}
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
            >
              Transform
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleClear}
            size="lg"
          >
            Clear
          </Button>
        </HStack>

        {/* Tool Examples */}
        {tool.examples && tool.examples.length > 0 && (
          <Box w="full" pt={4} borderTop="1px" borderColor="gray.200" _dark={{ borderColor: 'gray.700' }}>
            <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.700" _dark={{ color: 'gray.300' }}>
              Examples:
            </Text>
            <VStack align="start" spacing={2}>
              {tool.examples.map((example, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="xs"
                  onClick={() => setState(prev => ({ ...prev, input: example.input }))}
                  fontFamily="mono"
                  fontSize="xs"
                  height="auto"
                  py={2}
                  px={3}
                  textAlign="left"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  maxW="200px"
                >
                  "{example.input}" → "{example.expectedOutput}"
                </Button>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};