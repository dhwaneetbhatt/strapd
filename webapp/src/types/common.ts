// Common UI state types
export interface InputOutputState {
  input: string;
  output: string;
  isProcessing: boolean;
  error?: string;
}

// App preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  favorites: string[]; // Tool IDs
  recent: string[]; // Tool IDs
  autoProcess: boolean;
  copyOnProcess: boolean;
}

// Navigation types
export interface NavItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}