import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, PAUSE_DURATION_MS } from "../src/storage";
import type { ExtensionSettings, PasteMode, ScanResponse } from "../src/types";

let scanResponse: ScanResponse;
let resumeResponse: { mode: PasteMode } | undefined = { mode: "ask" };
let deferScans = false;
let pendingScans: Array<(response: unknown) => void> = [];
let currentSettings: ExtensionSettings = DEFAULT_SETTINGS;
let storageListener:
  | ((changes: Record<string, { newValue?: unknown }>, area: string) => void)
  | undefined;

const sendMessage = vi.fn(
  (request: unknown, callback: (response: unknown) => void) => {
    if (typeof request === "object" && request !== null && "type" in request) {
      if (request.type === "SCAN_TEXT") {
        if (deferScans) {
          pendingScans.push(callback);
        } else {
          callback(scanResponse);
        }
        return;
      }
      if (request.type === "RESUME_PAUSED") {
        callback(resumeResponse);
        return;
      }
    }
    callback(undefined);
  },
);

const localSet = vi.fn(
  (_items: Record<string, unknown>, callback?: () => void) => {
    callback?.();
  },
);

const originalAttachShadow = Element.prototype.attachShadow;

beforeAll(async () => {
  Element.prototype.attachShadow = function (_init: ShadowRootInit): ShadowRoot {
    return originalAttachShadow.call(this, { mode: "open" }) as ShadowRoot;
  };

  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      id: "test-extension",
      lastError: undefined,
      sendMessage,
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ settings: currentSettings });
        },
        set: localSet,
      },
      session: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({});
        },
        set: (_items: Record<string, unknown>, callback?: () => void) => {
          callback?.();
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

afterAll(() => {
  Element.prototype.attachShadow = originalAttachShadow;
});

beforeEach(() => {
  document.body.innerHTML = "";
  document.querySelector("[data-strapd-warning]")?.remove();
  sendMessage.mockClear();
  localSet.mockClear();
  resumeResponse = { mode: "ask" };
  deferScans = false;
  pendingScans = [];
  setSettings(DEFAULT_SETTINGS);
  scanResponse = {
    ok: true,
    clean: true,
    findings: [],
    scrubbedText: "clean",
    elapsedMs: 0.8,
  };
});

describe("content paste flow", () => {
  it("inserts clean text immediately without an overlay", async () => {
    const textarea = mountTextarea();

    const event = dispatchPaste("hello");
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(
      {
        type: "SCAN_TEXT",
        text: "hello",
        detectors: DEFAULT_SETTINGS.detectors,
      },
      expect.any(Function),
    );
    expect(textarea.value).toBe("hello");
    expect(overlayRoot("strapd-warning")).toBeNull();
  });

  it("leaves the native paste alone while paused", async () => {
    setSettings({
      ...DEFAULT_SETTINGS,
      mode: "paused",
      pauseUntil: Date.now() + PAUSE_DURATION_MS,
    });
    const textarea = mountTextarea();

    const event = dispatchPaste("hello");
    await nextTick();

    expect(event.defaultPrevented).toBe(false);
    expect(sendMessage).not.toHaveBeenCalled();
    expect(textarea.value).toBe("");
  });

  it("resumes the previous mode when a pause has expired", async () => {
    resumeResponse = { mode: "auto" };
    setSettings({ ...DEFAULT_SETTINGS, mode: "paused", pauseUntil: Date.now() - 1 });
    dirtyResponse();
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    expect(sendMessage).toHaveBeenCalledWith(
      { type: "RESUME_PAUSED" },
      expect.any(Function),
    );
    expect(textarea.value).toBe("Contact [REDACTED_EMAIL]");
    expect(overlayRoot("strapd-warning")).toBeNull();
  });

  it("pastes raw text when expired-pause resume fails", async () => {
    resumeResponse = undefined;
    setSettings({ ...DEFAULT_SETTINGS, mode: "paused", pauseUntil: Date.now() - 1 });
    const textarea = mountTextarea();

    const event = dispatchPaste("Contact dev@example.com");
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "RESUME_PAUSED" },
      expect.any(Function),
    );
    expect(sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SCAN_TEXT" }),
      expect.any(Function),
    );
    expect(textarea.value).toBe("Contact dev@example.com");
  });

  it("ignores a stale scan response after a newer paste", async () => {
    dirtyResponse();
    deferScans = true;
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();
    expect(pendingScans).toHaveLength(1);

    deferScans = false;
    scanResponse = {
      ok: true,
      clean: true,
      findings: [],
      scrubbedText: "later paste",
      elapsedMs: 0.4,
    };
    dispatchPaste("later paste");
    await nextTick();

    const staleScan = pendingScans.shift();
    staleScan?.({
      ok: true,
      clean: false,
      findings: [{ kind: "Email", count: 1 }],
      scrubbedText: "Contact [REDACTED_EMAIL]",
      elapsedMs: 0.7,
    });
    await nextTick();

    expect(textarea.value).toBe("later paste");
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

  it("opens the review card and pastes scrubbed text on Enter", async () => {
    dirtyResponse();
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    expect(overlayRoot("strapd-warning")).not.toBeNull();

    dispatchKey("Enter");
    await nextTick();

    expect(overlayRoot("strapd-warning")).toBeNull();
    expect(textarea.value).toBe("Contact [REDACTED_EMAIL]");
    expect(sendMessage).toHaveBeenCalledWith(
      { type: "RECORD_REDACTION", count: 1 },
      expect.any(Function),
    );
  });

  it("pastes raw text on Shift+Enter", async () => {
    dirtyResponse();
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();
    dispatchKey("Enter", { shiftKey: true });
    await nextTick();

    expect(textarea.value).toBe("Contact dev@example.com");
  });

  it("cancels on Escape without inserting", async () => {
    dirtyResponse();
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();
    dispatchKey("Escape");
    await nextTick();

    expect(overlayRoot("strapd-warning")).toBeNull();
    expect(textarea.value).toBe("");
  });

  it("persists auto mode when Always auto-redact is checked", async () => {
    dirtyResponse();
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    const checkbox = overlayRoot("strapd-warning")?.querySelector<HTMLInputElement>(
      "#strapd-always-auto",
    );
    expect(checkbox).not.toBeNull();
    if (!checkbox) {
      return;
    }
    checkbox.click();
    dispatchKey("Enter");
    await nextTick();

    expect(localSet).toHaveBeenCalledWith(
      { settings: expect.objectContaining({ mode: "auto" }) },
      expect.any(Function),
    );
    expect(textarea.value).toBe("Contact [REDACTED_EMAIL]");
  });

  it("builds the diff only when the user opens it", async () => {
    dirtyResponse();
    mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    const root = overlayRoot("strapd-warning");
    const box = root?.querySelector<HTMLElement>(".diff-box");
    expect(box?.textContent).toBe("");

    root?.querySelector<HTMLButtonElement>(".diff-toggle")?.click();
    await nextTick();

    expect(box?.textContent).toContain("dev@example.com");
    expect(box?.querySelector("del")?.textContent).toBe("dev@example.com");
    expect(box?.querySelector("ins")?.textContent).toBe("[REDACTED_EMAIL]");
  });

  it("auto-redacts without an overlay or layout read", async () => {
    const rectSpy = vi.spyOn(Element.prototype, "getBoundingClientRect");
    setSettings({ ...DEFAULT_SETTINGS, mode: "auto" });
    dirtyResponse();
    const textarea = mountTextarea();

    dispatchPaste("Contact dev@example.com");
    await nextTick();

    expect(textarea.value).toBe("Contact [REDACTED_EMAIL]");
    expect(overlayRoot("strapd-warning")).toBeNull();
    expect(rectSpy).not.toHaveBeenCalled();
    rectSpy.mockRestore();
  });
});

function dirtyResponse(): void {
  scanResponse = {
    ok: true,
    clean: false,
    findings: [{ kind: "Email", count: 1 }],
    scrubbedText: "Contact [REDACTED_EMAIL]",
    elapsedMs: 0.7,
  };
}

function setSettings(next: ExtensionSettings): void {
  currentSettings = next;
  storageListener?.({ settings: { newValue: next } }, "local");
}

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

function overlayRoot(key: string): ShadowRoot | null {
  return document.querySelector<HTMLElement>(`[data-${key}]`)?.shadowRoot ?? null;
}

async function nextTick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
