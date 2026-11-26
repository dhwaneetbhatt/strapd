import { beforeEach, describe, expect, it } from "vitest";
import { captureSelection, findEditableTarget, insertText } from "../src/insert";

describe("insertText", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.getSelection()?.removeAllRanges();
  });

  it("replaces the selected textarea range and restores the caret", () => {
    document.body.innerHTML = "<textarea></textarea>";
    const textarea = document.querySelector("textarea");
    if (!textarea) {
      throw new Error("textarea missing");
    }

    textarea.value = "hello world";
    textarea.focus();
    textarea.setSelectionRange(6, 11);

    const events: InputEvent[] = [];
    textarea.addEventListener("input", (event) => {
      events.push(event as InputEvent);
    });

    insertText(textarea, "there");

    expect(textarea.value).toBe("hello there");
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);
    expect(events).toHaveLength(1);
    expect(events[0].inputType).toBe("insertFromPaste");
    expect(events[0].data).toBe("there");
  });

  it("uses a captured selection after focus moves elsewhere", () => {
    document.body.innerHTML = "<textarea></textarea><input />";
    const textarea = document.querySelector("textarea");
    const input = document.querySelector("input");
    if (!textarea || !input) {
      throw new Error("test controls missing");
    }

    textarea.value = "abcdef";
    textarea.setSelectionRange(2, 4);
    input.focus();

    insertText(textarea, "X", { start: 2, end: 4 });

    expect(textarea.value).toBe("abXef");
    expect(textarea.selectionStart).toBe(3);
    expect(textarea.selectionEnd).toBe(3);
  });

  it("inserts at the end when the control has no captured selection", () => {
    document.body.innerHTML = "<textarea>abc</textarea>";
    const textarea = document.querySelector("textarea");
    if (!textarea) {
      throw new Error("textarea missing");
    }

    textarea.focus();
    textarea.setSelectionRange(3, 3);

    insertText(textarea, "d");

    expect(textarea.value).toBe("abcd");
    expect(textarea.selectionStart).toBe(4);
  });

  it("honors maxlength when inserting into a text control", () => {
    document.body.innerHTML = '<textarea maxlength="3"></textarea>';
    const textarea = document.querySelector("textarea");
    if (!textarea) {
      throw new Error("textarea missing");
    }

    insertText(textarea, "abcdef");

    expect(textarea.value).toBe("abc");
    expect(textarea.selectionStart).toBe(3);
    expect(textarea.selectionEnd).toBe(3);
  });

  it("inserts into a contenteditable editor with a range fallback", () => {
    document.body.innerHTML = '<div contenteditable="true">hello</div>';
    const editable = document.querySelector("div");
    if (!editable) {
      throw new Error("editable missing");
    }

    editable.focus();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    const selection = window.getSelection();
    if (!selection) {
      throw new Error("selection unavailable");
    }
    selection.removeAllRanges();
    selection.addRange(range);

    insertText(editable, " world");

    expect(editable.textContent).toBe("hello world");
  });

  it("inserts into the target even when another control owns focus", () => {
    document.body.innerHTML = "<textarea></textarea><textarea></textarea>";
    const [target, other] = Array.from(document.querySelectorAll("textarea"));
    if (!target || !other) {
      throw new Error("test controls missing");
    }

    other.focus();
    insertText(target, "X");

    expect(target.value).toBe("X");
    expect(other.value).toBe("");
  });

  it("ignores a selection outside a shadow-root editor", () => {
    document.body.innerHTML = `
      <div id="host"></div>
      <div id="outside" contenteditable="true">outside</div>
    `;
    const host = document.querySelector<HTMLElement>("#host");
    const outside = document.querySelector<HTMLElement>("#outside");
    if (!host || !outside) {
      throw new Error("test controls missing");
    }

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<div contenteditable="true">hello</div>';
    const editable = shadow.querySelector<HTMLElement>('[contenteditable="true"]');
    if (!editable) {
      throw new Error("shadow editor missing");
    }

    const range = document.createRange();
    range.selectNodeContents(outside);
    range.collapse(false);
    const selection = window.getSelection();
    if (!selection) {
      throw new Error("selection unavailable");
    }
    selection.removeAllRanges();
    selection.addRange(range);

    expect(captureSelection(editable)).toBeNull();

    insertText(editable, " world");

    expect(editable.textContent).toBe("hello world");
    expect(outside.textContent).toBe("outside");
  });

  it("restores a captured contenteditable caret after focus moves", () => {
    document.body.innerHTML = '<div contenteditable="true">hello</div><input />';
    const editable = document.querySelector("div");
    const input = document.querySelector("input");
    const textNode = editable?.firstChild;
    if (!editable || !input || !textNode) {
      throw new Error("test controls missing");
    }

    const range = document.createRange();
    range.setStart(textNode, 2);
    range.collapse(true);
    const selection = window.getSelection();
    if (!selection) {
      throw new Error("selection unavailable");
    }
    selection.removeAllRanges();
    selection.addRange(range);

    const snapshot = captureSelection(editable);
    input.focus();
    insertText(editable, "X", snapshot);

    expect(editable.textContent).toBe("heXllo");
  });
});

describe("findEditableTarget", () => {
  it("finds the contenteditable root for a nested element", () => {
    document.body.innerHTML =
      '<div contenteditable="true"><span id="child">text</span></div>';
    const child = document.querySelector("#child");

    expect(findEditableTarget(child)).toBe(document.querySelector("div"));
  });

  it("rejects non-text inputs", () => {
    document.body.innerHTML = '<input type="checkbox" />';

    expect(findEditableTarget(document.querySelector("input"))).toBeNull();
  });

  it("rejects read-only text controls", () => {
    document.body.innerHTML = '<textarea readonly></textarea>';

    expect(findEditableTarget(document.querySelector("textarea"))).toBeNull();
  });

  it("rejects a nested non-editable island", () => {
    document.body.innerHTML =
      '<div contenteditable="true"><span id="child" contenteditable="false">text</span></div>';

    expect(findEditableTarget(document.querySelector("#child"))).toBeNull();
  });
});
