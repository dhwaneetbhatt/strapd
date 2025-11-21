import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  HStack,
  Input,
  Kbd,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCategoryIcon } from "../../constants/category-icons";
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
  return (
    <Box
      p={2}
      cursor="pointer"
      onClick={() => onSelect(tool)}
      bg={isSelected ? "bg.selected" : "transparent"}
      borderLeft="2px solid"
      borderColor={isSelected ? "sidebar.border.active" : "transparent"}
      borderRadius="md"
      _hover={{ bg: isSelected ? "bg.selected.hover" : "bg.hover" }}
      transition="all 0.2s"
    >
      <HStack spacing={2} fontSize="sm">
        <Text fontSize="md">{getCategoryIcon(tool.category)}</Text>
        <VStack align="start" spacing={0} flex={1}>
          <Text fontWeight="medium" fontSize="sm">
            {tool.name}
          </Text>
          <HStack spacing={2} fontSize="xs" color="text.subtle">
            <Text noOfLines={1} flex={1}>
              {tool.description}
            </Text>
            {tool.aliases && tool.aliases.length > 0 && (
              <Text color="text.muted" whiteSpace="nowrap">
                ({tool.aliases.join(", ")})
              </Text>
            )}
          </HStack>
        </VStack>
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
      <ModalOverlay bg="overlay.base" />
      <ModalContent
        mx={4}
        mt="10vh"
        mb={0}
        borderRadius="lg"
        overflow="hidden"
        bg="modal.bg"
      >
        {/* Search Input */}
        <HStack p={3} borderBottom="1px" borderColor="border.base">
          <SearchIcon color="search.icon" />
          <Input
            ref={inputRef}
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            variant="unstyled"
            fontSize="md"
            _placeholder={{ color: "text.subtle" }}
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
            <Box p={4} textAlign="center">
              <Text fontSize="sm" color="text.subtle">
                Start typing to search through all tools...
              </Text>
              <Text fontSize="xs" color="text.muted" mt={1}>
                Use ↑↓ to navigate, Enter to select, Esc to close
              </Text>
            </Box>
          ) : results.length === 0 ? (
            // No results
            <Box p={4} textAlign="center">
              <Text fontSize="sm" color="text.subtle">
                No tools found for "{query}"
              </Text>
              <Text fontSize="xs" color="text.muted" mt={1}>
                Try searching for "case", "base64", "json", etc.
              </Text>
            </Box>
          ) : (
            // Results list
            <VStack spacing={0} align="stretch" p={1}>
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
          <Box p={2} borderTop="1px" borderColor="border.base">
            <HStack justify="space-between" fontSize="xs" color="text.subtle">
              <Text>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </Text>
              <HStack spacing={3} fontSize="xs">
                <HStack spacing={1}>
                  <Kbd fontSize="xs">↑↓</Kbd>
                  <Text>nav</Text>
                </HStack>
                <HStack spacing={1}>
                  <Kbd fontSize="xs">⏎</Kbd>
                  <Text>select</Text>
                </HStack>
              </HStack>
            </HStack>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
};
