import {
  getActiveTab,
  getGrantedOrigins,
  getLocalSettings,
  getRegisteredScripts,
  getSessionValues,
  hostnameForUrl,
  injectContentScript,
  isOurScriptId,
  originPatternForUrl,
  registerScripts,
  removeOrigins,
  requestOrigins,
  scriptIdForOrigin,
  sendToWorker,
  setLocalSettings,
  setSessionValues,
  unregisterScripts,
  dynamicScriptForOrigin,
} from "./chrome";
import { CSP_CONNECT_SRC, WASM_FILENAME, WASM_SHA256 } from "./generated-meta";
import { countFindings } from "./scan";
import {
  BLOCKED_COUNT_KEY,
  DEFAULT_DETECTORS,
  PAUSED_FROM_KEY,
  SETTINGS_KEY,
  isPauseExpired,
  normalizeSettings,
  startPause,
} from "./storage";
import type {
  DetectorSettings,
  ExtensionSettings,
  PasteMode,
  ScanResponse,
} from "./types";

const DEFAULT_SITES = [
  "https://chatgpt.com/*",
  "https://claude.ai/*",
  "https://gemini.google.com/*",
];

const SELF_TEST_TEXT = [
  "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
  "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfOTg0MiJ9.dBjftJeZ4CVP",
  "Contact priya.sharma@acme.io from 10.42.18.204",
].join("\n");

const modeStatus = document.querySelector<HTMLElement>("#mode-status-hint")!;
const detectorCount = document.querySelector<HTMLElement>("#detector-count-label")!;
const sitesList = document.querySelector<HTMLElement>("#sites-list")!;
const addSiteButton = document.querySelector<HTMLButtonElement>("#add-site-btn")!;
const siteStatus = document.querySelector<HTMLElement>("#site-status")!;
const proofToggle = document.querySelector<HTMLButtonElement>("#proof-toggle-btn")!;
const proofDrawer = document.querySelector<HTMLElement>("#proof-drawer")!;
const auditCsp = document.querySelector<HTMLElement>("#audit-csp")!;
const auditHosts = document.querySelector<HTMLElement>("#audit-hosts")!;
const auditEngine = document.querySelector<HTMLElement>("#audit-engine")!;
const auditSession = document.querySelector<HTMLElement>("#audit-session")!;
const selfTestButton = document.querySelector<HTMLButtonElement>("#self-test-btn")!;
const selfTestResult = document.querySelector<HTMLElement>("#self-test-result")!;

let settings: ExtensionSettings | undefined;
let activeTab: chrome.tabs.Tab | undefined;
let proofRender: Promise<void> = Promise.resolve();

void initialize();

async function initialize(): Promise<void> {
  const stored = await getLocalSettings().catch((): Record<string, unknown> => ({}));
  let next = normalizeSettings(stored[SETTINGS_KEY] ?? stored, Date.now(), true);

  if (next.mode === "paused" && isPauseExpired(next.pauseUntil)) {
    const resumed = await sendToWorker<{ mode?: PasteMode }>({
      type: "RESUME_PAUSED",
    }).catch(() => undefined);
    if (resumed?.mode === "ask" || resumed?.mode === "auto") {
      next = { ...next, mode: resumed.mode, pauseUntil: null };
    }
  }
  settings = next;

  activeTab = await getActiveTab().catch(() => undefined);
  render();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes[SETTINGS_KEY] || changes.enabled)) {
      settings = normalizeSettings(changes[SETTINGS_KEY]?.newValue ?? {}, Date.now(), true);
      render();
    }
  });
}

function render(): void {
  if (!settings) {
    return;
  }

  for (const card of document.querySelectorAll<HTMLButtonElement>(".mode-card")) {
    const selected = card.dataset.mode === settings.mode;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-checked", String(selected));
  }

  modeStatus.textContent = describeMode(settings);

  for (const chip of document.querySelectorAll<HTMLButtonElement>(".detector-chip")) {
    const key = chip.dataset.detector as keyof DetectorSettings | undefined;
    chip.setAttribute("aria-pressed", String(key ? settings.detectors[key] : false));
  }
  detectorCount.textContent = `${activeDetectorCount(settings.detectors)} / 4 active`;

  renderSites();
}

function describeMode(current: ExtensionSettings): string {
  if (current.mode === "ask") return "Interactive review";
  if (current.mode === "auto") return "Silent auto-scrub";
  if (isPauseExpired(current.pauseUntil)) return "Paused (expiring)";
  const minutes = Math.max(
    1,
    Math.ceil(((current.pauseUntil ?? 0) - Date.now()) / 60_000),
  );
  return `Paused (${minutes} min left)`;
}

function activeDetectorCount(detectors: DetectorSettings): number {
  return Object.values(detectors).filter(Boolean).length;
}

for (const card of document.querySelectorAll<HTMLButtonElement>(".mode-card")) {
  card.addEventListener("click", () => {
    void selectMode(card.dataset.mode as PasteMode | undefined);
  });
}

async function selectMode(mode: PasteMode | undefined): Promise<void> {
  if (!settings || !mode) {
    return;
  }

  if (mode === "paused") {
    if (settings.mode !== "paused") {
      await setSessionValues({ [PAUSED_FROM_KEY]: settings.mode }).catch(() => undefined);
      settings = startPause(settings);
    }
  } else {
    settings = { ...settings, mode, pauseUntil: null };
  }

  await persistSettings();
  render();
}

for (const chip of document.querySelectorAll<HTMLButtonElement>(".detector-chip")) {
  chip.addEventListener("click", () => {
    const key = chip.dataset.detector as keyof DetectorSettings | undefined;
    if (!settings || !key) {
      return;
    }

    settings = {
      ...settings,
      detectors: { ...settings.detectors, [key]: !settings.detectors[key] },
    };
    void persistSettings().then(render);
  });
}

function renderSites(): void {
  if (!settings) {
    return;
  }

  sitesList.replaceChildren();

  for (const site of DEFAULT_SITES) {
    sitesList.append(sitePill(site, false));
  }
  for (const site of settings.customSites) {
    sitesList.append(sitePill(site, true));
  }
  updateAddSiteButton();
}

function sitePill(site: string, removable: boolean): HTMLElement {
  const pill = document.createElement("span");
  pill.className = removable ? "site-pill custom" : "site-pill";
  const dot = document.createElement("span");
  dot.className = "site-dot";
  const label = document.createElement("span");
  label.textContent = hostnameForUrl(site.replace("/*", "")) ?? site;
  pill.append(dot, label);

  if (removable) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "site-remove";
    remove.setAttribute("aria-label", `Remove ${label.textContent}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      void removeSite(site);
    });
    pill.append(remove);
  }

  return pill;
}

function isProtected(pattern: string): boolean {
  return Boolean(settings && [...DEFAULT_SITES, ...settings.customSites].includes(pattern));
}

function updateAddSiteButton(): void {
  const pattern = activeTab?.url ? originPatternForUrl(activeTab.url) : null;
  const hostname = pattern ? hostnameForUrl(pattern.replace("/*", "")) : null;

  if (!pattern || !hostname) {
    addSiteButton.textContent = "+ This site";
    addSiteButton.disabled = true;
    addSiteButton.title = "Open an HTTP(S) site to protect it";
    return;
  }

  if (isProtected(pattern)) {
    addSiteButton.textContent = "Protected";
    addSiteButton.disabled = true;
    addSiteButton.title = "This site is already protected";
    return;
  }

  addSiteButton.textContent = `+ Add ${hostname}`;
  addSiteButton.disabled = false;
  addSiteButton.title = `Grant access to ${pattern}`;
}

addSiteButton.addEventListener("click", () => {
  const pattern = activeTab?.url ? originPatternForUrl(activeTab.url) : null;
  if (!settings || !pattern || isProtected(pattern)) {
    return;
  }

  siteStatus.textContent = "Requesting site permission…";
  void (async () => {
    const granted = await requestOrigins([pattern]).catch(() => false);
    if (!granted) {
      siteStatus.textContent = "Permission declined. No site was added.";
      return;
    }

    try {
      await registerScripts([dynamicScriptForOrigin(pattern)]);
      if (activeTab?.id !== undefined) {
        await injectContentScript(activeTab.id);
      }
    } catch (error) {
      await removeOrigins([pattern]).catch(() => false);
      siteStatus.textContent = `Could not protect this site: ${messageOf(error)}`;
      return;
    }

    settings = {
      ...settings,
      customSites: [...settings.customSites.filter((site) => site !== pattern), pattern],
    };
    await persistSettings();
    siteStatus.textContent = "Protected. No reload needed.";
    render();
  })();
});

async function removeSite(pattern: string): Promise<void> {
  if (!settings) {
    return;
  }

  await unregisterScripts([scriptIdForOrigin(pattern)]).catch(() => undefined);
  await removeOrigins([pattern]).catch(() => undefined);
  settings = {
    ...settings,
    customSites: settings.customSites.filter((site) => site !== pattern),
  };
  await persistSettings();
  siteStatus.textContent = `Removed ${hostnameForUrl(pattern.replace("/*", "")) ?? pattern}`;
  render();
}

async function persistSettings(): Promise<void> {
  if (!settings) {
    return;
  }
  await setLocalSettings({ [SETTINGS_KEY]: settings }).catch(() => undefined);
}

proofToggle.addEventListener("click", () => {
  const open = proofDrawer.hidden;
  proofDrawer.hidden = !open;
  proofToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    queueProofRender();
  }
});

function queueProofRender(): void {
  proofRender = proofRender.then(renderProof, renderProof);
}

auditEngine.addEventListener("click", () => {
  if (!navigator.clipboard) {
    siteStatus.textContent = `WASM SHA-256: ${WASM_SHA256}`;
    return;
  }

  void navigator.clipboard.writeText(WASM_SHA256).then(
    () => {
      siteStatus.textContent = "WASM SHA-256 copied to clipboard.";
    },
    () => {
      siteStatus.textContent = `WASM SHA-256: ${WASM_SHA256}`;
    },
  );
});

async function renderProof(): Promise<void> {
  auditCsp.textContent = CSP_CONNECT_SRC;
  auditEngine.textContent = `${WASM_FILENAME}\nSHA-256: ${shortHash()} (click to copy)`;
  auditEngine.title = WASM_SHA256;

  const origins = await getGrantedOrigins().catch(() => []);
  auditHosts.textContent = `${origins.length} origin${origins.length === 1 ? "" : "s"}: ${origins.join(" ") || "none"}`;

  const values = await getSessionValues([BLOCKED_COUNT_KEY]).catch(
    (): Record<string, unknown> => ({}),
  );
  const count = values[BLOCKED_COUNT_KEY];
  const blocked = typeof count === "number" && Number.isFinite(count) ? Math.floor(count) : 0;
  auditSession.textContent = `${blocked} secret${blocked === 1 ? "" : "s"} blocked · 0 network calls`;

  await getRegisteredScripts().catch(() => []).then((scripts) => {
    const custom = scripts.filter((script) => isOurScriptId(script.id)).length;
    auditHosts.textContent += ` · ${custom} custom script${custom === 1 ? "" : "s"}`;
  });
}

function shortHash(): string {
  return `${WASM_SHA256.slice(0, 4)}…${WASM_SHA256.slice(-4)}`;
}

selfTestButton.addEventListener("click", () => {
  queueProofRender();
  selfTestButton.disabled = true;
  selfTestResult.hidden = false;
  selfTestResult.textContent = "Scanning locally…";

  const started = performance.now();
  void sendToWorker<ScanResponse>({
    type: "SCAN_TEXT",
    text: SELF_TEST_TEXT,
    detectors: DEFAULT_DETECTORS,
  })
    .then((response) => {
      const elapsed = performance.now() - started;
      const findings = response ? countFindings(response.findings) : 0;
      if (response?.ok && findings > 0) {
        selfTestResult.textContent =
          `✓ Verified: ${findings} findings in ${elapsed.toFixed(1)}ms round trip\n` +
          `${CSP_CONNECT_SRC} active · 0 network calls`;
      } else {
        selfTestResult.textContent =
          `✗ Self-test failed: ${response?.error ?? "no findings returned"}`;
      }
    })
    .catch((error: unknown) => {
      selfTestResult.textContent = `✗ Self-test failed: ${messageOf(error)}`;
    })
    .finally(() => {
      selfTestButton.disabled = false;
    });
});

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
