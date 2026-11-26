import { beforeAll, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/storage";

type MessageListener = (
  message: unknown,
  sender: never,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

let messageListener: MessageListener | undefined;
const startupListeners: Array<() => void> = [];
let localValues: Record<string, unknown> = {};
let sessionValues: Record<string, unknown> = {};
let grantedOrigins: string[] = [];

const setLocalValues = vi.fn(
  (items: Record<string, unknown>, callback?: () => void) => {
    Object.assign(localValues, items);
    callback?.();
  },
);

const setBadgeText = vi.fn((_details: { text: string }) => undefined);

const setSessionValues = vi.fn(
  (items: Record<string, unknown>, callback?: () => void) => {
    Object.assign(sessionValues, items);
    callback?.();
  },
);

const registerContentScripts = vi.fn(
  (_scripts: unknown, callback?: () => void) => {
    callback?.();
  },
);

beforeAll(async () => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      id: "test-extension",
      lastError: undefined,
      getURL: (path: string) => `chrome-extension://test-extension/${path}`,
      onMessage: {
        addListener: (listener: MessageListener) => {
          messageListener = listener;
        },
      },
      onInstalled: {
        addListener: (listener: () => void) => startupListeners.push(listener),
      },
      onStartup: {
        addListener: (listener: () => void) => startupListeners.push(listener),
      },
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ ...localValues });
        },
        set: setLocalValues,
      },
      session: {
        get: (keys: string[], callback: (items: Record<string, unknown>) => void) => {
          setTimeout(() => {
            const selected: Record<string, unknown> = {};
            for (const key of keys) {
              if (key in sessionValues) {
                selected[key] = sessionValues[key];
              }
            }
            callback(selected);
          }, 0);
        },
        set: setSessionValues,
      },
      onChanged: { addListener: () => undefined },
    },
    action: {
      setBadgeText,
      setBadgeBackgroundColor: () => undefined,
    },
    permissions: {
      getAll: (callback: (permissions: { origins?: string[] }) => void) => {
        callback({ origins: [...grantedOrigins] });
      },
      request: (_permissions: unknown, callback: (granted: boolean) => void) => {
        callback(true);
      },
      remove: (_permissions: unknown, callback: (removed: boolean) => void) => {
        callback(true);
      },
    },
    scripting: {
      getRegisteredContentScripts: (
        _query: unknown,
        callback: (scripts: unknown[]) => void,
      ) => {
        callback([]);
      },
      registerContentScripts,
      unregisterContentScripts: (_query: unknown, callback?: () => void) => {
        callback?.();
      },
      executeScript: (_injection: unknown, callback?: () => void) => {
        callback?.();
      },
    },
    tabs: {
      query: (_query: unknown, callback: (tabs: unknown[]) => void) => {
        callback([]);
      },
    },
  };

  await import("../src/background");
});

describe("service worker messages", () => {
  it("serializes concurrent redaction counter updates", async () => {
    sessionValues = {};
    setSessionValues.mockClear();

    const responses = await Promise.all([
      sendToBackground({ type: "RECORD_REDACTION", count: 1 }),
      sendToBackground({ type: "RECORD_REDACTION", count: 1 }),
    ]);

    expect(responses).toEqual([{ ok: true }, { ok: true }]);
    expect(setSessionValues).toHaveBeenCalledTimes(2);
    expect(
      setSessionValues.mock.calls.map(([items]) => items.blockedCount),
    ).toEqual([1, 2]);
    expect(sessionValues.blockedCount).toBe(2);
  });

  it("serializes settings updates and derives the badge from the final state", async () => {
    localValues = { settings: { ...DEFAULT_SETTINGS, mode: "ask" } };
    setLocalValues.mockClear();
    setBadgeText.mockClear();

    const [paused, resumed] = await Promise.all([
      sendToBackground({
        type: "UPDATE_SETTINGS",
        patch: { mode: "paused", pauseUntil: Date.now() + 60_000 },
      }),
      sendToBackground({
        type: "UPDATE_SETTINGS",
        patch: { mode: "auto", pauseUntil: null },
      }),
    ]);

    expect(paused).toEqual({
      settings: expect.objectContaining({ mode: "paused" }),
    });
    expect(resumed).toEqual({
      settings: expect.objectContaining({ mode: "auto" }),
    });
    expect(localValues.settings).toEqual(
      expect.objectContaining({ mode: "auto", pauseUntil: null }),
    );
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: "" });
  });

  it("keeps the badge on when a newer pause follows an expired-pause resume", async () => {
    localValues = {
      settings: {
        ...DEFAULT_SETTINGS,
        mode: "paused",
        pauseUntil: Date.now() - 1,
      },
    };
    sessionValues = { pausedFrom: "auto" };
    setBadgeText.mockClear();

    const [resumed, pausedAgain] = await Promise.all([
      sendToBackground({ type: "RESUME_PAUSED" }),
      sendToBackground({
        type: "UPDATE_SETTINGS",
        patch: { mode: "paused", pauseUntil: Date.now() + 60_000 },
      }),
    ]);

    expect(resumed).toEqual({ mode: "auto" });
    expect(pausedAgain).toEqual({
      settings: expect.objectContaining({ mode: "paused" }),
    });
    expect(setBadgeText).toHaveBeenLastCalledWith({ text: "OFF" });
  });

  it("re-registers a legacy no-port site with wildcard-port matches on startup", async () => {
    localValues = {
      settings: { ...DEFAULT_SETTINGS, customSites: ["http://localhost/*"] },
    };
    grantedOrigins = ["http://localhost/*"];
    registerContentScripts.mockClear();

    for (const listener of startupListeners) {
      listener();
    }

    await vi.waitFor(() => {
      expect(registerContentScripts).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            id: expect.stringContaining("localhost"),
            matches: ["http://localhost/*"],
            runAt: "document_start",
            allFrames: true,
          }),
        ],
        expect.any(Function),
      );
    });

    grantedOrigins = [];
  });
});

function sendToBackground(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    if (!messageListener) {
      throw new Error("service worker listener missing");
    }
    const keepOpen = messageListener(message, {} as never, resolve);
    expect(keepOpen).toBe(true);
  });
}
