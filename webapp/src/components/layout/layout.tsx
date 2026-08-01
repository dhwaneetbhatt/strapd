import { Box, Flex } from "@chakra-ui/react";
import type React from "react";
import { useCommandH, useCommandK, useHelpKey } from "../../hooks/use-keyboard";
import { Header } from "./header";

interface LayoutProps {
  children: React.ReactNode;
  onSearchOpen?: () => void;
  onHelpOpen?: () => void;
  onSidebarToggle?: () => void;
  onNavigationRequest?: (to: string) => boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onSearchOpen,
  onHelpOpen,
  onSidebarToggle,
  onNavigationRequest,
}) => {
  // Set up global keyboard shortcuts
  useCommandK(() => onSearchOpen?.());
  useHelpKey(() => onHelpOpen?.());
  useCommandH(() => onSidebarToggle?.());
  return (
    <Flex direction="column" minH="100vh">
      <Header
        onSearchOpen={onSearchOpen}
        onHelpOpen={onHelpOpen}
        onNavigationRequest={onNavigationRequest}
      />
      <Box flex={1}>{children}</Box>
    </Flex>
  );
};
