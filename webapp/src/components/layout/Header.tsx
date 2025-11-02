import React from 'react';
import {
  Box,
  Flex,
  Heading,
  IconButton,
  useColorMode,
  useColorModeValue,
  Spacer,
  HStack,
  Text,
  Button,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FiGithub, FiTerminal } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { SearchBar } from '../common';
import { appConfig } from '../../config';

interface HeaderProps {
  onSearchOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchOpen }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const location = useLocation();
  const isCliPage = location.pathname === '/cli';

  return (
    <Box
      as="header"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="sm"
    >
      <Flex alignItems="center" maxW="full" mx="auto">
        {/* Logo and Title */}
        <HStack spacing={6}>
          <HStack spacing={3}>
            <Link to="/">
              <Heading size="lg" color="brand.600" _hover={{ opacity: 0.8 }}>
                {appConfig.name}
              </Heading>
            </Link>
            <Text
              fontSize="sm"
              color="gray.500"
              display={{ base: 'none', lg: 'block' }}
            >
              {appConfig.description}
            </Text>
          </HStack>

          {/* Search Bar - only show on tools page */}
          {!isCliPage && onSearchOpen && (
            <Box display={{ base: 'none', md: 'block' }}>
              <SearchBar onFocus={onSearchOpen} />
            </Box>
          )}
        </HStack>

        <Spacer />

        {/* Navigation and Action buttons */}
        <HStack spacing={2}>
          {/* CLI button */}
          <IconButton
            as={Link}
            to="/cli"
            aria-label="CLI Tool"
            icon={<FiTerminal />}
            variant={isCliPage ? 'solid' : 'ghost'}
            colorScheme={isCliPage ? 'brand' : undefined}
            color={!isCliPage ? 'brand.500' : undefined}
            _dark={{ color: !isCliPage ? 'brand.300' : undefined }}
            size="md"
          />

          {/* GitHub link */}
          <IconButton
            aria-label="View on GitHub"
            icon={<FiGithub />}
            variant="ghost"
            size="md"
            as="a"
            href={appConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            color="brand.500"
            _dark={{ color: 'brand.300' }}
          />

          {/* Dark mode toggle */}
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="md"
          />
        </HStack>
      </Flex>
    </Box>
  );
};