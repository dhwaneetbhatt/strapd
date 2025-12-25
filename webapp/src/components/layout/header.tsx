import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spacer,
  Text,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";
import type React from "react";
import { FiGithub, FiTerminal } from "react-icons/fi";
import { RiKeyboardLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import { appConfig } from "../../config";
import { SearchBar } from "../common";

interface HeaderProps {
  onSearchOpen?: () => void;
  onHelpOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchOpen, onHelpOpen }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const isCliPage = location.pathname === "/cli";

  return (
    <Box
      as="header"
      bg="header.bg"
      borderBottom="1px"
      borderColor="header.border"
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="sm"
    >
      <Flex alignItems="center" maxW="full" mx="auto" gap={6}>
        {/* Logo */}
        <Link to="/">
          <Heading size="lg" color="text.brand" _hover={{ opacity: 0.8 }}>
            {appConfig.name}
          </Heading>
        </Link>

        {/* Search Bar - only show on tools page */}
        {!isCliPage && onSearchOpen && (
          <Box display={{ base: "none", md: "block" }}>
            <SearchBar onFocus={onSearchOpen} />
          </Box>
        )}

        <Spacer />

        {/* Navigation and Action buttons */}
        <HStack spacing={2}>
          {/* Keyboard shortcuts help */}
          {onHelpOpen && (
            <Tooltip label="Keyboard Shortcuts" hasArrow>
              <IconButton
                aria-label="Show keyboard shortcuts"
                icon={<RiKeyboardLine />}
                variant="ghost"
                size="md"
                onClick={onHelpOpen}
                color="text.brand.subtle"
              />
            </Tooltip>
          )}

          {/* CLI button */}
          <Tooltip label="CLI Installation Guide" hasArrow>
            <IconButton
              as={Link}
              to="/cli"
              aria-label="CLI Tool"
              icon={<FiTerminal />}
              variant={isCliPage ? "solid" : "ghost"}
              colorScheme={isCliPage ? "brand" : undefined}
              color={!isCliPage ? "text.brand.subtle" : undefined}
              size="md"
            />
          </Tooltip>

          {/* GitHub link */}
          <Tooltip label="View on GitHub" hasArrow>
            <IconButton
              aria-label="View on GitHub"
              icon={<FiGithub />}
              variant="ghost"
              size="md"
              as="a"
              href={appConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              color="text.brand.subtle"
            />
          </Tooltip>

          {/* Dark mode toggle */}
          <Tooltip
            label={`Switch to ${colorMode === "light" ? "dark" : "light"} mode`}
            hasArrow
          >
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="md"
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );
};
