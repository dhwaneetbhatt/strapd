import { SearchIcon } from "@chakra-ui/icons";
import {
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Kbd,
  useColorModeValue,
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
  const bg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <InputGroup maxW="400px" size="sm">
      <InputLeftElement pointerEvents="none">
        <SearchIcon color="gray.400" />
      </InputLeftElement>

      <Input
        placeholder={placeholder}
        onFocus={onFocus}
        readOnly
        cursor="pointer"
        bg={bg}
        border="1px solid"
        borderColor={borderColor}
        _hover={{ borderColor: "gray.300", _dark: { borderColor: "gray.500" } }}
        _focus={{
          borderColor: "blue.500",
          boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
          bg: "white",
          _dark: { bg: "gray.800" },
        }}
        fontSize="sm"
      />

      <InputRightElement width="auto" pr={2}>
        <HStack spacing={0}>
          <Kbd fontSize="xs" bg="gray.100" _dark={{ bg: "gray.600" }}>
            ⌘
          </Kbd>
          <Kbd fontSize="xs" bg="gray.100" _dark={{ bg: "gray.600" }}>
            K
          </Kbd>
        </HStack>
      </InputRightElement>
    </InputGroup>
  );
};
