import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsProvider, useSettings } from "./settings-context";

describe("SettingsContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initial State - Favorites", () => {
    it("starts with empty favorites when localStorage is empty", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.favorites).toEqual([]);
    });

    it("loads favorites from localStorage", () => {
      localStorage.setItem(
        "strapd_favorites",
        JSON.stringify(["tool1", "tool2"]),
      );

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.favorites).toEqual(["tool1", "tool2"]);
    });

    it("handles invalid JSON in localStorage favorites", () => {
      localStorage.setItem("strapd_favorites", "invalid json");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.favorites).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Initial State - Pinned Tool", () => {
    it("starts with no pinned tool when localStorage is empty", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.pinnedToolId).toBeNull();
    });

    it("loads pinned tool from localStorage", () => {
      localStorage.setItem("strapd_pinned_tool", "tool-123");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.pinnedToolId).toBe("tool-123");
    });
  });

  describe("Initial State - Show Favorites Only", () => {
    it("starts with false when localStorage is empty", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.showFavoritesOnly).toBe(false);
    });

    it("loads true from localStorage", () => {
      localStorage.setItem("strapd_show_favorites_only", "true");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.showFavoritesOnly).toBe(true);
    });

    it("loads false from localStorage", () => {
      localStorage.setItem("strapd_show_favorites_only", "false");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.showFavoritesOnly).toBe(false);
    });
  });

  describe("toggleFavorite", () => {
    it("adds a tool to favorites", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleFavorite("tool1");
      });

      expect(result.current.favorites).toEqual(["tool1"]);
    });

    it("removes a tool from favorites", () => {
      localStorage.setItem(
        "strapd_favorites",
        JSON.stringify(["tool1", "tool2"]),
      );

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleFavorite("tool1");
      });

      expect(result.current.favorites).toEqual(["tool2"]);
    });

    it("adds multiple tools to favorites", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleFavorite("tool1");
      });
      act(() => {
        result.current.toggleFavorite("tool2");
      });
      act(() => {
        result.current.toggleFavorite("tool3");
      });

      expect(result.current.favorites).toEqual(["tool1", "tool2", "tool3"]);
    });

    it("persists favorites to localStorage", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleFavorite("tool1");
      });

      // Wait for useEffect to run
      expect(localStorage.getItem("strapd_favorites")).toBe(
        JSON.stringify(["tool1"]),
      );
    });

    it("toggles favorite on and off", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleFavorite("tool1");
      });
      expect(result.current.favorites).toEqual(["tool1"]);

      act(() => {
        result.current.toggleFavorite("tool1");
      });
      expect(result.current.favorites).toEqual([]);
    });
  });

  describe("isFavorite", () => {
    it("returns false for non-favorite tool", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.isFavorite("tool1")).toBe(false);
    });

    it("returns true for favorite tool", () => {
      localStorage.setItem(
        "strapd_favorites",
        JSON.stringify(["tool1", "tool2"]),
      );

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.isFavorite("tool1")).toBe(true);
      expect(result.current.isFavorite("tool2")).toBe(true);
    });

    it("returns false after removing favorite", () => {
      localStorage.setItem("strapd_favorites", JSON.stringify(["tool1"]));

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.isFavorite("tool1")).toBe(true);

      act(() => {
        result.current.toggleFavorite("tool1");
      });

      expect(result.current.isFavorite("tool1")).toBe(false);
    });
  });

  describe("togglePinnedTool", () => {
    it("pins a tool", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.togglePinnedTool("tool1");
      });

      expect(result.current.pinnedToolId).toBe("tool1");
    });

    it("unpins the current tool", () => {
      localStorage.setItem("strapd_pinned_tool", "tool1");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.pinnedToolId).toBe("tool1");

      act(() => {
        result.current.togglePinnedTool("tool1");
      });

      expect(result.current.pinnedToolId).toBeNull();
    });

    it("switches pinned tool from one to another", () => {
      localStorage.setItem("strapd_pinned_tool", "tool1");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.togglePinnedTool("tool2");
      });

      expect(result.current.pinnedToolId).toBe("tool2");
    });

    it("persists pinned tool to localStorage", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.togglePinnedTool("tool1");
      });

      expect(localStorage.getItem("strapd_pinned_tool")).toBe("tool1");
    });

    it("removes from localStorage when unpinned", () => {
      localStorage.setItem("strapd_pinned_tool", "tool1");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.togglePinnedTool("tool1");
      });

      expect(localStorage.getItem("strapd_pinned_tool")).toBeNull();
    });
  });

  describe("toggleShowFavoritesOnly", () => {
    it("toggles from false to true", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.showFavoritesOnly).toBe(false);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.showFavoritesOnly).toBe(true);
    });

    it("toggles from true to false", () => {
      localStorage.setItem("strapd_show_favorites_only", "true");

      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      expect(result.current.showFavoritesOnly).toBe(true);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(result.current.showFavoritesOnly).toBe(false);
    });

    it("persists to localStorage", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });

      expect(localStorage.getItem("strapd_show_favorites_only")).toBe("true");
    });

    it("toggles multiple times", () => {
      const { result } = renderHook(() => useSettings(), {
        wrapper: SettingsProvider,
      });

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });
      expect(result.current.showFavoritesOnly).toBe(true);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });
      expect(result.current.showFavoritesOnly).toBe(false);

      act(() => {
        result.current.toggleShowFavoritesOnly();
      });
      expect(result.current.showFavoritesOnly).toBe(true);
    });
  });

  describe("Hook Error Handling", () => {
    it("throws error when hook is used outside provider", () => {
      expect(() => {
        renderHook(() => useSettings());
      }).toThrow("useSettings must be used within a SettingsProvider");
    });
  });
});
