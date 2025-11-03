import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Header } from './header';

interface LayoutProps {
  children: React.ReactNode;
  onSearchOpen?: () => void;
  onHelpOpen?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onSearchOpen, onHelpOpen }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Header onSearchOpen={onSearchOpen} onHelpOpen={onHelpOpen} />
      <Box flex={1}>
        {children}
      </Box>
    </Flex>
  );
};