import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: true,
};

// Custom theme for strapd
const theme = extendTheme({
  config,

  // Typography
  fonts: {
    mono: "'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace",
    heading: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Color scheme
  colors: {
    brand: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
  },

  // VS Code-inspired semantic tokens for consistent theming
  semanticTokens: {
    colors: {
      // ===== SURFACES =====
      // Main app surfaces - VS Code style
      "surface.base": {
        default: "#f3f3f3", // VS Code light main background
        _dark: "#1e1e1e", // VS Code dark main background
      },
      "surface.raised": {
        default: "white", // Input boxes and raised surfaces
        _dark: "#3c3c3c", // Better contrast for input boxes in dark mode
      },
      "surface.subtle": {
        default: "#f3f3f3", // Subtle backgrounds like VS Code
        _dark: "#1e1e1e",
      },
      "surface.muted": {
        default: "#f8f8f8", // Slightly lighter for contrast
        _dark: "#2d2d30", // VS Code dark input background
      },

      // ===== BORDERS =====
      "border.base": {
        default: "#e5e5e5", // VS Code light borders
        _dark: "#555555", // Lighter borders for better visibility in dark mode
      },
      "border.subtle": {
        default: "#e5e5e5",
        _dark: "#4a4a4a", // Slightly darker than base but still visible
      },
      "border.muted": {
        default: "#f0f0f0", // Very subtle borders
        _dark: "#2d2d30",
      },
      "border.hover": {
        default: "#d4d4d4", // Darker on hover
        _dark: "#464647",
      },
      "border.focus": {
        default: "#007acc", // VS Code blue focus
        _dark: "#007acc",
      },

      // ===== TEXT =====
      "text.primary": {
        default: "#1f1f1f", // Much darker for light mode - almost black like VS Code
        _dark: "#e6e6e6", // Lighter for dark mode - almost white
      },
      "text.secondary": {
        default: "#424242", // Darker secondary text for light mode
        _dark: "#b3b3b3", // Lighter secondary for dark mode
      },
      "text.subtle": {
        default: "#616161", // More readable subtle text for light mode
        _dark: "#b3b3b3", // Much lighter subtle text for better visibility in dark mode
      },
      "text.muted": {
        default: "#757575", // Better contrast muted text
        _dark: "#999999", // Lighter muted text for better visibility in dark mode
      },
      "text.disabled": {
        default: "#bdbdbd", // Disabled text
        _dark: "#4d4d4d",
      },

      // Brand text variations
      "text.brand": {
        default: "#007acc", // VS Code blue
        _dark: "#4fc1ff", // Lighter blue for dark mode
      },
      "text.brand.subtle": {
        default: "#0066b3", // Darker blue
        _dark: "#007acc",
      },

      // Error and status text
      "text.error": {
        default: "#d32f2f", // Red for errors in light mode
        _dark: "#f44336", // Lighter red for dark mode
      },

      // ===== INTERACTIVE STATES =====
      "bg.hover": {
        default: "#f0f0f0", // VS Code hover states
        _dark: "#2a2d2e",
      },
      "bg.active": {
        default: "#e8e8e8", // Active states
        _dark: "#37373d",
      },
      "bg.selected": {
        default: "#e7f3ff", // VS Code selection blue
        _dark: "#264f78",
      },
      "bg.selected.hover": {
        default: "#d4edff", // Darker selection on hover
        _dark: "#2c5282",
      },
      "bg.focused": {
        default: "#f0f0f0", // Focus backgrounds
        _dark: "#2a2d2e",
      },

      // ===== OVERLAYS & MODALS =====
      "overlay.base": {
        default: "rgba(0, 0, 0, 0.4)", // VS Code modal overlay
        _dark: "rgba(0, 0, 0, 0.6)",
      },
      "modal.bg": {
        default: "white", // White modals
        _dark: "#3c3c3c", // Lighter dark modals for better contrast
      },

      // ===== SPECIFIC COMPONENTS =====
      // Search component - white inputs per requirement
      "search.bg": {
        default: "white", // White search input
        _dark: "#2d2d30", // Dark but distinguishable
      },
      "search.border": {
        default: "#e5e5e5", // VS Code borders
        _dark: "#3c3c3c",
      },
      "search.border.hover": {
        default: "#d4d4d4",
        _dark: "#464647",
      },
      "search.border.focus": {
        default: "#007acc", // VS Code blue focus
        _dark: "#007acc",
      },
      "search.focus.bg": {
        default: "white", // Keep white on focus
        _dark: "#2d2d30",
      },
      "search.icon": {
        default: "#888888", // Subtle icons
        _dark: "#858585",
      },

      // Sidebar component - VS Code sidebar colors
      "sidebar.bg": {
        default: "#f3f3f3", // Match main background
        _dark: "#252526", // VS Code dark sidebar
      },
      "sidebar.border": {
        default: "#e5e5e5", // VS Code borders
        _dark: "#3c3c3c",
      },
      "sidebar.item.hover": {
        default: "#f0f0f0", // VS Code hover
        _dark: "#2a2d2e",
      },
      "sidebar.item.active": {
        default: "#e7f3ff", // VS Code active selection
        _dark: "#264f78",
      },
      "sidebar.item.focused": {
        default: "#e0e0e0", // Darker focus state for better visibility
        _dark: "#37373d",
      },
      "sidebar.border.active": {
        default: "#007acc", // VS Code blue accent
        _dark: "#007acc",
      },
      "sidebar.border.focused": {
        default: "#999999", // Stronger focus border
        _dark: "#666666",
      },

      // Header component
      "header.bg": {
        default: "#f3f3f3", // Match main background
        _dark: "#2d2d30", // Slightly different from main
      },
      "header.border": {
        default: "#e5e5e5", // VS Code borders
        _dark: "#3c3c3c",
      },

      // Keyboard shortcuts
      "kbd.bg": {
        default: "#f0f0f0", // VS Code kbd style
        _dark: "#464647",
      },
      "kbd.color": {
        default: "#666666", // VS Code text
        _dark: "#cccccc",
      },

      // Form controls - white inputs per requirement
      "form.bg": {
        default: "white", // White form inputs
        _dark: "#2d2d30", // Dark but distinguishable
      },
      "form.border": {
        default: "#e5e5e5", // VS Code borders
        _dark: "#3c3c3c",
      },
      "form.border.hover": {
        default: "#d4d4d4",
        _dark: "#464647",
      },
      "form.border.focus": {
        default: "#007acc", // VS Code blue focus
        _dark: "#007acc",
      },
      "form.focus.bg": {
        default: "white", // Keep white on focus
        _dark: "#2d2d30",
      },

      // Tools interface
      "tool.bg": {
        default: "#f8f8f8", // Subtle tool background
        _dark: "#2d2d30",
      },
      "tool.output.bg": {
        default: "white", // White output areas
        _dark: "#2a2a2a", // Slightly lighter than main background for better separation
      },
    },
    sizes: {
      // Tool interface heights - calculated to fill viewport minus header and padding
      "tool.container": "calc(100vh - 180px)",
      "tool.textarea.min": "300px",
    },
  },

  // Component styles
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
      variants: {
        copy: {
          bg: "transparent",
          color: "gray.600",
          _dark: {
            color: "gray.400",
          },
          _hover: {
            bg: "blackAlpha.100",
            _dark: {
              bg: "whiteAlpha.200",
            },
          },
          _active: {
            bg: "blackAlpha.200",
            _dark: {
              bg: "whiteAlpha.300",
            },
          },
          _disabled: {
            opacity: 0.5,
          },
          fontSize: "xs",
          h: "6",
          minW: "6",
          px: 2,
        },
        action: {
          bg: "transparent",
          color: "text.secondary",
          fontSize: "1.2em",
          _active: {
            bg: "blackAlpha.200",
            _dark: {
              bg: "whiteAlpha.300",
            },
          },
          p: 1,
          h: "auto",
          minW: "auto",
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: "brand.500",
        fontFamily: "mono",
        fontSize: "sm",
      },
      variants: {
        toolInput: {
          size: "lg",
          resize: "vertical",
          rows: 12,
          fontFamily: "mono",
          fontSize: "sm",
          h: "full",
        },
        toolOutput: {
          size: "lg",
          resize: "vertical",
          rows: 12,
          fontFamily: "mono",
          fontSize: "sm",
          h: "full",
          bg: "tool.output.bg",
        },
        input: {
          size: "sm",
          resize: "vertical",
          rows: 8,
          fontFamily: "mono",
          fontSize: "sm",
        },
        output: {
          size: "sm",
          resize: "vertical",
          rows: 8,
          fontFamily: "mono",
          fontSize: "sm",
          bg: "tool.output.bg",
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: "brand.500",
        fontFamily: "mono",
        fontSize: "sm",
      },
    },
  },

  // Global styles - VS Code inspired
  styles: {
    global: () => ({
      body: {
        bg: "surface.base", // VS Code main background (subtle gray)
        color: "text.primary", // VS Code text colors
      },
      // Ensure all inputs have white backgrounds
      "input, textarea": {
        bg: "form.bg !important", // White inputs per requirement
        borderColor: "form.border",
        _hover: {
          borderColor: "form.border.hover",
        },
        _focus: {
          borderColor: "form.border.focus",
          bg: "form.focus.bg !important",
        },
        _placeholder: {
          color: "gray.400",
          opacity: 1,
          fontFamily: "mono",
          fontSize: "sm",
          _dark: {
            color: "gray.500",
          },
        },
      },
    }),
  },

  // Spacing and sizing
  space: {
    "4.5": "1.125rem",
    "5.5": "1.375rem",
  },

  // Border radius
  radii: {
    none: "0",
    sm: "0.25rem",
    base: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
});

export default theme;
