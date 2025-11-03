import { SearchIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  HStack,
  Input,
  Kbd,
  Modal,
  ModalContent,
  ModalOverlay,
  Spacer,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { searchTools } from "../../tools";
import type { Tool } from "../../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: Tool) => void;
}

interface SearchResultProps {
  tool: Tool;
  isSelected: boolean;
  onSelect: (tool: Tool) => void;
}

const SearchResult: React.FC<SearchResultProps> = ({
  tool,
  isSelected,
  onSelect,
}) => {
  const bg = useColorModeValue("gray.50", "gray.700");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const selectedBorder = useColorModeValue("blue.200", "blue.600");

  return (
    <Box
      p={3}
      cursor="pointer"
      onClick={() => onSelect(tool)}
      bg={isSelected ? selectedBg : "transparent"}
      borderLeft="2px solid"
      borderColor={isSelected ? selectedBorder : "transparent"}
      borderRadius="md"
      _hover={{ bg: isSelected ? selectedBg : bg }}
      transition="all 0.2s"
    >
      <HStack spacing={3}>
        <Text fontSize="lg">
          {tool.category === "string"
            ? "📝"
            : tool.category === "encoding"
              ? "🔄"
              : tool.category === "security"
                ? "🔐"
                : tool.category === "dataFormats"
                  ? "📋"
                  : tool.category === "identifiers"
                    ? "🎲"
                    : tool.category === "datetime"
                      ? "⏰"
                      : tool.category === "random"
                        ? "🎲"
                        : "🔧"}
        </Text>
        <VStack align="start" spacing={0} flex={1}>
          <Text fontWeight="medium" fontSize="sm">
            {tool.name}
          </Text>
          <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
            {tool.description}
          </Text>
        </VStack>
        <Spacer />
        <Badge size="sm" colorScheme="gray" variant="subtle">
          {tool.category}
        </Badge>
        {isSelected && <Kbd fontSize="xs">Enter</Kbd>}
      </HStack>
    </Box>
  );
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onToolSelect,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search results
  const results = query.trim() ? searchTools(query) : [];

  const handleToolSelect = useCallback(
    (tool: Tool) => {
      onToolSelect(tool);
      onClose();
    },
    [onToolSelect, onClose],
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          if (results[selectedIndex]) {
            handleToolSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, handleToolSelect]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4} mt="10vh" mb={0} borderRadius="lg" overflow="hidden">
        {/* Search Input */}
        <HStack
          p={4}
          borderBottom="1px"
          borderColor="gray.200"
          _dark={{ borderColor: "gray.700" }}
        >
          <SearchIcon color="gray.400" />
          <Input
            ref={inputRef}
            placeholder="Search tools... (type to filter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            variant="unstyled"
            fontSize="lg"
            _placeholder={{ color: "gray.400" }}
          />
          <HStack spacing={1}>
            <Kbd fontSize="xs">⌘</Kbd>
            <Kbd fontSize="xs">K</Kbd>
          </HStack>
        </HStack>

        {/* Search Results */}
        <Box maxH="60vh" overflowY="auto">
          {query.trim() === "" ? (
            // Show help when no query
            <Box p={6} textAlign="center">
              <Text color="gray.500" _dark={{ color: "gray.400" }}>
                Start typing to search through all tools...
              </Text>
              <Text
                fontSize="sm"
                color="gray.400"
                _dark={{ color: "gray.500" }}
                mt={2}
              >
                Use ↑↓ arrow keys to navigate, Enter to select, Escape to close
              </Text>
            </Box>
          ) : results.length === 0 ? (
            // No results
            <Box p={6} textAlign="center">
              <Text color="gray.500" _dark={{ color: "gray.400" }}>
                No tools found for "{query}"
              </Text>
              <Text
                fontSize="sm"
                color="gray.400"
                _dark={{ color: "gray.500" }}
                mt={2}
              >
                Try searching for "uppercase", "base64", "json", etc.
              </Text>
            </Box>
          ) : (
            // Results list
            <VStack spacing={1} align="stretch" p={2}>
              {results.map((tool, index) => (
                <SearchResult
                  key={tool.id}
                  tool={tool}
                  isSelected={index === selectedIndex}
                  onSelect={handleToolSelect}
                />
              ))}
            </VStack>
          )}
        </Box>

        {/* Footer */}
        {results.length > 0 && (
          <Box
            p={3}
            borderTop="1px"
            borderColor="gray.200"
            _dark={{ borderColor: "gray.700" }}
          >
            <HStack
              justify="space-between"
              fontSize="xs"
              color="gray.500"
              _dark={{ color: "gray.400" }}
            >
              <Text>
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </Text>
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Kbd fontSize="xs">↑↓</Kbd>
                  <Text>navigate</Text>
                </HStack>
                <HStack spacing={1}>
                  <Kbd fontSize="xs">Enter</Kbd>
                  <Text>select</Text>
                </HStack>
                <HStack spacing={1}>
                  <Kbd fontSize="xs">Esc</Kbd>
                  <Text>close</Text>
                </HStack>
              </HStack>
            </HStack>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
};
