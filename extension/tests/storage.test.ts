import { describe, expect, it } from "vitest";
import {
  DEFAULT_DETECTORS,
  PAUSE_DURATION_MS,
  isPauseExpired,
  normalizeSettings,
  resumeFromPause,
  startPause,
} from "../src/storage";

const now = 1_800_000_000_000;

describe("normalizeSettings", () => {
  it("defaults to ask mode with all detectors enabled", () => {
    expect(normalizeSettings(undefined, now)).toEqual({
      mode: "ask",
      pauseUntil: null,
      detectors: DEFAULT_DETECTORS,
      customSites: [],
    });
  });

  it("migrates a legacy disabled flag to a timed pause", () => {
    expect(normalizeSettings({ enabled: false }, now)).toEqual({
      mode: "paused",
      pauseUntil: now + PAUSE_DURATION_MS,
      detectors: DEFAULT_DETECTORS,
      customSites: [],
    });
  });

  it("drops an already-expired pause during normalization", () => {
    expect(
      normalizeSettings({ mode: "paused", pauseUntil: now - 1, detectors: { jwt: false } }, now),
    ).toEqual({
      mode: "ask",
      pauseUntil: null,
      detectors: { ...DEFAULT_DETECTORS, jwt: false },
      customSites: [],
    });
  });

  it("keeps valid custom sites and discards malformed patterns", () => {
    const settings = normalizeSettings(
      { customSites: ["https://example.com/*", "ftp://bad/*"] },
      now,
    );

    expect(settings.customSites).toEqual(["https://example.com/*"]);
  });
});

describe("pause lifecycle", () => {
  it("starts a 15-minute pause", () => {
    expect(startPause(normalizeSettings(undefined, now), now).pauseUntil).toBe(
      now + PAUSE_DURATION_MS,
    );
  });

  it("resumes the prior mode after expiry", () => {
    const paused = {
      ...normalizeSettings(undefined, now),
      ...startPause(normalizeSettings(undefined, now), now),
    };

    expect(resumeFromPause(paused, "auto", now + PAUSE_DURATION_MS + 1).mode).toBe("auto");
    expect(resumeFromPause(paused, "unknown", now + PAUSE_DURATION_MS + 1).mode).toBe("ask");
  });

  it("does not resume an active pause", () => {
    const paused = startPause(normalizeSettings(undefined, now), now);

    expect(resumeFromPause(paused, "auto", now + 1000).mode).toBe("paused");
    expect(isPauseExpired(paused.pauseUntil, now + 1000)).toBe(false);
  });
});
