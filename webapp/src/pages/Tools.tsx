import React, { useState } from 'react';
import { Flex, useDisclosure, IconButton, Box } from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Layout } from '../components/layout/Layout';
import { Sidebar } from '../components/layout/Sidebar';
import { ToolInterface } from '../components/common';
import { CommandPalette } from '../components/common';
import { useCommandK } from '../hooks/useKeyboard';
import { uppercaseTool } from '../tools/stringTools';

export const Tools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState(uppercaseTool);

  const { isOpen: isSidebarOpen, onToggle: onSidebarToggle } = useDisclosure({
    defaultIsOpen: false
  });

  const {
    isOpen: isCommandPaletteOpen,
    onOpen: onCommandPaletteOpen,
    onClose: onCommandPaletteClose
  } = useDisclosure();

  // Set up CMD+K shortcut
  useCommandK(onCommandPaletteOpen);

  return (
    <Layout onSearchOpen={onCommandPaletteOpen}>
      <Box position="relative">
        {/* Mobile sidebar toggle button */}
        <IconButton
          aria-label="Toggle navigation"
          icon={<HamburgerIcon />}
          variant="ghost"
          display={{ base: 'flex', md: 'none' }}
          position="absolute"
          top={4}
          left={4}
          zIndex={15}
          onClick={onSidebarToggle}
        />

        <Flex>
          {/* Sidebar */}
          <Sidebar
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            isOpen={isSidebarOpen}
            onToggle={onSidebarToggle}
          />

          {/* Main Tool Interface */}
          <Flex flex={1} p={8}>
            <ToolInterface tool={selectedTool} />
          </Flex>
        </Flex>

        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={onCommandPaletteClose}
          onToolSelect={setSelectedTool}
        />
      </Box>
    </Layout>
  );
};