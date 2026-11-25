import { beforeAll, describe, expect, it, vi } from "vitest";

type MessageListener = (
  message: unknown,
  sender: never,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

let messageListener: MessageListener | undefined;
let sessionValues: Record<string, unknown> = {};

const setSessionValues = vi.fn(
  (items: Record<string, unknown>, callback?: () => void) => {
    Object.assign(sessionValues, items);
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
      onInstalled: { addListener: () => undefined },
      onStartup: { addListener: () => undefined },
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({});
        },
        set: (_items: Record<string, unknown>, callback?: () => void) => {
          callback?.();
        },
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
      setBadgeText: () => undefined,
      setBadgeBackgroundColor: () => undefined,
    },
    permissions: {
      getAll: (callback: (permissions: { origins?: string[] }) => void) => {
        callback({ origins: [] });
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
      registerContentScripts: (_scripts: unknown, callback?: () => void) => {
        callback?.();
      },
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
