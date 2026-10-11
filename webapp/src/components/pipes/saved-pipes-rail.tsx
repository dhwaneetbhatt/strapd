import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiPlus,
  FiUpload,
} from "react-icons/fi";
import type { PipeListItemView } from "./types";

interface SavedPipesRailProps {
  pipes: PipeListItemView[];
  selectedPipeId?: string;
  onSelect: (pipeId: string) => void;
  onCreate: () => void;
  onImport: (file: File) => void;
  isBusy?: boolean;
  importInputId?: string;
}

export const SavedPipesRail: React.FC<SavedPipesRailProps> = ({
  pipes,
  selectedPipeId,
  onSelect,
  onCreate,
  onImport,
  isBusy = false,
  importInputId = "pipe-import-input",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(!selectedPipeId);
  const selectedPipe = pipes.find(({ id }) => id === selectedPipeId);

  useEffect(() => {
    if (selectedPipeId) setIsMobileOpen(false);
  }, [selectedPipeId]);

  const selectPipe = (pipeId: string) => {
    onSelect(pipeId);
    setIsMobileOpen(false);
  };

  return (
    <Box
      as="nav"
      aria-label="Saved pipes"
      w={{ base: "full", lg: "260px" }}
      minW={{ lg: "260px" }}
      borderRight={{ lg: "1px solid" }}
      borderBottom={{ base: "1px solid", lg: "none" }}
      borderColor="border.base"
      bg="sidebar.bg"
      p={{ base: 3, lg: 4 }}
      maxH={{ lg: "calc(100vh - 73px)" }}
      overflowY={{ lg: "auto" }}
    >
      <Flex
        display={{ base: "flex", lg: "none" }}
        align="center"
        justify="space-between"
        gap={3}
      >
        <Box minW={0}>
          <Text fontSize="xs" color="text.secondary">
            Saved pipes
          </Text>
          <Text fontWeight="semibold" noOfLines={1}>
            {selectedPipe?.name ?? `${pipes.length} available`}
          </Text>
        </Box>
        <IconButton
          aria-label={
            isMobileOpen ? "Collapse saved pipes" : "Browse saved pipes"
          }
          aria-expanded={isMobileOpen}
          aria-controls="saved-pipes-mobile-content"
          icon={isMobileOpen ? <FiChevronUp /> : <FiChevronDown />}
          variant="ghost"
          w="44px"
          h="44px"
          onClick={() => setIsMobileOpen((isOpen) => !isOpen)}
        />
      </Flex>

      <Box
        id="saved-pipes-mobile-content"
        display={{ base: isMobileOpen ? "block" : "none", lg: "block" }}
        maxH={{ base: "min(42dvh, 18rem)", lg: "none" }}
        overflowY={{ base: "auto", lg: "visible" }}
        mt={{ base: 3, lg: 0 }}
        pr={{ base: 1, lg: 0 }}
      >
        <VStack align="stretch" spacing={3}>
          <Button
            leftIcon={<FiPlus />}
            variant="outline"
            colorScheme="brand"
            onClick={onCreate}
            isDisabled={isBusy}
            justifyContent="flex-start"
            h={{ base: "44px", lg: "40px" }}
          >
            New pipe
          </Button>
          <Button
            leftIcon={<FiUpload />}
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            isDisabled={isBusy}
            justifyContent="flex-start"
            h={{ base: "44px", lg: "40px" }}
          >
            Import
          </Button>
          <Input
            id={importInputId}
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            display="none"
            aria-label="Import pipe JSON"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = "";
            }}
          />
        </VStack>

        <Divider my={5} />
        <Heading as="h2" size="xs" color="text.secondary" mb={3}>
          Saved pipes
        </Heading>

        {pipes.length === 0 ? (
          <Text fontSize="sm" color="text.secondary" lineHeight="tall">
            Your saved pipes will appear here.
          </Text>
        ) : (
          <VStack as="ul" listStyleType="none" align="stretch" spacing={1}>
            {pipes.map((pipe) => {
              const isSelected = selectedPipeId === pipe.id;
              return (
                <Box as="li" key={pipe.id}>
                  <Button
                    w="full"
                    h={{ base: "44px", lg: "auto" }}
                    py={2.5}
                    px={2.5}
                    justifyContent="flex-start"
                    textAlign="left"
                    variant="ghost"
                    bg={isSelected ? "sidebar.item.active" : "transparent"}
                    borderLeft="1px solid"
                    borderColor={
                      isSelected ? "sidebar.border.active" : "transparent"
                    }
                    borderRadius="md"
                    onClick={() => selectPipe(pipe.id)}
                    isDisabled={isBusy}
                    aria-current={isSelected ? "page" : undefined}
                    _hover={{
                      bg: isSelected ? "bg.selected.hover" : "bg.hover",
                    }}
                  >
                    <HStack align="flex-start" spacing={2.5} w="full">
                      <Icon
                        as={FiFileText}
                        mt={0.5}
                        color={
                          pipe.isRunnable ? "text.secondary" : "text.error"
                        }
                        aria-hidden
                      />
                      <VStack align="start" spacing={0} minW={0} flex={1}>
                        <Text
                          fontSize="sm"
                          fontWeight={isSelected ? "semibold" : "medium"}
                          color="text.primary"
                          noOfLines={1}
                        >
                          {pipe.name}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="text.secondary"
                          noOfLines={1}
                        >
                          {pipe.updatedAt}
                        </Text>
                      </VStack>
                    </HStack>
                  </Button>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
};
