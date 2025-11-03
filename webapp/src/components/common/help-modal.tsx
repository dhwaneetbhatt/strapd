import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Kbd,
  Divider,
  Box,
  useColorModeValue,
  Alert,
  AlertIcon,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useKeyboardSettings } from '../../contexts/keyboard-context';

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
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
        {description}
      </Text>
      <HStack spacing={1}>
        {keys.map((key, index) => (
          <Kbd key={index} fontSize="xs">
            {key}
          </Kbd>
        ))}
      </HStack>
    </HStack>
  );
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const bg = useColorModeValue('white', 'gray.800');
  const { shortcutsEnabled, toggleShortcuts } = useKeyboardSettings();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg={bg} mx={4}>
        <ModalHeader>
          <Text fontSize="lg" fontWeight="bold">
            ⌨️ Keyboard Shortcuts
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Keyboard shortcuts toggle */}
            <Box p={4} borderWidth="1px" borderRadius="md" borderColor={useColorModeValue('gray.200', 'gray.600')}>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="keyboard-shortcuts-toggle" mb="0" fontSize="sm" fontWeight="medium">
                  Enable Keyboard Shortcuts
                </FormLabel>
                <Switch
                  id="keyboard-shortcuts-toggle"
                  isChecked={shortcutsEnabled}
                  onChange={toggleShortcuts}
                  colorScheme="brand"
                />
              </FormControl>
              <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} mt={2}>
                Toggle all keyboard shortcuts on or off
              </Text>
            </Box>

            {/* Keyboard shortcuts status */}
            {!shortcutsEnabled && (
              <Alert status="info" rounded="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Keyboard shortcuts are currently disabled. Use the toggle above to enable them.
                </Text>
              </Alert>
            )}

            {/* Search & Navigation */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="brand.600" _dark={{ color: 'brand.300' }} mb={3}>
                Search & Navigation
              </Text>
              <VStack spacing={2} align="stretch">
                <ShortcutItem keys={['⌘', 'K']} description="Open search palette" />
                <ShortcutItem keys={['⌘', 'H']} description="Toggle sidebar" />
                <ShortcutItem keys={['⌘', 'I']} description="Focus input box" />
                <ShortcutItem keys={['⌘', 'R']} description="Reset/clear all content" />
                <ShortcutItem keys={['.']} description="Show this help" />
                <ShortcutItem keys={['Esc']} description="Remove focus from inputs" />
              </VStack>
            </Box>

            <Divider />

            {/* Sidebar Navigation */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="brand.600" _dark={{ color: 'brand.300' }} mb={3}>
                Sidebar Navigation
              </Text>
              <VStack spacing={2} align="stretch">
                <ShortcutItem keys={['↑', '↓']} description="Navigate tools" />
                <ShortcutItem keys={['Enter']} description="Select tool" />
                <ShortcutItem keys={['Esc']} description="Close sidebar" />
              </VStack>
            </Box>

            <Divider />

            {/* Search Palette */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="brand.600" _dark={{ color: 'brand.300' }} mb={3}>
                Search Palette
              </Text>
              <VStack spacing={2} align="stretch">
                <ShortcutItem keys={['↑', '↓']} description="Navigate results" />
                <ShortcutItem keys={['Enter']} description="Select tool" />
                <ShortcutItem keys={['Esc']} description="Close palette" />
              </VStack>
            </Box>

            <Divider />

            {/* General */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="brand.600" _dark={{ color: 'brand.300' }} mb={3}>
                Tips
              </Text>
              <VStack spacing={2} align="stretch">
                <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                  • Input box auto-focuses when you select a tool
                </Text>
                <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                  • Sidebar auto-closes after tool selection
                </Text>
                <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
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