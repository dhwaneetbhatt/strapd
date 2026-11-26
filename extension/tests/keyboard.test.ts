import { describe, expect, it } from "vitest";
import { resolveKeyboardAction, type KeyboardControls } from "../src/keyboard";

const controls: KeyboardControls<string> = {
  diffToggle: "diff",
  alwaysAuto: "always",
  pasteRaw: "raw",
  cancel: "cancel",
  close: "close",
};

function action(key: string, focused: string | null, options: Partial<KeyboardEvent> = {}) {
  return resolveKeyboardAction(
    {
      isTrusted: options.isTrusted ?? true,
      key,
      shiftKey: options.shiftKey ?? false,
    },
    focused,
    controls,
  );
}

describe("review card keyboard actions", () => {
  it("maps trusted keys to the focused action", () => {
    expect(action("Enter", null)).toBe("scrubbed");
    expect(action("Enter", null, { shiftKey: true })).toBe("raw");
    expect(action("Enter", "raw")).toBe("raw");
    expect(action("Enter", "cancel")).toBe("cancel");
    expect(action("Escape", "diff")).toBe("cancel");
  });

  it("keeps the diff and checkbox native while consuming the key", () => {
    expect(action("Enter", "diff")).toBe("toggle-diff");
    expect(action("Enter", "always")).toBe("consume");
  });

  it("ignores unrelated and synthesized keys", () => {
    expect(action("Tab", null)).toBe("ignore");
    expect(action("Enter", null, { isTrusted: false })).toBe("ignore");
    expect(action("Escape", null, { isTrusted: false })).toBe("ignore");
  });
});
