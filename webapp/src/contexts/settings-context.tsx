import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;

  pinnedToolId: string | null;
  togglePinnedTool: (toolId: string) => void;

  showFavoritesOnly: boolean;
  toggleShowFavoritesOnly: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const FAVORITES_KEY = "strapd_favorites";
const PINNED_TOOL_KEY = "strapd_pinned_tool";
const SHOW_FAVORITES_ONLY_KEY = "strapd_show_favorites_only";

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to parse favorites from localStorage:", error);
      return [];
    }
  });

  // Pinned Tool State
  const [pinnedToolId, setPinnedToolState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PINNED_TOOL_KEY);
    } catch (error) {
      console.error("Failed to retrieve pinned tool from localStorage:", error);
      return null;
    }
  });

  // Show Favorites Only Filter State
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SHOW_FAVORITES_ONLY_KEY);
      return stored === "true";
    } catch (error) {
      console.error(
        "Failed to parse showFavoritesOnly setting from localStorage:",
        error,
      );
      return false;
    }
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (pinnedToolId) {
      localStorage.setItem(PINNED_TOOL_KEY, pinnedToolId);
    } else {
      localStorage.removeItem(PINNED_TOOL_KEY);
    }
  }, [pinnedToolId]);

  useEffect(() => {
    localStorage.setItem(SHOW_FAVORITES_ONLY_KEY, String(showFavoritesOnly));
  }, [showFavoritesOnly]);

  // Actions
  const toggleFavorite = (toolId: string) => {
    setFavorites((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      }
      return [...prev, toolId];
    });
  };

  const isFavorite = (toolId: string) => favorites.includes(toolId);

  const togglePinnedTool = (toolId: string) => {
    setPinnedToolState((prev) => (prev === toolId ? null : toolId));
  };

  const toggleShowFavoritesOnly = () => {
    setShowFavoritesOnly((prev) => !prev);
  };

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
    pinnedToolId,
    togglePinnedTool,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
