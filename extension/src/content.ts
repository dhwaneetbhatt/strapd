import { getLocalSettings, sendToWorker, setLocalSettings } from "./chrome";
import {
  captureSelection,
  findEditableTarget,
  insertText,
  type SelectionSnapshot,
} from "./insert";
import { SETTINGS_KEY, isPauseExpired, normalizeSettings } from "./storage";
import type {
  ExtensionSettings,
  Finding,
  PasteMode,
  ScanRequest,
  ScanResponse,
  WarningSelection,
} from "./types";
import { showWarning } from "./ui";

const SCAN_TIMEOUT_MS = 15_000;

interface Dismissable {
  dismiss: () => void;
}

let settings: ExtensionSettings | null = null;
let requestSequence = 0;
let activeOverlay: Dismissable | null = null;

function onPaste(event: ClipboardEvent): void {
  if (!settings || settings.mode === "paused" && !isPauseExpired(settings.pauseUntil)) {
    return;
  }

  const clipboard = event.clipboardData;
  if (!clipboard || clipboard.files.length > 0) {
    return;
  }

  const target =
    findEditableTarget(event.target instanceof Element ? event.target : null) ??
    findEditableTarget(document.activeElement);
  if (!target) {
    return;
  }

  const text = clipboard.getData("text/plain");
  if (!text) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  void handlePaste(target, text);
}

async function handlePaste(target: HTMLElement, text: string): Promise<void> {
  const request = ++requestSequence;
  activeOverlay?.dismiss();
  activeOverlay = null;
  const snapshot = captureSelection(target);

  if (!settings) {
    insertText(target, text, snapshot);
    return;
  }

  if (settings.mode === "paused") {
    await resumeExpiredPause();
  }
  if (request !== requestSequence) {
    return;
  }
  if (!settings || settings.mode === "paused") {
    insertText(target, text, snapshot);
    return;
  }

  const mode = settings.mode;
  const response = await scan(text, settings);

  if (request !== requestSequence) {
    return;
  }
  if (!response.ok || response.clean) {
    insertText(target, text, snapshot);
    return;
  }

  if (mode === "auto") {
    autoRedact(target, response, snapshot);
    return;
  }

  await askBeforePaste(target, text, response, snapshot, request);
}

function autoRedact(
  target: HTMLElement,
  response: ScanResponse,
  snapshot: SelectionSnapshot,
): void {
  insertText(target, response.scrubbedText, snapshot);
  recordRedaction(response.findings);
}

async function askBeforePaste(
  target: HTMLElement,
  text: string,
  response: ScanResponse,
  snapshot: SelectionSnapshot,
  request: number,
): Promise<void> {
  let selection: WarningSelection;
  let warning: ReturnType<typeof showWarning> | null = null;
  try {
    warning = showWarning({
      findings: response.findings,
      originalText: text,
      scrubbedText: response.scrubbedText,
    });
    activeOverlay = warning;
    selection = await warning.result;
  } catch {
    // Fail open: the original text is already known and no UI is mandatory.
    insertText(target, text, snapshot);
    return;
  }

  if (activeOverlay === warning) {
    activeOverlay = null;
  }
  if (request !== requestSequence) {
    return;
  }

  if (selection.alwaysAuto) {
    settings = { ...settings!, mode: "auto", pauseUntil: null };
    void setLocalSettings({ [SETTINGS_KEY]: settings }).catch(() => undefined);
  }

  if (selection.action === "cancel") {
    target.focus({ preventScroll: true });
    return;
  }

  insertText(target, selection.action === "scrubbed" ? response.scrubbedText : text, snapshot);
  if (selection.action === "scrubbed") {
    recordRedaction(response.findings);
  }
}

function recordRedaction(findings: Finding[]): void {
  const count = countFindings(findings);
  if (count <= 0) {
    return;
  }
  void sendToWorker({ type: "RECORD_REDACTION", count }).catch(() => undefined);
}

function scan(text: string, current: ExtensionSettings): Promise<ScanResponse> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (response: ScanResponse): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
      resolve(response);
    };

    timer = setTimeout(() => {
      finish(failOpen(text, "Scan timed out"));
    }, SCAN_TIMEOUT_MS);

    const request: ScanRequest = {
      type: "SCAN_TEXT",
      text,
      detectors: current.detectors,
    };

    try {
      chrome.runtime.sendMessage(request, (response: unknown) => {
        const error = chrome.runtime.lastError;
        if (error) {
          finish(failOpen(text, error.message ?? "Scan message failed"));
          return;
        }
        if (!isScanResponse(response)) {
          finish(failOpen(text, "Invalid scan response"));
          return;
        }
        finish(response);
      });
    } catch (error) {
      finish(failOpen(text, error instanceof Error ? error.message : String(error)));
    }
  });
}

async function resumeExpiredPause(): Promise<void> {
  try {
    const response = await sendToWorker<{ mode?: PasteMode }>({
      type: "RESUME_PAUSED",
    });
    if (settings && (response?.mode === "ask" || response?.mode === "auto")) {
      settings = { ...settings, mode: response.mode, pauseUntil: null };
    }
  } catch {
    // An unreachable worker leaves the cached pause until storage syncs.
  }
}

function failOpen(text: string, error: string): ScanResponse {
  return {
    ok: false,
    clean: true,
    findings: [],
    scrubbedText: text,
    elapsedMs: 0,
    error,
  };
}

function isScanResponse(value: unknown): value is ScanResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Partial<ScanResponse>;
  return (
    typeof response.ok === "boolean" &&
    typeof response.clean === "boolean" &&
    typeof response.scrubbedText === "string" &&
    Array.isArray(response.findings) &&
    typeof response.elapsedMs === "number"
  );
}

function countFindings(findings: Finding[]): number {
  return findings.reduce((total, finding) => total + finding.count, 0);
}

function syncSettings(): void {
  void getLocalSettings()
    .then((stored) => {
      settings = normalizeSettings(stored[SETTINGS_KEY] ?? stored, Date.now(), true);
    })
    .catch(() => {
      settings = null;
    });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || (!changes[SETTINGS_KEY] && !changes.enabled)) {
      return;
    }

    const change = changes[SETTINGS_KEY]?.newValue ?? {
      enabled: changes.enabled?.newValue,
    };
    settings = normalizeSettings(change, Date.now(), true);
  });
}

function install(): void {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    return;
  }

  const scope = window as typeof window & {
    __strapdGuardInstalled?: boolean;
  };

  if (scope.__strapdGuardInstalled) {
    return;
  }
  scope.__strapdGuardInstalled = true;

  syncSettings();
  window.addEventListener("paste", onPaste, true);
}

install();
