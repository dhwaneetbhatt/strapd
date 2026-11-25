import { captureSelection, findEditableTarget, insertText } from "./insert";
import { showWarning } from "./ui";
import type { ScanRequest, ScanResponse, WarningAction } from "./types";

const SCAN_TIMEOUT_MS = 15_000;
const ENABLED_DEFAULTS = { enabled: true };

let enabled = true;
let requestSequence = 0;
let activeWarning: ReturnType<typeof showWarning> | null = null;

function onPaste(event: ClipboardEvent): void {
  if (!enabled) {
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

  activeWarning?.dismiss();
  activeWarning = null;

  const snapshot = captureSelection(target);
  const response = await scan(text);

  if (request !== requestSequence) {
    return;
  }

  if (!response.ok || response.clean) {
    insertText(target, text, snapshot);
    return;
  }

  let warning: ReturnType<typeof showWarning>;
  try {
    warning = showWarning({
      findings: response.findings,
      scrubbedText: response.scrubbedText,
    });
  } catch {
    insertText(target, text, snapshot);
    return;
  }
  activeWarning = warning;

  const action: WarningAction = await warning.result;

  if (activeWarning === warning) {
    activeWarning = null;
  }
  if (request !== requestSequence) {
    return;
  }
  if (action === "cancel") {
    target.focus({ preventScroll: true });
    return;
  }

  insertText(target, action === "scrubbed" ? response.scrubbedText : text, snapshot);
}

function scan(text: string): Promise<ScanResponse> {
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

    const request: ScanRequest = { type: "SCAN_TEXT", text };

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

function failOpen(text: string, error: string): ScanResponse {
  return {
    ok: false,
    clean: true,
    findings: [],
    scrubbedText: text,
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
    Array.isArray(response.findings)
  );
}

function syncEnabled(): void {
  chrome.storage.local.get(ENABLED_DEFAULTS, (result) => {
    enabled = result.enabled !== false;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.enabled) {
      enabled = changes.enabled.newValue !== false;
    }
  });
}

function install(): void {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    return;
  }

  const scope = window as typeof window & {
    __strapdPasteFirewallInstalled?: boolean;
  };

  if (scope.__strapdPasteFirewallInstalled) {
    return;
  }
  scope.__strapdPasteFirewallInstalled = true;

  syncEnabled();
  window.addEventListener("paste", onPaste, true);
}

install();
