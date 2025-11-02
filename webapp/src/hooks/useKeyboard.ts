import { useEffect } from 'react';

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

      if (isCorrectKey && isCorrectCtrl && isCorrectMeta && isCorrectAlt && isCorrectShift) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, ctrlKey, metaKey, altKey, shiftKey, callback, preventDefault]);
};

// Convenience hook for common shortcuts
export const useCommandK = (callback: () => void) => {
  useKeyboardShortcut({
    key: 'k',
    metaKey: true, // CMD on Mac
    ctrlKey: false, // Don't require Ctrl
    callback,
  });

  // Also support Ctrl+K for Windows/Linux
  useKeyboardShortcut({
    key: 'k',
    ctrlKey: true,
    metaKey: false,
    callback,
  });
};