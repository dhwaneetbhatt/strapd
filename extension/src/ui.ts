import type { Finding, WarningAction } from "./types";

export interface WarningOptions {
  findings: Finding[];
  scrubbedText: string;
}

export interface WarningHandle {
  result: Promise<WarningAction>;
  dismiss: () => void;
}

const MAX_PREVIEW_LENGTH = 4000;

let activeHandle: WarningHandle | null = null;

export function showWarning(options: WarningOptions): WarningHandle {
  activeHandle?.dismiss();

  const host = document.createElement("div");
  host.dataset.strapdWarning = "true";
  Object.assign(host.style, {
    position: "fixed",
    left: "50%",
    bottom: "24px",
    transform: "translateX(-50%)",
    width: "min(560px, calc(100vw - 32px))",
    zIndex: "2147483647",
  });

  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = CARD_STYLES;
  shadow.append(style);

  const card = document.createElement("section");
  card.className = "card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-labelledby", "strapd-warning-title");

  const header = document.createElement("header");
  const brand = document.createElement("span");
  brand.className = "brand";
  brand.textContent = "strapd";
  const title = document.createElement("h2");
  title.id = "strapd-warning-title";
  title.textContent = buildSummary(options.findings);
  const subtitle = document.createElement("p");
  subtitle.className = "subtitle";
  subtitle.textContent =
    "Sensitive data detected. Review before pasting. Nothing leaves this browser.";
  header.append(brand, title, subtitle);

  const details = document.createElement("details");
  const previewSummary = document.createElement("summary");
  previewSummary.textContent = "Preview scrubbed text";
  const preview = document.createElement("pre");
  preview.textContent = truncate(options.scrubbedText);
  details.append(previewSummary, preview);

  const actions = document.createElement("div");
  actions.className = "actions";
  const scrubbedButton = actionButton("Paste scrubbed", "Enter", "primary");
  const rawButton = actionButton("Paste raw", "Shift+Enter", "secondary");
  const cancelButton = actionButton("Cancel", "Esc", "ghost");
  actions.append(scrubbedButton, rawButton, cancelButton);

  const footer = document.createElement("p");
  footer.className = "footer";
  footer.textContent = "Paste raw inserts the original text unchanged.";

  card.append(header, details, actions, footer);
  shadow.append(card);
  document.documentElement.append(host);

  let settled = false;
  let handle: WarningHandle;
  let resolveResult: (action: WarningAction) => void = () => undefined;
  const result = new Promise<WarningAction>((resolve) => {
    resolveResult = resolve;
  });

  function finish(action: WarningAction): void {
    if (settled) {
      return;
    }

    settled = true;
    window.removeEventListener("keydown", onKeyDown, true);
    host.remove();
    if (activeHandle === handle) {
      activeHandle = null;
    }
    resolveResult(action);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      finish("cancel");
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    const focused = shadow.activeElement;

    if (focused === previewSummary) {
      event.preventDefault();
      event.stopImmediatePropagation();
      details.open = !details.open;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (focused === rawButton) {
      finish("raw");
    } else if (focused === cancelButton) {
      finish("cancel");
    } else {
      finish(event.shiftKey ? "raw" : "scrubbed");
    }
  }

  scrubbedButton.addEventListener("click", () => finish("scrubbed"));
  rawButton.addEventListener("click", () => finish("raw"));
  cancelButton.addEventListener("click", () => finish("cancel"));
  window.addEventListener("keydown", onKeyDown, true);

  handle = { result, dismiss: () => finish("cancel") };
  activeHandle = handle;
  scrubbedButton.focus({ preventScroll: true });

  return handle;
}

function actionButton(label: string, shortcut: string, variant: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `action ${variant}`;

  const text = document.createElement("span");
  text.textContent = label;
  const key = document.createElement("kbd");
  key.textContent = shortcut;
  button.append(text, key);

  return button;
}

function buildSummary(findings: Finding[]): string {
  const total = findings.reduce((sum, finding) => sum + finding.count, 0);
  if (total === 0) {
    return "strapd found sensitive data";
  }

  const kinds = findings
    .map((finding) =>
      finding.count > 1 ? `${finding.kind} ×${finding.count}` : finding.kind,
    )
    .join(", ");

  return `strapd caught ${total} ${total === 1 ? "item" : "items"} (${kinds})`;
}

function truncate(text: string): string {
  if (text.length <= MAX_PREVIEW_LENGTH) {
    return text;
  }

  return `${text.slice(0, MAX_PREVIEW_LENGTH)}\n… (preview truncated)`;
}

const CARD_STYLES = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.card {
  --bg: #16181d;
  --panel: #1f232b;
  --fg: #f4f7fb;
  --muted: #a9b3c2;
  --border: #353c49;
  --accent: #8ab4ff;
  --accent-ink: #0a1220;
  color-scheme: dark;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg);
  color: var(--fg);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
@media (prefers-color-scheme: light) {
  .card {
    --bg: #ffffff;
    --panel: #f5f7fb;
    --fg: #111827;
    --muted: #5b6474;
    --border: #d7dde8;
    --accent: #1f5eff;
    --accent-ink: #ffffff;
    color-scheme: light;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
  }
}
header { display: grid; gap: 4px; }
.brand {
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.35;
}
.subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}
details {
  margin: 12px 0;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--panel);
}
summary {
  cursor: pointer;
  color: var(--fg);
  font-size: 12px;
  font-weight: 600;
}
pre {
  max-height: 180px;
  margin: 8px 0 0;
  padding: 8px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--panel);
  color: var(--fg);
  font: inherit;
  cursor: pointer;
}
button:hover { filter: brightness(1.08); }
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 650;
}
button.ghost { color: var(--muted); }
kbd {
  padding: 3px 5px;
  border: 1px solid currentColor;
  border-radius: 5px;
  font: 11px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  opacity: 0.75;
}
.footer {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 11px;
}
`;
