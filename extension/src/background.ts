import init, {
  detect_pii,
  sanitize_pii,
  sanitize_secrets,
} from "../wasm/strapd_wasm.js";
import {
  dynamicScriptForOrigin,
  getGrantedOrigins,
  getLocalSettings,
  getRegisteredScripts,
  getSessionValues,
  isOurScriptId,
  registerScripts,
  scriptIdForOrigin,
  setLocalSettings,
  setSessionValues,
  unregisterScripts,
  updateBadge,
} from "./chrome";
import { scanText, type WasmScanner } from "./scan";
import {
  BLOCKED_COUNT_KEY,
  PAUSED_FROM_KEY,
  SETTINGS_KEY,
  isPauseExpired,
  normalizeDetectors,
  normalizeSettings,
  resumeFromPause,
} from "./storage";
import type {
  ExtensionSettings,
  RecordRedactionMessage,
  ResumePausedMessage,
  ScanRequest,
  ScanResponse,
} from "./types";

let enginePromise: Promise<WasmScanner> | null = null;
let counterWrite: Promise<void> = Promise.resolve();

function getWasmEngine(): Promise<WasmScanner> {
  if (!enginePromise) {
    enginePromise = (async () => {
      await init({
        module_or_path: chrome.runtime.getURL("strapd_wasm_bg.wasm"),
      });
      return { detect_pii, sanitize_pii, sanitize_secrets };
    })().catch((error: unknown) => {
      enginePromise = null;
      throw error;
    });
  }

  return enginePromise;
}

async function handleScan(request: ScanRequest): Promise<ScanResponse> {
  try {
    const engine = await getWasmEngine();
    return scanText(engine, request.text, request.detectors);
  } catch (error) {
    enginePromise = null;
    return {
      ok: false,
      clean: true,
      findings: [],
      scrubbedText: request.text,
      elapsedMs: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function readSettings(preserveExpiredPause = false): Promise<ExtensionSettings> {
  const stored = await getLocalSettings();
  return normalizeSettings(stored[SETTINGS_KEY] ?? stored, Date.now(), preserveExpiredPause);
}

function badgePaused(settings: ExtensionSettings): boolean {
  return settings.mode === "paused" && !isPauseExpired(settings.pauseUntil);
}

async function syncBadge(): Promise<void> {
  try {
    updateBadge(badgePaused(await readSettings()));
  } catch {
    // A stale badge is preferable to blocking paste scanning.
  }
}

function recordRedaction(message: RecordRedactionMessage): Promise<void> {
  if (!Number.isFinite(message.count) || message.count <= 0) {
    return Promise.resolve();
  }

  const update = counterWrite.then(async () => {
    const values = await getSessionValues([BLOCKED_COUNT_KEY]);
    const current = values[BLOCKED_COUNT_KEY];
    const next =
      (typeof current === "number" && Number.isFinite(current) ? current : 0) + message.count;
    await setSessionValues({ [BLOCKED_COUNT_KEY]: Math.floor(next) });
  });

  counterWrite = update.catch(() => undefined);
  return update;
}

async function resumePaused(): Promise<ExtensionSettings | undefined> {
  try {
    const settings = await readSettings(true);
    if (settings.mode !== "paused" || !isPauseExpired(settings.pauseUntil)) {
      return settings;
    }

    const values = await getSessionValues([PAUSED_FROM_KEY]);
    const resumed = resumeFromPause(settings, values[PAUSED_FROM_KEY]);
    await setLocalSettings({ [SETTINGS_KEY]: resumed });
    updateBadge(false);
    return resumed;
  } catch {
    // Fall back to the cached settings in the content script.
    return undefined;
  }
}

async function reconcileCustomSites(): Promise<void> {
  try {
    const settings = await readSettings();
    const granted = new Set(await getGrantedOrigins());
    const registered = await getRegisteredScripts();
    const expectedIds = new Set(settings.customSites.map(scriptIdForOrigin));

    for (const pattern of settings.customSites) {
      const id = scriptIdForOrigin(pattern);
      if (!granted.has(pattern) || registered.some((script) => script.id === id)) {
        continue;
      }
      await registerScripts([dynamicScriptForOrigin(pattern)]).catch(() => undefined);
    }

    const staleIds = registered
      .filter((script) => isOurScriptId(script.id) && !expectedIds.has(script.id))
      .map((script) => script.id);
    if (staleIds.length > 0) {
      await unregisterScripts(staleIds).catch(() => undefined);
    }

    await resumePaused();
    await syncBadge();
  } catch {
    // Reconciliation is best effort; default hosts remain available.
  }
}

function isScanRequest(value: unknown): value is ScanRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const request = value as Partial<ScanRequest>;
  return request.type === "SCAN_TEXT" && typeof request.text === "string";
}

function isRecordMessage(value: unknown): value is RecordRedactionMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Partial<RecordRedactionMessage>;
  return message.type === "RECORD_REDACTION" && typeof message.count === "number";
}

function isResumeMessage(value: unknown): value is ResumePausedMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<ResumePausedMessage>).type === "RESUME_PAUSED"
  );
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (isScanRequest(message)) {
    const request: ScanRequest = {
      type: "SCAN_TEXT",
      text: message.text,
      detectors: normalizeDetectors(message.detectors),
    };

    void handleScan(request).then((response) => {
      try {
        sendResponse(response);
      } catch {
        // The content script may have navigated away before the scan finished.
      }
    });
    return true;
  }

  if (isRecordMessage(message)) {
    void recordRedaction(message).then(
      () => {
        try {
          sendResponse({ ok: true });
        } catch {
          // The caller may have navigated away before the counter write finished.
        }
      },
      () => {
        try {
          sendResponse({ ok: false });
        } catch {
          // The caller may have navigated away before the counter write finished.
        }
      },
    );
    return true;
  }

  if (isResumeMessage(message)) {
    void resumePaused().then((settings) => {
      try {
        sendResponse(settings ? { mode: settings.mode } : undefined);
      } catch {
        // The caller may have closed its popup before the resume completed.
      }
    });
    return true;
  }

  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[SETTINGS_KEY]) {
    void syncBadge();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void reconcileCustomSites();
});

chrome.runtime.onStartup.addListener(() => {
  void reconcileCustomSites();
});

void syncBadge();
