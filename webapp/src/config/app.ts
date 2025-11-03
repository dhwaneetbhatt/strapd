// Application configuration
export const appConfig = {
  // App metadata
  name: 'strapd',
  description: 'Developer toolkit for common utilities',
  version: '0.1.0',

  // UI settings
  ui: {
    maxWidth: '1200px',
    defaultSpacing: '6',
    cardPadding: '6',
    borderRadius: 'lg',
  },

  // Tool settings
  tools: {
    debounceDelay: 300, // ms for live updates
    maxInputSize: 1024 * 1024, // 1MB max input size
    autoProcess: true, // Auto-process as user types
  },

  // Keyboard settings
  keyboard: {
    enableShortcuts: true, // Global keyboard shortcuts toggle
  },

  // Local storage keys
  storage: {
    theme: 'strapd-theme',
    favorites: 'strapd-favorites',
    recent: 'strapd-recent',
    preferences: 'strapd-preferences',
  },

  // External links
  links: {
    github: 'https://github.com/dhwaneetbhatt/strapd',
    docs: 'https://docs.strapd.dev',
  },
} as const;

export type AppConfig = typeof appConfig;