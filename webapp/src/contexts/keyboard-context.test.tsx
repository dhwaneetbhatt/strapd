import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KeyboardProvider, useKeyboardSettings } from "./keyboard-context";

// Mock appConfig
vi.mock("../config", () => ({
  appConfig: {
    storage: {
      preferences: "strapd_preferences",
    },
    keyboard: {
      enableShortcuts: true,
    },
  },
}));

describe("KeyboardContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("loads shortcuts enabled from default config when localStorage is empty", () => {
      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(true);
    });

    it("loads shortcuts enabled from localStorage when available", () => {
      localStorage.setItem(
        "strapd_preferences",
        JSON.stringify({ keyboardShortcuts: false }),
      );

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(false);
    });

    it("loads shortcuts enabled as true from localStorage", () => {
      localStorage.setItem(
        "strapd_preferences",
        JSON.stringify({ keyboardShortcuts: true }),
      );

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(true);
    });

    it("falls back to default when localStorage has invalid JSON", () => {
      localStorage.setItem("strapd_preferences", "invalid json{");

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(true);
    });

    it("uses default when localStorage has valid JSON but no keyboardShortcuts key", () => {
      localStorage.setItem(
        "strapd_preferences",
        JSON.stringify({ otherSetting: "value" }),
      );

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(true);
    });
  });

  describe("toggleShortcuts", () => {
    it("toggles shortcuts from true to false", () => {
      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(true);

      act(() => {
        result.current.toggleShortcuts();
      });

      expect(result.current.shortcutsEnabled).toBe(false);
    });

    it("toggles shortcuts from false to true", () => {
      localStorage.setItem(
        "strapd_preferences",
        JSON.stringify({ keyboardShortcuts: false }),
      );

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(false);

      act(() => {
        result.current.toggleShortcuts();
      });

      expect(result.current.shortcutsEnabled).toBe(true);
    });

    it("persists toggle to localStorage", () => {
      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      act(() => {
        result.current.toggleShortcuts();
      });

      const stored = localStorage.getItem("strapd_preferences");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored || "");
      expect(parsed.keyboardShortcuts).toBe(false);
    });

    it("preserves other preferences when toggling", () => {
      localStorage.setItem(
        "strapd_preferences",
        JSON.stringify({
          keyboardShortcuts: true,
          otherSetting: "preserved",
        }),
      );

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      act(() => {
        result.current.toggleShortcuts();
      });

      const stored = localStorage.getItem("strapd_preferences");
      const parsed = JSON.parse(stored || "");
      expect(parsed.keyboardShortcuts).toBe(false);
      expect(parsed.otherSetting).toBe("preserved");
    });

    it("handles corrupt localStorage when toggling", () => {
      localStorage.setItem("strapd_preferences", "corrupt{");

      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      act(() => {
        result.current.toggleShortcuts();
      });

      // Should still work and create valid JSON
      const stored = localStorage.getItem("strapd_preferences");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored || "");
      expect(parsed.keyboardShortcuts).toBe(false);
    });

    it("toggles multiple times correctly", () => {
      const { result } = renderHook(() => useKeyboardSettings(), {
        wrapper: KeyboardProvider,
      });

      expect(result.current.shortcutsEnabled).toBe(true);

      act(() => {
        result.current.toggleShortcuts();
      });
      expect(result.current.shortcutsEnabled).toBe(false);

      act(() => {
        result.current.toggleShortcuts();
      });
      expect(result.current.shortcutsEnabled).toBe(true);

      act(() => {
        result.current.toggleShortcuts();
      });
      expect(result.current.shortcutsEnabled).toBe(false);
    });
  });

  describe("Hook Error Handling", () => {
    it("throws error when hook is used outside provider", () => {
      expect(() => {
        renderHook(() => useKeyboardSettings());
      }).toThrow("useKeyboardSettings must be used within a KeyboardProvider");
    });
  });
});
