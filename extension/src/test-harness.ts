import "./content";

const status = document.querySelector<HTMLElement>("#harness-status");
if (status) {
  status.textContent = "Interceptor installed. Paste into either field below.";
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  button.addEventListener("click", async () => {
    const targetId = button.dataset.copy;
    const target = targetId
      ? document.querySelector<HTMLTextAreaElement>(`#${targetId}`)
      : null;
    if (!target) {
      return;
    }

    const originalLabel = button.textContent;

    try {
      await navigator.clipboard.writeText(target.value);
      button.textContent = "Copied";
    } catch {
      target.select();
      button.textContent = "Select + copy";
    }

    setTimeout(() => {
      button.textContent = originalLabel;
    }, 1500);
  });
}
