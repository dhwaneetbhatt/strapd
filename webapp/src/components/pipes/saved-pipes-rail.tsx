import {
  Box,
  Button,
  Divider,
  Heading,
  HStack,
  Icon,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useRef } from "react";
import { FiFileText, FiPlus, FiUpload } from "react-icons/fi";
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
      p={4}
      maxH={{ base: "300px", lg: "calc(100vh - 73px)" }}
      overflowY="auto"
    >
      <VStack align="stretch" spacing={3}>
        <Button
          leftIcon={<FiPlus />}
          variant="outline"
          colorScheme="brand"
          onClick={onCreate}
          isDisabled={isBusy}
          justifyContent="flex-start"
        >
          New pipe
        </Button>
        <Button
          leftIcon={<FiUpload />}
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          isDisabled={isBusy}
          justifyContent="flex-start"
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
                  h="auto"
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
                  onClick={() => onSelect(pipe.id)}
                  isDisabled={isBusy}
                  aria-current={isSelected ? "page" : undefined}
                  _hover={{ bg: isSelected ? "bg.selected.hover" : "bg.hover" }}
                >
                  <HStack align="flex-start" spacing={2.5} w="full">
                    <Icon
                      as={FiFileText}
                      mt={0.5}
                      color={pipe.isRunnable ? "text.secondary" : "text.error"}
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
                      <Text fontSize="xs" color="text.secondary" noOfLines={1}>
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
  );
};
