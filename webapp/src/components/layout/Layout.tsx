import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  onSearchOpen?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onSearchOpen }) => {
  return (
    <Flex direction="column" minH="100vh">
      <Header onSearchOpen={onSearchOpen} />
      <Box flex={1}>
        {children}
      </Box>
    </Flex>
  );
};