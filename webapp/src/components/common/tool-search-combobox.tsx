import { SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  usePrefersReducedMotion,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useId, useMemo, useState } from "react";
import { searchItems } from "../../lib/utils/search";

export interface ToolSearchItem {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];
  category?: string;
}

interface ToolSearchComboboxProps<T extends ToolSearchItem> {
  items: T[];
  onSelect: (item: T) => void;
  label?: string;
  showDefaultResults?: boolean;
  resultLimit?: number;
  onEscape?: () => void;
  renderLeading?: (item: T) => React.ReactNode;
  renderTrailing?: (item: T) => React.ReactNode;
}

export const ToolSearchCombobox = <T extends ToolSearchItem>({
  items,
  onSelect,
  label = "Search tools",
  showDefaultResults = false,
  resultLimit,
  onEscape,
  renderLeading,
  renderTrailing,
}: ToolSearchComboboxProps<T>) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const reduceMotion = usePrefersReducedMotion();
  const results = useMemo(() => {
    const matches = query.trim()
      ? searchItems(query, items)
      : showDefaultResults
        ? items
        : [];
    return resultLimit ? matches.slice(0, resultLimit) : matches;
  }, [items, query, resultLimit, showDefaultResults]);
  const activeResult = results[activeIndex];

  const choose = (item: T) => {
    onSelect(item);
    setQuery("");
    setActiveIndex(0);
    setIsOpen(false);
  };

  return (
    <Box>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="search.icon" />
        </InputLeftElement>
        <Input
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={
            isOpen && activeResult
              ? `${listboxId}-option-${activeResult.id}`
              : undefined
          }
          placeholder="Search tools..."
          value={query}
          bg="search.bg"
          borderColor="search.border"
          _hover={{ borderColor: "search.border.hover" }}
          _focus={{ borderColor: "search.border.focus" }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((current) =>
                Math.min(current + 1, Math.max(0, results.length - 1)),
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => Math.max(0, current - 1));
            } else if (event.key === "Home") {
              event.preventDefault();
              setActiveIndex(0);
            } else if (event.key === "End") {
              event.preventDefault();
              setActiveIndex(Math.max(0, results.length - 1));
            } else if (event.key === "Enter" && isOpen && activeResult) {
              event.preventDefault();
              choose(activeResult);
            } else if (event.key === "Escape") {
              setIsOpen(false);
              onEscape?.();
            }
          }}
        />
      </InputGroup>

      {isOpen && (
        <Box
          id={listboxId}
          role="listbox"
          aria-label={`${label} results`}
          mt={2}
          border="1px solid"
          borderColor="border.base"
          borderRadius="md"
          bg="surface.raised"
          maxH="60vh"
          overflowY="auto"
          transition={reduceMotion ? "none" : "opacity 140ms ease-out"}
        >
          {!query.trim() && !showDefaultResults ? (
            <Box px={3} py={4} textAlign="center">
              <Text fontSize="sm" color="text.secondary">
                Start typing to search through tools.
              </Text>
              <Text fontSize="xs" color="text.muted" mt={1}>
                Use ↑↓ to navigate, Enter to select, Esc to close.
              </Text>
            </Box>
          ) : results.length === 0 ? (
            <Box px={3} py={4} textAlign="center">
              <Text fontSize="sm" color="text.secondary">
                No tools found for “{query}”.
              </Text>
              <Text fontSize="xs" color="text.muted" mt={1}>
                Try a tool name, alias, or category.
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch" p={1}>
              {results.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <Box
                    id={`${listboxId}-option-${item.id}`}
                    key={item.id}
                    role="option"
                    aria-selected={isActive}
                    cursor="pointer"
                    borderRadius="md"
                    px={3}
                    py={2}
                    bg={isActive ? "bg.selected" : "transparent"}
                    _hover={{ bg: "bg.hover" }}
                    transition={
                      reduceMotion ? "none" : "background-color 120ms ease-out"
                    }
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(item)}
                  >
                    <HStack align="start" spacing={3}>
                      {renderLeading?.(item)}
                      <Box minW={0} flex={1}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {item.name}
                        </Text>
                        {item.description && (
                          <Text
                            fontSize="xs"
                            color="text.secondary"
                            noOfLines={1}
                          >
                            {item.description}
                          </Text>
                        )}
                      </Box>
                      {renderTrailing?.(item)}
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
          <HStack
            justify="space-between"
            px={3}
            py={2}
            borderTop="1px solid"
            borderColor="border.base"
            color="text.muted"
            fontSize="xs"
          >
            <Text aria-live="polite">
              {results.length} result{results.length === 1 ? "" : "s"}
            </Text>
            <Text>↑↓ navigate · Enter select</Text>
          </HStack>
        </Box>
      )}
    </Box>
  );
};
