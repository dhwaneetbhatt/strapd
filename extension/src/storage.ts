import type {
  ActivePasteMode,
  DetectorSettings,
  ExtensionSettings,
  PasteMode,
} from "./types";

export const SETTINGS_KEY = "settings";
export const LEGACY_ENABLED_KEY = "enabled";
export const BLOCKED_COUNT_KEY = "blockedCount";
export const PAUSED_FROM_KEY = "pausedFrom";
export const PAUSE_DURATION_MS = 15 * 60 * 1000;

export const DEFAULT_DETECTORS: DetectorSettings = {
  apiKey: true,
  jwt: true,
  email: true,
  ip: true,
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  mode: "ask",
  pauseUntil: null,
  detectors: DEFAULT_DETECTORS,
  customSites: [],
};

export function normalizeDetectors(value: unknown): DetectorSettings {
  const record = isRecord(value) ? value : {};
  return {
    apiKey: record.apiKey !== false,
    jwt: record.jwt !== false,
    email: record.email !== false,
    ip: record.ip !== false,
  };
}

export function normalizeSettings(
  value: unknown,
  now = Date.now(),
  preserveExpiredPause = false,
): ExtensionSettings {
  const record = isRecord(value) ? value : {};
  const detectors = normalizeDetectors(record.detectors);
  const customSites = normalizeSites(record.customSites);
  const pauseUntil =
    typeof record.pauseUntil === "number" && Number.isFinite(record.pauseUntil)
      ? record.pauseUntil
      : null;

  if (isActiveMode(record.mode)) {
    if (
      record.mode === "paused" &&
      isPauseExpired(pauseUntil, now) &&
      !preserveExpiredPause
    ) {
      return { mode: "ask", pauseUntil: null, detectors, customSites };
    }
    return { mode: record.mode, pauseUntil, detectors, customSites };
  }

  if (record[LEGACY_ENABLED_KEY] === false) {
    return {
      mode: "paused",
      pauseUntil: now + PAUSE_DURATION_MS,
      detectors,
      customSites,
    };
  }

  return { ...DEFAULT_SETTINGS, detectors, customSites };
}

export function isPauseExpired(pauseUntil: number | null, now = Date.now()): boolean {
  return pauseUntil === null || pauseUntil <= now;
}

export function resumeFromPause(
  settings: ExtensionSettings,
  pausedFrom: unknown,
  now = Date.now(),
): ExtensionSettings {
  if (settings.mode !== "paused" || !isPauseExpired(settings.pauseUntil, now)) {
    return settings;
  }

  const mode: ActivePasteMode = pausedFrom === "auto" ? "auto" : "ask";
  return { ...settings, mode, pauseUntil: null };
}

export function startPause(settings: ExtensionSettings, now = Date.now()): ExtensionSettings {
  return { ...settings, mode: "paused", pauseUntil: now + PAUSE_DURATION_MS };
}

function normalizeSites(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sites = new Set<string>();
  for (const site of value) {
    if (typeof site === "string" && /^https?:\/\/[^/]+\/\*$/.test(site)) {
      sites.add(site);
    }
  }
  return [...sites];
}

function isActiveMode(value: unknown): value is PasteMode {
  return value === "ask" || value === "auto" || value === "paused";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
