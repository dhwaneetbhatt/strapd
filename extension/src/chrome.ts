export function getLocalSettings(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "storage.local.get failed"));
        return;
      }
      resolve(items as Record<string, unknown>);
    });
  });
}

export function setLocalSettings(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "storage.local.set failed"));
        return;
      }
      resolve();
    });
  });
}

export function getSessionValues(keys: string[]): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(keys, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "storage.session.get failed"));
        return;
      }
      resolve(items as Record<string, unknown>);
    });
  });
}

export function setSessionValues(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.set(items, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "storage.session.set failed"));
        return;
      }
      resolve();
    });
  });
}

export function sendToWorker<T>(message: unknown): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "runtime.sendMessage failed"));
        return;
      }
      resolve(response as T | undefined);
    });
  });
}

export function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "tabs.query failed"));
        return;
      }
      resolve(tabs[0]);
    });
  });
}

export function getGrantedOrigins(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    chrome.permissions.getAll((permissions) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "permissions.getAll failed"));
        return;
      }
      resolve(permissions.origins ?? []);
    });
  });
}

export function requestOrigins(origins: string[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.permissions.request({ origins }, (granted) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "permissions.request failed"));
        return;
      }
      resolve(granted);
    });
  });
}

export function removeOrigins(origins: string[]): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.permissions.remove({ origins }, (removed) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "permissions.remove failed"));
        return;
      }
      resolve(removed);
    });
  });
}

export interface DynamicContentScript {
  id: string;
  matches: string[];
  js: string[];
  runAt: "document_idle";
  persistAcrossSessions: boolean;
}

export function getRegisteredScripts(ids?: string[]): Promise<DynamicContentScript[]> {
  return new Promise((resolve, reject) => {
    const query = ids ? { ids } : undefined;
    chrome.scripting.getRegisteredContentScripts(query ?? {}, (scripts) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "scripting.getRegisteredContentScripts failed"));
        return;
      }
      resolve(scripts as DynamicContentScript[]);
    });
  });
}

export function registerScripts(scripts: DynamicContentScript[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.scripting.registerContentScripts(scripts, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "scripting.registerContentScripts failed"));
        return;
      }
      resolve();
    });
  });
}

export function unregisterScripts(ids: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.scripting.unregisterContentScripts({ ids }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message ?? "scripting.unregisterContentScripts failed"));
        return;
      }
      resolve();
    });
  });
}

export function injectContentScript(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      { target: { tabId }, files: ["content.js"] },
      () => {
        const error = chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message ?? "scripting.executeScript failed"));
          return;
        }
        resolve();
      },
    );
  });
}

export function updateBadge(paused: boolean): void {
  chrome.action.setBadgeText({ text: paused ? "OFF" : "" });
  if (paused) {
    chrome.action.setBadgeBackgroundColor({ color: "#d97706" });
  }
}

export function scriptIdForOrigin(originPattern: string): string {
  return `strapd-site-${originPattern.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function isOurScriptId(id: string): boolean {
  return id.startsWith("strapd-site-");
}

export function dynamicScriptForOrigin(originPattern: string): DynamicContentScript {
  return {
    id: scriptIdForOrigin(originPattern),
    matches: [originPattern],
    js: ["content.js"],
    runAt: "document_idle",
    persistAcrossSessions: true,
  };
}

export function originPatternForUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch {
    return null;
  }
}

export function hostnameForUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.hostname;
  } catch {
    return null;
  }
}
