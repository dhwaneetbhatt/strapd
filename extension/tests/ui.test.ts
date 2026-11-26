import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { showWarning } from "../src/ui";

const originalAttachShadow = Element.prototype.attachShadow;

beforeAll(() => {
  Element.prototype.attachShadow = function (_init: ShadowRootInit): ShadowRoot {
    return originalAttachShadow.call(this, { mode: "open" }) as ShadowRoot;
  };
});

afterAll(() => {
  Element.prototype.attachShadow = originalAttachShadow;
});

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("review card placement", () => {
  it("docks the card at the bottom center of the viewport", () => {
    const handle = showWarning({
      findings: [{ kind: "Email", count: 1 }],
      originalText: "Contact dev@example.com",
      scrubbedText: "Contact [REDACTED_EMAIL]",
    });
    const host = document.querySelector<HTMLElement>("[data-strapd-warning]");

    expect(host).not.toBeNull();
    expect(host!.style.left).toBe("50%");
    expect(host!.style.bottom).toBe("12px");
    expect(host!.style.transform).toBe("translateX(-50%)");
    expect(Number.parseFloat(host!.style.maxHeight)).toBeLessThanOrEqual(
      window.innerHeight * 0.46,
    );
    expect(root()?.querySelector(".diff-box")).not.toBeNull();

    handle.dismiss();
  });

  it("expands and collapses the diff without inserting text", () => {
    const handle = showWarning({
      findings: [{ kind: "Email", count: 1 }],
      originalText: "Contact dev@example.com",
      scrubbedText: "Contact [REDACTED_EMAIL]",
    });
    const box = root()?.querySelector<HTMLElement>(".diff-box");
    const toggle = root()?.querySelector<HTMLButtonElement>(".diff-toggle");

    expect(box?.hidden).toBe(true);
    expect(box?.textContent).toBe("");

    toggle?.click();

    expect(box?.hidden).toBe(false);
    expect(box?.querySelector("del")?.textContent).toBe("dev@example.com");
    expect(box?.querySelector("ins")?.textContent).toBe("[REDACTED_EMAIL]");
    expect(root()?.querySelector(".diff-label")?.textContent).toBe("Hide diff");

    toggle?.click();

    expect(box?.hidden).toBe(true);
    expect(root()?.querySelector(".diff-label")?.textContent).toBe("Show diff");

    handle.dismiss();
  });
});

function root(): ShadowRoot | null {
  return document.querySelector<HTMLElement>("[data-strapd-warning]")?.shadowRoot ?? null;
}
