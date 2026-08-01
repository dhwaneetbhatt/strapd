import { Box, Modal, ModalContent, ModalOverlay, Text } from "@chakra-ui/react";
import type React from "react";
import { getCategoryIcon } from "../../constants/category-icons";
import { allTools } from "../../tools";
import type { Tool } from "../../types";
import { ToolSearchCombobox } from "./tool-search-combobox";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: Tool) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onToolSelect,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="2xl">
    <ModalOverlay bg="overlay.base" />
    <ModalContent
      mx={4}
      mt="10vh"
      mb={0}
      p={3}
      borderRadius="lg"
      overflow="hidden"
      bg="modal.bg"
    >
      <ToolSearchCombobox
        items={allTools}
        onSelect={(tool) => {
          onToolSelect(tool);
          onClose();
        }}
        label="Search all tools"
        onEscape={onClose}
        renderLeading={(tool) => (
          <Box display="grid" placeItems="center" minW={6} h={6}>
            <Text fontSize="md">{getCategoryIcon(tool.category)}</Text>
          </Box>
        )}
      />
    </ModalContent>
  </Modal>
);
