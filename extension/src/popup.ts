const toggleElement = document.querySelector<HTMLInputElement>("#enabled");
const statusElement = document.querySelector<HTMLElement>("#status");
const descriptionElement = document.querySelector<HTMLElement>("#description");

if (!toggleElement || !statusElement || !descriptionElement) {
  throw new Error("Popup markup is incomplete");
}

const toggle = toggleElement;
const status = statusElement;
const description = descriptionElement;

function render(enabled: boolean): void {
  toggle.checked = enabled;
  status.textContent = enabled ? "Enabled" : "Paused";
  description.textContent = enabled
    ? "Pastes are scanned before insertion."
    : "Pastes go straight to the page.";
}

chrome.storage.local.get({ enabled: true }, (result) => {
  render(result.enabled !== false);
});

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  render(enabled);
  chrome.storage.local.set({ enabled });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.enabled) {
    render(changes.enabled.newValue !== false);
  }
});
