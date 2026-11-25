import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScanResponse } from "../src/types";

let scanResponse: ScanResponse;
let storageListener:
  | ((changes: Record<string, { newValue?: unknown }>, area: string) => void)
  | undefined;

const sendMessage = vi.fn(
  (_request: unknown, callback: (response: ScanResponse) => void) => {
    callback(scanResponse);
  },
);

beforeAll(async () => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      id: "test-extension",
      sendMessage,
      lastError: undefined,
    },
    storage: {
      local: {
        get: (_defaults: unknown, callback: (value: { enabled: boolean }) => void) => {
          callback({ enabled: true });
        },
      },
      onChanged: {
        addListener: (
          listener: (
            changes: Record<string, { newValue?: unknown }>,
            area: string,
          ) => void,
        ) => {
          storageListener = listener;
        },
      },
    },
  };

  await import("../src/content");
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.querySelector("[data-strapd-warning]")?.remove();
  sendMessage.mockClear();
  setEnabled(true);
  scanResponse = {
    ok: true,
    clean: true,
    findings: [],
    scrubbedText: "clean",
  };
});

describe("content paste flow", () => {
  it("inserts clean text immediately without a warning", async () => {
    scanResponse = {
      ok: true,
      clean: true,
      findings: [],
      scrubbedText: "hello",
    };
    const textarea = mountTextarea();

    const event = dispatchPaste("hello");
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "SCAN_TEXT", text: "hello" },
      expect.any(Function),
    );
    expect(textarea.value).toBe("hello");
    expect(document.querySelector("[data-strapd-warning]")).toBeNull();
  });

  it("leaves the native paste alone while paused", async () => {
    setEnabled(false);
    const textarea = mountTextarea();

    const event = dispatchPaste("hello");
    await nextTick();

    expect(event.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(textarea.value).toBe("");
  });

  it("leaves a file paste alone", async () => {
    const textarea = mountTextarea();

    const event = dispatchPaste("screenshot.png", [
      new File(["binary"], "screenshot.png"),
    ]);
    await nextTick();

    expect(event.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(textarea.value).toBe("");
  });

  it("opens the warning card and pastes scrubbed text on Enter", async () => {
    scanResponse = {
      ok: true,
      clean: false,
      findings: [{ kind: "Email", count: 1 }],
      scrubbedText: "Contact [REDACTED_EMAIL]",
    };
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    expect(document.querySelector("[data-strapd-warning]")).not.toBeNull();

    dispatchKey("Enter");
    await nextTick();

    expect(document.querySelector("[data-strapd-warning]")).toBeNull();
    expect(textarea.value).toBe("Contact [REDACTED_EMAIL]");
  });

  it("pastes raw text on Shift+Enter", async () => {
    scanResponse = {
      ok: true,
      clean: false,
      findings: [{ kind: "Email", count: 1 }],
      scrubbedText: "Contact [REDACTED_EMAIL]",
    };
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    dispatchKey("Enter", { shiftKey: true });
    await nextTick();

    expect(textarea.value).toBe("Contact dev@example.com");
  });

  it("cancels on Escape without inserting", async () => {
    scanResponse = {
      ok: true,
      clean: false,
      findings: [{ kind: "Email", count: 1 }],
      scrubbedText: "Contact [REDACTED_EMAIL]",
    };
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    dispatchKey("Escape");
    await nextTick();

    expect(document.querySelector("[data-strapd-warning]")).toBeNull();
    expect(textarea.value).toBe("");
  });
});

function mountTextarea(): HTMLTextAreaElement {
  const textarea = document.createElement("textarea");
  document.body.append(textarea);
  textarea.focus();
  textarea.setSelectionRange(0, 0);
  return textarea;
}

function dispatchPaste(text: string, files: File[] = []): Event {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: { getData: () => text, files },
  });
  document.dispatchEvent(event);
  return event;
}

function setEnabled(value: boolean): void {
  storageListener?.({ enabled: { newValue: value } }, "local");
}

function dispatchKey(key: string, options: KeyboardEventInit = {}): void {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    }),
  );
}

async function nextTick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
