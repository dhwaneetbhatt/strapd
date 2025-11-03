import { useEffect } from "react";
import { useKeyboardSettings } from "../contexts/keyboard-context";

interface UseKeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  callback: () => void;
  preventDefault?: boolean;
}

export const useKeyboardShortcut = ({
  key,
  ctrlKey = false,
  metaKey = false,
  altKey = false,
  shiftKey = false,
  callback,
  preventDefault = true,
}: UseKeyboardShortcutOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCorrectKey = event.key.toLowerCase() === key.toLowerCase();
      const isCorrectCtrl = ctrlKey === event.ctrlKey;
      const isCorrectMeta = metaKey === event.metaKey;
      const isCorrectAlt = altKey === event.altKey;
      const isCorrectShift = shiftKey === event.shiftKey;

      if (
        isCorrectKey &&
        isCorrectCtrl &&
        isCorrectMeta &&
        isCorrectAlt &&
        isCorrectShift
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, ctrlKey, metaKey, altKey, shiftKey, callback, preventDefault]);
};

// Cross-platform keyboard shortcut hook (CMD on Mac, Ctrl on Windows/Linux)
const useCrossPlatformShortcut = (key: string, callback: () => void) => {
  const { shortcutsEnabled } = useKeyboardSettings();

  useKeyboardShortcut({
    key,
    metaKey: true, // CMD on Mac
    ctrlKey: false,
    callback: shortcutsEnabled ? callback : () => {},
  });

  useKeyboardShortcut({
    key,
    ctrlKey: true, // Ctrl on Windows/Linux
    metaKey: false,
    callback: shortcutsEnabled ? callback : () => {},
  });
};

// Convenience hook for common shortcuts
export const useCommandK = (callback: () => void) => {
  useCrossPlatformShortcut("k", callback);
};

// Convenience hook for sidebar toggle
export const useCommandH = (callback: () => void) => {
  useCrossPlatformShortcut("h", callback);
};

// Convenience hook for help modal (only when not focused on input)
export const useHelpKey = (callback: () => void) => {
  const { shortcutsEnabled } = useKeyboardSettings();

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if "." is pressed and we're not focused on an input/textarea
      if (
        event.key === "." &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const activeElement = document.activeElement;
        const isInputFocused =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.getAttribute("contenteditable") === "true");

        if (!isInputFocused) {
          event.preventDefault();
          callback();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback, shortcutsEnabled]);
};

// Hook to remove focus from inputs when Esc is pressed (but not when modals are open)
export const useEscapeBlur = () => {
  const { shortcutsEnabled } = useKeyboardSettings();

  useEffect(() => {
    if (!shortcutsEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Use setTimeout to ensure modal handlers run first
        setTimeout(() => {
          // Double-check if any modals are still open after other handlers
          const hasModalOverlay =
            document.querySelector(".chakra-modal__overlay") ||
            document.querySelector('[role="dialog"]') ||
            document.querySelector("[data-chakra-modal-overlay]") ||
            document.querySelector(".chakra-modal__content");

          if (hasModalOverlay) {
            // Don't interfere with modal behavior
            return;
          }

          const activeElement = document.activeElement as HTMLElement;
          const isInputFocused =
            activeElement &&
            (activeElement.tagName === "INPUT" ||
              activeElement.tagName === "TEXTAREA" ||
              activeElement.getAttribute("contenteditable") === "true");

          if (isInputFocused) {
            activeElement.blur();
          }
        }, 0);
      }
    };

    // Use capture: false to ensure this runs after other handlers
    window.addEventListener("keydown", handleKeyDown, { capture: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutsEnabled]);
};

// Convenience hook for focusing input (CMD+I)
export const useCommandI = (callback: () => void) => {
  useCrossPlatformShortcut("i", callback);
};

// Convenience hook for reset/clear (CMD+R)
export const useCommandR = (callback: () => void) => {
  useCrossPlatformShortcut("r", callback);
};
