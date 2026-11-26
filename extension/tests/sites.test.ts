import { describe, expect, it } from "vitest";
import {
  dynamicScriptForOrigin,
  originPatternForUrl,
  scriptIdForOrigin,
} from "../src/chrome";
import { isDefaultSitePattern, isSiteProtected, matchesOriginPattern } from "../src/sites";
import { DEFAULT_SETTINGS } from "../src/storage";

describe("custom site patterns", () => {
  it("preserves an explicit port in the granted origin pattern", () => {
    expect(originPatternForUrl("http://localhost:3000/app")).toBe(
      "http://localhost:3000/*",
    );
    expect(
      matchesOriginPattern("http://localhost:3000/app", "http://localhost:3000/*"),
    ).toBe(true);
    expect(
      matchesOriginPattern("http://localhost:8080/app", "http://localhost:3000/*"),
    ).toBe(false);
    expect(
      matchesOriginPattern("http://localhost/app", "http://localhost/*"),
    ).toBe(true);
    expect(
      matchesOriginPattern("http://localhost:3000/app", "http://localhost/*"),
    ).toBe(true);
    expect(
      matchesOriginPattern("https://chatgpt.com:8443/app", "https://chatgpt.com/*"),
    ).toBe(true);
  });

  it("grants explicit ports for default-port URLs", () => {
    expect(originPatternForUrl("http://localhost/app")).toBe("http://localhost:80/*");
    expect(originPatternForUrl("https://chatgpt.com/app")).toBe("https://chatgpt.com:443/*");
  });

  it("keeps a legacy no-port script matching every port", () => {
    const script = dynamicScriptForOrigin("http://localhost/*");

    expect(script.matches).toEqual(["http://localhost/*"]);
    expect(matchesOriginPattern("http://localhost/app", script.matches[0])).toBe(true);
    expect(matchesOriginPattern("http://localhost:3000/app", script.matches[0])).toBe(true);
    expect(
      dynamicScriptForOrigin("http://localhost:3000/*").matches,
    ).toEqual(["http://localhost:3000/*"]);
  });

  it("recognizes default sites regardless of the generated port", () => {
    expect(isDefaultSitePattern("https://chatgpt.com/*")).toBe(true);
    expect(isDefaultSitePattern("https://chatgpt.com:443/*")).toBe(true);
    expect(isDefaultSitePattern("https://chatgpt.com:8443/*")).toBe(true);
    expect(isDefaultSitePattern("https://chatgpt.com.example.com/*")).toBe(false);
    expect(isDefaultSitePattern("http://chatgpt.com/*")).toBe(false);
  });

  it("gives distinct origins distinct script IDs", () => {
    expect(scriptIdForOrigin("https://team-dev.example.com/*")).not.toBe(
      scriptIdForOrigin("https://team.dev.example.com/*"),
    );
  });

  it("registers custom scripts before page scripts in all same-origin frames", () => {
    expect(dynamicScriptForOrigin("https://example.com/*")).toMatchObject({
      runAt: "document_start",
      allFrames: true,
      persistAcrossSessions: true,
    });
  });

  it("stops treating a removed custom site as protected", () => {
    const protectedSettings = {
      ...DEFAULT_SETTINGS,
      customSites: ["http://localhost:3000/*"],
    };

    expect(isSiteProtected(protectedSettings, "http://localhost:3000/app")).toBe(true);
    expect(
      isSiteProtected(
        { ...protectedSettings, customSites: [] },
        "http://localhost:3000/app",
      ),
    ).toBe(false);
  });
});
