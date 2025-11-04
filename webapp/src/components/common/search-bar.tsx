import { SearchIcon } from "@chakra-ui/icons";
import {
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Kbd,
} from "@chakra-ui/react";
import type React from "react";

interface SearchBarProps {
  onFocus: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onFocus,
  placeholder = "Search tools...",
}) => {
  return (
    <InputGroup maxW="400px" size="sm">
      <InputLeftElement pointerEvents="none">
        <SearchIcon color="search.icon" />
      </InputLeftElement>

      <Input
        placeholder={placeholder}
        onClick={(e) => {
          e.currentTarget.blur(); // Immediately blur to prevent refocus issues
          onFocus();
        }}
        readOnly
        cursor="pointer"
        bg="search.bg"
        border="1px solid"
        borderColor="search.border"
        _hover={{ borderColor: "search.border.hover" }}
        _focus={{
          borderColor: "search.border.focus",
          boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
          bg: "search.focus.bg",
        }}
        fontSize="sm"
      />

      <InputRightElement width="auto" pr={2}>
        <HStack spacing={0}>
          <Kbd fontSize="xs" bg="kbd.bg" color="kbd.color">
            ⌘
          </Kbd>
          <Kbd fontSize="xs" bg="kbd.bg" color="kbd.color">
            K
          </Kbd>
        </HStack>
      </InputRightElement>
    </InputGroup>
  );
};
