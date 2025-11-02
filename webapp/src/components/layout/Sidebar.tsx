import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Collapse,
  useDisclosure,
  IconButton,
  Flex,
  Spacer,
  HStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Tool, ToolGroup } from '../../types';
import { toolGroups } from '../../tools';

interface SidebarProps {
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface ToolGroupSectionProps {
  group: ToolGroup;
  selectedTool: Tool;
  onToolSelect: (tool: Tool) => void;
}

const ToolGroupSection: React.FC<ToolGroupSectionProps> = ({
  group,
  selectedTool,
  onToolSelect,
}) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeBorder = useColorModeValue('blue.200', 'blue.600');

  return (
    <Box w="full">
      {/* Group Header */}
      <Button
        variant="ghost"
        justifyContent="flex-start"
        w="full"
        p={3}
        h="auto"
        fontWeight="medium"
        onClick={onToggle}
        leftIcon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
        _hover={{ bg: hoverBg }}
      >
        <HStack spacing={2} flex={1}>
          <Text>{group.icon}</Text>
          <Text fontSize="sm">{group.name}</Text>
          <Spacer />
          <Badge size="sm" colorScheme="gray" variant="subtle">
            {group.tools.length}
          </Badge>
        </HStack>
      </Button>

      {/* Group Tools */}
      <Collapse in={isOpen}>
        <VStack spacing={1} align="stretch" pl={6} pr={2}>
          {group.tools.map((tool) => (
            <Button
              key={tool.id}
              variant="ghost"
              justifyContent="flex-start"
              size="sm"
              w="full"
              py={2}
              px={3}
              h="auto"
              fontWeight="normal"
              onClick={() => onToolSelect(tool)}
              bg={selectedTool.id === tool.id ? activeBg : 'transparent'}
              borderLeft="2px solid"
              borderColor={selectedTool.id === tool.id ? activeBorder : 'transparent'}
              _hover={{ bg: selectedTool.id === tool.id ? activeBg : hoverBg }}
              borderRadius="md"
              textAlign="left"
            >
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {tool.name}
                </Text>
                <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>
                  {tool.description}
                </Text>
              </VStack>
            </Button>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTool,
  onToolSelect,
  isOpen,
  onToggle,
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <>
      {/* Sidebar */}
      <Box
        w={{ base: isOpen ? '280px' : '0', md: isOpen ? '280px' : '60px' }}
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
        transition="width 0.2s"
        overflow="hidden"
        position={{ base: 'fixed', md: 'relative' }}
        left={{ base: 0, md: 'auto' }}
        top={{ base: 0, md: 'auto' }}
        h={{ base: '100vh', md: '100vh' }}
        zIndex={{ base: 10, md: 'auto' }}
        flexShrink={0}
      >
        {/* Toggle Button - Desktop */}
        <IconButton
          aria-label="Toggle sidebar"
          icon={<HamburgerIcon />}
          variant="ghost"
          size="sm"
          position="absolute"
          top={2}
          right={2}
          display={{ base: 'none', md: 'flex' }}
          onClick={onToggle}
        />

        {/* Sidebar Content */}
        <Box
          p={4}
          pt={8}
          height="100%"
          overflowY="auto"
          css={{
            /* Custom scrollbar styling */
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.300',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'gray.400',
            },
          }}
        >
          {isOpen && (
            <VStack spacing={4} align="stretch">
              <Text fontSize="xs" fontWeight="bold" color="gray.500" _dark={{ color: 'gray.400' }} textTransform="uppercase" letterSpacing="wide">
                Developer Tools
              </Text>

              {toolGroups.map((group) => (
                <ToolGroupSection
                  key={group.category}
                  group={group}
                  selectedTool={selectedTool}
                  onToolSelect={onToolSelect}
                />
              ))}
            </VStack>
          )}
        </Box>
      </Box>

      {/* Overlay for mobile */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          bg="blackAlpha.600"
          zIndex={5}
          display={{ base: 'block', md: 'none' }}
          onClick={onToggle}
        />
      )}
    </>
  );
};