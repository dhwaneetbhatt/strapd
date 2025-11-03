import React, { createContext, useContext, useState } from 'react';
import { appConfig } from '../config';

interface KeyboardContextType {
  shortcutsEnabled: boolean;
  toggleShortcuts: () => void;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

interface KeyboardProviderProps {
  children: React.ReactNode;
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ children }) => {
  const [shortcutsEnabled, setShortcutsEnabled] = useState(() => {
    const saved = localStorage.getItem(appConfig.storage.preferences);
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        return preferences.keyboardShortcuts ?? appConfig.keyboard.enableShortcuts;
      } catch {
        return appConfig.keyboard.enableShortcuts;
      }
    }
    return appConfig.keyboard.enableShortcuts;
  });

  const toggleShortcuts = () => {
    setShortcutsEnabled((prev: boolean) => {
      const newValue = !prev;

      // Save to localStorage
      const currentPreferences = (() => {
        try {
          const saved = localStorage.getItem(appConfig.storage.preferences);
          return saved ? JSON.parse(saved) : {};
        } catch {
          return {};
        }
      })();

      localStorage.setItem(
        appConfig.storage.preferences,
        JSON.stringify({
          ...currentPreferences,
          keyboardShortcuts: newValue,
        })
      );

      return newValue;
    });
  };

  const value = {
    shortcutsEnabled,
    toggleShortcuts,
  };

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
};

export const useKeyboardSettings = () => {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboardSettings must be used within a KeyboardProvider');
  }
  return context;
};