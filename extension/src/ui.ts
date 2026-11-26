import { buildDiffSegments } from "./diff";
import { resolveKeyboardAction } from "./keyboard";
import type { Finding, WarningAction, WarningSelection } from "./types";

export interface OverlayOptions {
  findings: Finding[];
  originalText: string;
  scrubbedText: string;
}

interface DiffView {
  toggle: HTMLButtonElement;
  box: HTMLElement;
  render: () => void;
}

export interface WarningOptions extends OverlayOptions {}

export interface WarningHandle {
  result: Promise<WarningSelection>;
  dismiss: () => void;
}

const SHEET_WIDTH = 560;
const VIEWPORT_GAP = 12;
const MAX_SHEET_HEIGHT_VH = 46;

let activeWarning: WarningHandle | null = null;

export function showWarning(options: WarningOptions): WarningHandle {
  activeWarning?.dismiss();

  const host = createHost("strapd-warning");
  dockToBottom(host);

  const shadow = host.attachShadow({ mode: "closed" });
  shadow.append(styleElement(SURFACE_STYLES));

  const card = element("section", "card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-label", "strapd guard paste review");

  const header = element("header", "card-header");
  const brand = element("div", "brand");
  brand.append(shieldGlyph(), text("span", "strapd guard", "brand-name"));
  const close = iconButton("×", "Cancel paste");
  header.append(brand, close);

  const body = element("div", "card-body");
  const headline = element("div", "headline");
  headline.append(
    text("span", "Caught ", "headline-lead"),
    text(
      "strong",
      `${countFindings(options.findings)} ${countFindings(options.findings) === 1 ? "item" : "items"}`,
      "headline-count",
    ),
    text("span", " before paste", "headline-lead"),
  );
  headline.append(pills(options.findings));
  body.append(headline);

  const diff = buildDiff(options, "intercept");
  body.append(diff.toggle, diff.box);

  const actions = element("div", "actions");
  const pasteRedacted = actionButton("Paste redacted", "Enter", "primary");
  const pasteRaw = actionButton("Paste raw", "Shift+Enter", "secondary");
  const cancel = actionButton("Cancel", "Esc", "ghost");
  actions.append(pasteRedacted, pasteRaw, cancel);
  body.append(actions);

  const footer = element("footer", "card-footer");
  const alwaysAuto = document.createElement("input");
  alwaysAuto.type = "checkbox";
  alwaysAuto.id = "strapd-always-auto";
  const alwaysLabel = document.createElement("label");
  alwaysLabel.htmlFor = alwaysAuto.id;
  alwaysLabel.append(
    text("span", "Always auto-redact without asking", "checkbox-copy"),
  );
  footer.append(alwaysLabel, alwaysAuto, text("span", "0 bytes sent", "local-note"));

  card.append(header, body, footer);
  shadow.append(card);
  document.documentElement.append(host);

  let settled = false;
  let handle: WarningHandle;
  let resolveResult: (selection: WarningSelection) => void = () => undefined;
  const result = new Promise<WarningSelection>((resolve) => {
    resolveResult = resolve;
  });

  function finish(action: WarningAction): void {
    if (settled) {
      return;
    }
    settled = true;
    window.removeEventListener("keydown", onKeyDown, true);
    host.remove();
    if (activeWarning === handle) {
      activeWarning = null;
    }
    resolveResult({ action, alwaysAuto: alwaysAuto.checked && action === "scrubbed" });
  }

  function onKeyDown(event: KeyboardEvent): void {
    const action = resolveKeyboardAction(event, shadow.activeElement, {
      diffToggle: diff.toggle,
      alwaysAuto,
      pasteRaw,
      cancel,
      close,
    });
    if (action === "ignore") {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (action === "consume") {
      return;
    }
    if (action === "toggle-diff") {
      toggleDiff(diff);
      return;
    }

    finish(action);
  }

  diff.toggle.addEventListener("click", () => toggleDiff(diff));
  pasteRedacted.addEventListener("click", () => finish("scrubbed"));
  pasteRaw.addEventListener("click", () => finish("raw"));
  cancel.addEventListener("click", () => finish("cancel"));
  close.addEventListener("click", () => finish("cancel"));
  window.addEventListener("keydown", onKeyDown, true);

  handle = { result, dismiss: () => finish("cancel") };
  activeWarning = handle;
  pasteRedacted.focus({ preventScroll: true });

  return handle;
}

function createHost(datasetKey: string): HTMLElement {
  const host = document.createElement("div");
  host.setAttribute(`data-${datasetKey}`, "true");
  Object.assign(host.style, {
    position: "fixed",
    zIndex: "2147483647",
    maxWidth: "calc(100vw - 24px)",
  });
  return host;
}

function dockToBottom(host: HTMLElement): void {
  const width = Math.max(200, Math.min(SHEET_WIDTH, window.innerWidth - VIEWPORT_GAP * 2));
  host.style.width = `${width}px`;
  host.style.left = "50%";
  host.style.bottom = `${VIEWPORT_GAP}px`;
  host.style.transform = "translateX(-50%)";
  host.style.maxHeight = `${Math.max(180, window.innerHeight * MAX_SHEET_HEIGHT_VH / 100)}px`;
  host.style.overflowY = "auto";
}

function styleElement(css: string): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = css;
  return style;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function text<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  value: string,
  className = "",
): HTMLElementTagNameMap[K] {
  const node = element(tag, className);
  node.textContent = value;
  return node;
}

function iconButton(label: string, ariaLabel: string): HTMLButtonElement {
  const button = text("button", label, "icon-button");
  button.type = "button";
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function actionButton(
  label: string,
  shortcut: string,
  variant: string,
): HTMLButtonElement {
  const button = element("button", `action ${variant}`);
  button.type = "button";
  button.append(text("span", label, "action-label"), text("kbd", shortcut, "keycap"));
  return button;
}

function shieldGlyph(): HTMLElement {
  const glyph = element("span", "shield-glyph");
  glyph.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M12 2.5 4.5 5.75V11.5C4.5 16.45 7.68 20.98 12 22.25c4.32-1.27 7.5-5.8 7.5-10.75V5.75L12 2.5Z" stroke="currentColor" stroke-width="1.85" stroke-linejoin="round"/>
      <path d="m9.5 9.5 2.5 2.5-2.5 2.5m3.25 0h2.5" stroke="var(--emerald)" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  return glyph;
}

function pills(findings: Finding[]): HTMLElement {
  const container = element("div", "pills");
  for (const finding of findings) {
    container.append(
      text(
        "span",
        `${categoryLabel(finding.kind)} ×${finding.count}`,
        `pill ${pillTone(finding.kind)}`,
      ),
    );
  }
  return container;
}

function buildDiff(options: OverlayOptions, prefix: string): DiffView {
  const toggle = element("button", "diff-toggle");
  toggle.type = "button";
  toggle.append(text("span", "▸", "diff-caret"), text("span", "Show diff", "diff-label"));

  const box = element("div", "diff-box");
  box.id = `strapd-${prefix}-diff`;
  box.hidden = true;

  let rendered = false;
  return {
    toggle,
    box,
    render: () => {
      if (rendered) {
        return;
      }
      rendered = true;
      renderDiff(box, options.originalText, options.scrubbedText);
    },
  };
}

function toggleDiff(diff: DiffView): void {
  const open = diff.box.hidden;
  diff.box.hidden = !open;
  if (open) {
    diff.render();
  }
  diff.toggle.querySelector(".diff-caret")!.textContent = open ? "▾" : "▸";
  diff.toggle.querySelector(".diff-label")!.textContent = open ? "Hide diff" : "Show diff";
}

function renderDiff(container: HTMLElement, original: string, fallback: string): void {
  const segments = buildDiffSegments(original, fallback);
  if (segments.length === 0) {
    container.textContent = fallback;
    return;
  }

  let offset = 0;
  for (const segment of segments) {
    const start = Math.max(offset, Math.min(segment.start, original.length));
    const end = Math.max(start, Math.min(segment.end, original.length));
    if (start > offset) {
      container.append(document.createTextNode(original.slice(offset, start)));
    }
    container.append(text("del", segment.raw, "diff-raw"));
    container.append(text("ins", segment.tag, "diff-tag"));
    offset = end;
  }
  if (offset < original.length) {
    container.append(document.createTextNode(original.slice(offset)));
  }
}

function countFindings(findings: Finding[]): number {
  return findings.reduce((total, finding) => total + finding.count, 0);
}

function categoryLabel(kind: string): string {
  const labels: Record<string, string> = {
    "API key": "API Key",
    Secret: "Secret",
    "Authorization header": "Auth",
    Cookie: "Cookie",
    "Database URL": "Database",
    "Cryptographic key": "Crypto Key",
    Password: "Password",
    Token: "JWT",
    "Signed URL": "Signed URL",
    "IP address": "IP",
    Email: "Email",
    "Phone number": "Phone",
    "Payment card": "Card",
    Aadhaar: "Aadhaar",
    PAN: "PAN",
  };
  return labels[kind] ?? kind;
}

function pillTone(kind: string): string {
  if (kind === "API key" || kind === "Database URL") return "blue";
  if (kind === "Token" || kind === "Signed URL") return "violet";
  if (kind === "IP address") return "cyan";
  if (kind === "Authorization header" || kind === "Cookie" || kind === "Password") {
    return "amber";
  }
  return "emerald";
}

const SURFACE_STYLES = `
:host { all: initial; color-scheme: light; }
*, *::before, *::after { box-sizing: border-box; }
.card {
  --bg: #ffffff;
  --surface: #f1f3f7;
  --field: #ffffff;
  --border: #e2e5ec;
  --border-strong: #cdd3df;
  --fg: #0f172a;
  --secondary: #475569;
  --muted: #64748b;
  --blue: #2563eb;
  --emerald: #059669;
  --amber: #d97706;
  --violet: #7c3aed;
  --cyan: #0891b2;
  --shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.06);
  width: 100%;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: var(--bg);
  color: var(--fg);
  box-shadow: var(--shadow);
  font: 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  border-radius: 14px 14px 12px 12px;
  animation: slide-up 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-color-scheme: dark) {
  .card {
    --bg: #14161b;
    --surface: #1a1d24;
    --field: #0c0d10;
    --border: #262932;
    --border-strong: #363b47;
    --fg: #f1f5f9;
    --secondary: #94a3b8;
    --muted: #64748b;
    --blue: #3b82f6;
    --emerald: #10b981;
    --amber: #f59e0b;
    --violet: #a78bfa;
    --cyan: #22d3ee;
    --shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.07);
    color-scheme: dark;
  }
}
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 14px; border-bottom: 1px solid var(--border); background: var(--surface); }
.brand { display: flex; align-items: center; gap: 7px; min-width: 0; }
.shield-glyph { display: inline-flex; color: var(--secondary); }
.brand-name { font-size: 12px; font-weight: 650; letter-spacing: -0.01em; white-space: nowrap; }
.icon-button { flex: 0 0 auto; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--muted); font-size: 16px; line-height: 1; cursor: pointer; }
.icon-button:hover { background: var(--border); }
.card-body { display: grid; gap: 10px; padding: 12px 14px; }
.headline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.headline-lead { color: var(--secondary); }
.headline-count { color: var(--fg); font-size: 13px; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.pill { padding: 2px 7px; border: 1px solid currentColor; border-radius: 6px; font: 10px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; opacity: 0.95; }
.pill.blue { color: var(--blue); }
.pill.emerald { color: var(--emerald); }
.pill.amber { color: var(--amber); }
.pill.violet { color: var(--violet); }
.pill.cyan { color: var(--cyan); }
.diff-toggle { justify-self: start; display: inline-flex; gap: 6px; padding: 0; border: 0; background: none; color: var(--secondary); font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; cursor: pointer; }
.diff-caret { color: var(--muted); }
.diff-box { max-height: 120px; overflow: auto; padding: 9px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); font: 11px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
.diff-raw { color: var(--secondary); text-decoration: line-through; text-decoration-color: rgba(220, 38, 38, 0.75); }
.diff-tag { padding: 0 3px; border-radius: 4px; background: rgba(5, 150, 105, 0.14); color: var(--emerald); text-decoration: none; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
.action { display: inline-flex; align-items: center; gap: 8px; padding: 7px 11px; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--fg); font: inherit; font-weight: 600; cursor: pointer; }
.action.primary { border-color: var(--blue); background: var(--blue); color: #ffffff; }
.action.ghost { border-color: transparent; background: transparent; color: var(--secondary); }
.action:hover { filter: brightness(1.07); }
button:focus-visible, input:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
.keycap { padding: 2px 5px; border: 1px solid currentColor; border-radius: 4px; font: 10px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; opacity: 0.75; }
.card-footer { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-top: 1px solid var(--border); background: var(--surface); color: var(--secondary); font-size: 11px; }
.card-footer label { display: flex; align-items: center; gap: 7px; cursor: pointer; }
.card-footer input { accent-color: var(--emerald); cursor: pointer; }
.local-note { margin-left: auto; color: var(--muted); font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
`;
