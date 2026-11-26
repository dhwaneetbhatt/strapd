import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/storage";

const FIXTURE_URL = "chrome-extension://test-extension/test.html";

let originalLocation: PropertyDescriptor | undefined;

const sendMessage = vi.fn(
  (request: unknown, callback: (response: unknown) => void) => {
    if (
      typeof request === "object" &&
      request !== null &&
      "type" in request &&
      request.type === "SCAN_TEXT"
    ) {
      callback({
        ok: true,
        clean: true,
        findings: [],
        scrubbedText: "hello",
        elapsedMs: 0.4,
      });
      return;
    }
    callback(undefined);
  },
);

beforeAll(async () => {
  originalLocation = Object.getOwnPropertyDescriptor(window, "location");
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL(FIXTURE_URL),
  });

  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      id: "test-extension",
      lastError: undefined,
      getURL: (path: string) => `chrome-extension://test-extension/${path}`,
      sendMessage,
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ settings: DEFAULT_SETTINGS });
        },
        set: (_items: Record<string, unknown>, callback?: () => void) => callback?.(),
      },
      session: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({});
        },
        set: (_items: Record<string, unknown>, callback?: () => void) => callback?.(),
      },
      onChanged: { addListener: () => undefined },
    },
  };

  await import("../src/content");
});

afterAll(() => {
  if (originalLocation) {
    Object.defineProperty(window, "location", originalLocation);
  }
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-strapd-fixture");
  window.getSelection()?.removeAllRanges();
  sendMessage.mockClear();
});

describe("local fixture paste", () => {
  it("leaves native paste alone without an explicit fixture opt-in", async () => {
    const textarea = mountTextarea();

    const event = dispatchPaste("hello");
    await tick();

    expect(event.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(textarea.value).toBe("");
  });

  it("intercepts paste when the fixture explicitly opts in", async () => {
    document.documentElement.dataset.strapdFixture = "true";
    const textarea = mountTextarea();

    const event = dispatchPaste("hello");
    await tick();

    expect(event.defaultPrevented).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SCAN_TEXT", text: "hello" }),
      expect.any(Function),
    );
    expect(textarea.value).toBe("hello");
  });
});

function mountTextarea(): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  document.body.append(textarea);
  textarea.focus();
  textarea.setSelectionRange(0, 0);
  return textarea;
}

function dispatchPaste(text: string): Event {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { getData: () => text, files: [] },
  });
  document.dispatchEvent(event);
  return event;
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
