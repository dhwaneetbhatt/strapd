import { beforeAll, describe, expect, it, vi } from "vitest";
import { scriptIdForOrigin } from "../src/chrome";
import { DEFAULT_SETTINGS } from "../src/storage";

const CUSTOM_SITE = "http://localhost:3000/*";
const CUSTOM_SCRIPT_ID = scriptIdForOrigin(CUSTOM_SITE);

let grantedOrigins: string[] = [];
let registeredScripts: Array<{ id: string }> = [];
const permissionListeners: Array<() => void> = [];
const DEFAULT_GRANTS = [
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*",
];

beforeAll(async () => {
  grantedOrigins = [...DEFAULT_GRANTS, CUSTOM_SITE];
  registeredScripts = [];

  document.body.innerHTML = `
    <div id="mode-status-hint"></div>
    <div id="detector-count-label"></div>
    <div id="sites-list"></div>
    <button id="add-site-btn"></button>
    <div id="site-status"></div>
    <button id="proof-toggle-btn" aria-expanded="false"></button>
    <div id="proof-drawer" hidden>
      <div id="audit-csp">—</div>
      <div id="audit-hosts">—</div>
      <div id="audit-engine">—</div>
      <div id="audit-session">—</div>
      <button id="self-test-btn"></button>
      <pre id="self-test-result" hidden></pre>
    </div>
  `;

  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      id: "test-extension",
      lastError: undefined,
      sendMessage: (_request: unknown, callback: (response: unknown) => void) => {
        callback(undefined);
      },
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({
            settings: { ...DEFAULT_SETTINGS, customSites: [CUSTOM_SITE] },
          });
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
    tabs: {
      query: (
        _query: unknown,
        callback: (tabs: Array<{ id: number; url: string }>) => void,
      ) => callback([{ id: 1, url: "http://localhost:3000/app" }]),
    },
    permissions: {
      getAll: (callback: (permissions: { origins: string[] }) => void) => {
        callback({ origins: grantedOrigins });
      },
      onAdded: {
        addListener: (listener: () => void) => permissionListeners.push(listener),
      },
      onRemoved: {
        addListener: (listener: () => void) => permissionListeners.push(listener),
      },
    },
    scripting: {
      getRegisteredContentScripts: (
        _query: unknown,
        callback: (scripts: Array<{ id: string }>) => void,
      ) => callback(registeredScripts),
    },
  };

  vi.resetModules();
  await import("../src/popup");
  await tick();
});

describe("custom-site protection state", () => {
  it("requires both a grant and a registered script", () => {
    const label = sitesLabel();
    expect(label).toContain("localhost:3000 · repair needed");
    expect(addSiteButton().textContent).toBe("Repair localhost:3000");
  });

  it("refreshes to protected when the script registration appears", async () => {
    registeredScripts = [{ id: CUSTOM_SCRIPT_ID }];
    notifyPermissionChange();

    await vi.waitFor(() => {
      expect(sitesLabel()).not.toContain("repair needed");
      expect(addSiteButton().textContent).toBe("Protected");
    });
  });

  it("refreshes to repair when the permission is removed", async () => {
    grantedOrigins = [...DEFAULT_GRANTS];
    notifyPermissionChange();

    await vi.waitFor(() => {
      expect(sitesLabel()).toContain("localhost:3000 · access needed");
      expect(addSiteButton().textContent).toBe("Repair localhost:3000");
    });
  });
});

function notifyPermissionChange(): void {
  for (const listener of permissionListeners) {
    listener();
  }
}

function sitesLabel(): string {
  return document.querySelector<HTMLElement>("#sites-list")?.textContent ?? "";
}

function addSiteButton(): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>("#add-site-btn")!;
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
