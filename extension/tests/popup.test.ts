import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../src/storage";

const scanResponse = {
  ok: true,
  clean: false,
  findings: [
    { kind: "API key", count: 1 },
    { kind: "Token", count: 1 },
    { kind: "Email", count: 1 },
    { kind: "IP address", count: 1 },
  ],
  scrubbedText: "scrubbed",
  elapsedMs: 1.6,
};

beforeAll(async () => {
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
      sendMessage: (request: unknown, callback: (response: unknown) => void) => {
        if (
          typeof request === "object" &&
          request !== null &&
          "type" in request &&
          request.type === "SCAN_TEXT"
        ) {
          callback(scanResponse);
          return;
        }
        callback(undefined);
      },
    },
    storage: {
      local: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ settings: DEFAULT_SETTINGS });
        },
        set: (_items: Record<string, unknown>, callback?: () => void) => callback?.(),
      },
      session: {
        get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
          callback({ blockedCount: 3 });
        },
        set: (_items: Record<string, unknown>, callback?: () => void) => callback?.(),
      },
      onChanged: { addListener: () => undefined },
    },
    tabs: {
      query: (
        _query: unknown,
        callback: (tabs: Array<{ id: number; url: string }>) => void,
      ) => callback([{ id: 1, url: "https://chatgpt.com/" }]),
    },
    permissions: {
      getAll: (callback: (permissions: { origins: string[] }) => void) =>
        callback({ origins: ["https://chatgpt.com/*"] }),
    },
    scripting: {
      getRegisteredContentScripts: (_query: unknown, callback: (scripts: []) => void) =>
        callback([]),
    },
  };

  vi.resetModules();
  await import("../src/popup");
  await tick();
});

describe("popup identity copy", () => {
  it("uses the final manifest and popup wording", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "manifest.json"), "utf8"),
    ) as { description: string };
    const html = readFileSync(resolve(process.cwd(), "src/popup.html"), "utf8");
    const css = readFileSync(resolve(process.cwd(), "src/popup.css"), "utf8");

    expect(manifest.description).toBe(
      "Scrub secrets and PII before pasting. Zero network access.",
    );
    expect(html).toContain("<strong>strapd guard</strong>");
    expect(html).not.toContain("Local paste firewall");
    expect(html).not.toContain("LOCAL WASM");
    expect(html).toContain("<strong>0 bytes</strong> sent · Fully offline");
    expect(html).not.toContain("local WASM only");
    expect(css).not.toContain("wasm-pill");
    expect(css).not.toContain("wasm-pulse");
    expect(css).not.toContain(".brand-copy small");
  });
});

describe("popup proof drawer", () => {
  it("hides until toggled and stays hidden when toggled closed", () => {
    const toggle = document.querySelector<HTMLButtonElement>("#proof-toggle-btn")!;
    const drawer = document.querySelector<HTMLElement>("#proof-drawer")!;
    const css = readFileSync(resolve(process.cwd(), "src/popup.css"), "utf8");

    expect(css).toMatch(/\.proof-drawer\[hidden\]\s*\{\s*display:\s*none\s*;\s*\}/);
    expect(drawer.hidden).toBe(true);

    toggle.click();
    expect(drawer.hidden).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    toggle.click();
    expect(drawer.hidden).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    toggle.click();
  });

  it("populates the audit table when the self-test runs", async () => {
    document.querySelector<HTMLButtonElement>("#self-test-btn")!.click();

    await vi.waitFor(() => {
      expect(document.querySelector("#audit-csp")!.textContent).toBe("connect-src 'none'");
      expect(document.querySelector("#audit-hosts")!.textContent).toBe(
        "1 origin: https://chatgpt.com/* · 0 custom scripts",
      );
      expect(document.querySelector("#audit-engine")!.textContent).toContain(
        "strapd_wasm_bg.wasm",
      );
      expect(document.querySelector("#audit-session")!.textContent).toBe(
        "3 secrets blocked · 0 network calls",
      );
      expect(document.querySelector("#self-test-result")!.textContent).toContain(
        "✓ Verified: 4 findings",
      );
    });
  });
});

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
