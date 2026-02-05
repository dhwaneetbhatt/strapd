import type React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createInitialState,
  deserializeState,
  getTopToolIds,
  serializeState,
  sortToolsByUsage,
  type ToolUsageState,
  updateToolUsage,
} from "../lib/utils/tool-usage";
import type { Tool } from "../types";

interface SettingsContextType {
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  isFavorite: (toolId: string) => boolean;

  pinnedToolId: string | null;
  togglePinnedTool: (toolId: string) => void;

  showFavoritesOnly: boolean;
  toggleShowFavoritesOnly: () => void;

  recordToolUsage: (toolId: string) => void;
  getFrequentlyUsedTools: (limit?: number) => string[];
  getSortedToolsByUsage: (tools: Tool[]) => Tool[];
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const FAVORITES_KEY = "strapd_favorites";
const PINNED_TOOL_KEY = "strapd_pinned_tool";
const SHOW_FAVORITES_ONLY_KEY = "strapd_show_favorites_only";
const TOOL_USAGE_KEY = "strapd_tool_usage";

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

  // Tool Usage Tracking State
  const [toolUsageState, setToolUsageState] = useState<ToolUsageState>(() => {
    try {
      const stored = localStorage.getItem(TOOL_USAGE_KEY);
      if (stored) {
        return deserializeState(stored);
      }
      return createInitialState();
    } catch (error) {
      console.error("Failed to parse tool usage from localStorage:", error);
      return createInitialState();
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

  useEffect(() => {
    localStorage.setItem(TOOL_USAGE_KEY, serializeState(toolUsageState));
  }, [toolUsageState]);

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

  // Tool Usage Tracking Functions
  const recordToolUsage = (toolId: string) => {
    setToolUsageState((prev) => updateToolUsage(prev, toolId));
  };

  const getFrequentlyUsedTools = useMemo(() => {
    return (limit = 5): string[] => {
      return getTopToolIds(toolUsageState, limit);
    };
  }, [toolUsageState]);

  const getSortedToolsByUsage = useMemo(() => {
    return (tools: Tool[]): Tool[] => {
      return sortToolsByUsage(tools, toolUsageState);
    };
  }, [toolUsageState]);

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
    pinnedToolId,
    togglePinnedTool,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
    recordToolUsage,
    getFrequentlyUsedTools,
    getSortedToolsByUsage,
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
