import {
  Alert,
  AlertIcon,
  Box,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Kbd,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import type React from "react";
import { useKeyboardSettings } from "../../contexts/keyboard-context";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => {
  return (
    <HStack justify="space-between" w="full">
      <Text fontSize="sm" color="text.subtle">
        {description}
      </Text>
      <HStack spacing={1}>
        {keys.map((key) => (
          <Kbd key={key} fontSize="xs" bg="kbd.bg" color="kbd.color">
            {key}
          </Kbd>
        ))}
      </HStack>
    </HStack>
  );
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { shortcutsEnabled, toggleShortcuts } = useKeyboardSettings();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="overlay.base" />
      <ModalContent bg="modal.bg" mx={4}>
        <ModalHeader>
          <Text fontSize="lg" fontWeight="bold">
            ⌨️ Keyboard Shortcuts
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Keyboard shortcuts toggle */}
            <Box
              p={4}
              borderWidth="1px"
              borderRadius="md"
              borderColor="border.subtle"
            >
              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <FormLabel
                  htmlFor="keyboard-shortcuts-toggle"
                  mb="0"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Enable Keyboard Shortcuts
                </FormLabel>
                <Switch
                  id="keyboard-shortcuts-toggle"
                  isChecked={shortcutsEnabled}
                  onChange={toggleShortcuts}
                  colorScheme="blackAlpha"
                  size="md"
                />
              </FormControl>
              <Text fontSize="xs" color="text.muted" mt={2}>
                Toggle all keyboard shortcuts on or off
              </Text>
            </Box>

            {/* Keyboard shortcuts status */}
            {!shortcutsEnabled && (
              <Alert status="info" rounded="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Keyboard shortcuts are currently disabled. Use the toggle
                  above to enable them.
                </Text>
              </Alert>
            )}

            {/* Search & Navigation */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="text.brand"
                mb={3}
              >
                Search & Navigation
              </Text>
              <VStack spacing={2} align="stretch">
                <ShortcutItem
                  keys={["⌘", "K"]}
                  description="Open search palette"
                />
                <ShortcutItem keys={["⌘", "H"]} description="Toggle sidebar" />
                <ShortcutItem keys={["⌘", "I"]} description="Focus input box" />
                <ShortcutItem
                  keys={["⌘", "R"]}
                  description="Reset/clear all content"
                />
                <ShortcutItem
                  keys={["⌘", "S"]}
                  description="Copy tool URL with state"
                />
                <ShortcutItem keys={["."]} description="Show this help" />
                <ShortcutItem
                  keys={["Esc"]}
                  description="Remove focus from inputs"
                />
              </VStack>
            </Box>

            <Divider />

            {/* Sidebar Navigation */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="text.brand"
                mb={3}
              >
                Sidebar Navigation
              </Text>
              <VStack spacing={2} align="stretch">
                <ShortcutItem keys={["↑", "↓"]} description="Navigate tools" />
                <ShortcutItem keys={["Enter"]} description="Select tool" />
                <ShortcutItem keys={["Esc"]} description="Close sidebar" />
              </VStack>
            </Box>

            <Divider />

            {/* Search Palette */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="text.brand"
                mb={3}
              >
                Search Palette
              </Text>
              <VStack spacing={2} align="stretch">
                <ShortcutItem
                  keys={["↑", "↓"]}
                  description="Navigate results"
                />
                <ShortcutItem keys={["Enter"]} description="Select tool" />
                <ShortcutItem keys={["Esc"]} description="Close palette" />
              </VStack>
            </Box>

            <Divider />

            {/* General */}
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="text.brand"
                mb={3}
              >
                Tips
              </Text>
              <VStack spacing={2} align="stretch">
                <Text fontSize="xs" color="text.muted">
                  • Use Ctrl instead of ⌘ on Windows/Linux
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
