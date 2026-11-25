import init, {
  detect_pii,
  sanitize_pii,
  sanitize_secrets,
} from "../wasm/strapd_wasm.js";
import { scanText, type WasmScanner } from "./scan";
import type { ScanRequest, ScanResponse } from "./types";

let enginePromise: Promise<WasmScanner> | null = null;

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

async function handleScan(text: string): Promise<ScanResponse> {
  try {
    const engine = await getWasmEngine();
    return scanText(engine, text);
  } catch (error) {
    enginePromise = null;
    return {
      ok: false,
      clean: true,
      findings: [],
      scrubbedText: text,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isScanRequest(value: unknown): value is ScanRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const request = value as Partial<ScanRequest>;
  return request.type === "SCAN_TEXT" && typeof request.text === "string";
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isScanRequest(message)) {
    return false;
  }

  void handleScan(message.text).then((response) => {
    try {
      sendResponse(response);
    } catch {
      // The content script may have navigated away before the scan finished.
    }
  });
  return true;
});
