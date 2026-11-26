export type KeyboardAction =
  | "ignore"
  | "consume"
  | "cancel"
  | "raw"
  | "scrubbed"
  | "toggle-diff";

export interface KeyboardControls<T> {
  diffToggle: T;
  alwaysAuto: T;
  pasteRaw: T;
  cancel: T;
  close: T;
}

export function resolveKeyboardAction<T>(
  event: Pick<KeyboardEvent, "isTrusted" | "key" | "shiftKey">,
  focused: T | null,
  controls: KeyboardControls<T>,
): KeyboardAction {
  if (!event.isTrusted) {
    return "ignore";
  }

  if (event.key === "Escape") {
    return "cancel";
  }

  if (event.key !== "Enter") {
    return "ignore";
  }

  if (focused === controls.diffToggle) {
    return "toggle-diff";
  }
  if (focused === controls.alwaysAuto) {
    return "consume";
  }
  if (focused === controls.pasteRaw) {
    return "raw";
  }
  if (focused === controls.cancel || focused === controls.close) {
    return "cancel";
  }

  return event.shiftKey ? "raw" : "scrubbed";
}
