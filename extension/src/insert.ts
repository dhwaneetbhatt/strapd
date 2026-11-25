export interface TextSelection {
  start: number;
  end: number;
}

export type TextControl = HTMLTextAreaElement | HTMLInputElement;

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
]);

export function findEditableTarget(element: Element | null): HTMLElement | null {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.disabled || element.readOnly ? null : element;
  }

  if (element instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(element.type.toLowerCase())) {
    return element.disabled || element.readOnly ? null : element;
  }

  return contentEditableRoot(element);
}

function contentEditableRoot(element: Element): HTMLElement | null {
  let current: Element | null = element;

  while (current) {
    const value = current.getAttribute("contenteditable");
    if (value !== null) {
      const normalized = value.toLowerCase();
      if (normalized === "false") {
        return null;
      }
      if (normalized === "true" || normalized === "" || normalized === "plaintext-only") {
        return current instanceof HTMLElement ? current : null;
      }
    }
    current = current.parentElement;
  }

  return null;
}

export type SelectionSnapshot = TextSelection | Range | null;

export function captureSelection(target: HTMLElement): SelectionSnapshot {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    return readSelection(target);
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!target.contains(range.startContainer) || !target.contains(range.endContainer)) {
    return null;
  }

  return range.cloneRange();
}

export function readSelection(target: HTMLElement): TextSelection | null {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start === null || end === null) {
      return null;
    }
    return { start, end };
  }

  return null;
}

export function insertText(
  target: HTMLElement,
  text: string,
  snapshot: SelectionSnapshot = null,
): void {
  if (!target.isConnected) {
    return;
  }

  target.focus({ preventScroll: true });

  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    insertIntoTextControl(target, text, snapshot instanceof Range ? null : snapshot);
    return;
  }

  insertIntoContentEditable(target, text, snapshot instanceof Range ? snapshot : null);
}

function insertIntoTextControl(
  target: TextControl,
  text: string,
  selection: TextSelection | null,
): void {
  const valueLength = target.value.length;
  const rawStart = selection?.start ?? target.selectionStart ?? valueLength;
  const rawEnd = selection?.end ?? target.selectionEnd ?? rawStart;
  const start = clamp(Math.min(rawStart, rawEnd), 0, valueLength);
  const end = clamp(Math.max(rawStart, rawEnd), start, valueLength);
  const nextValue = target.value.slice(0, start) + text + target.value.slice(end);

  setNativeValue(target, nextValue);

  const caret = start + text.length;
  try {
    target.setSelectionRange(caret, caret);
  } catch {
    // Some text-like inputs do not expose a selection range.
  }
  dispatchInput(target, text);
}

function insertIntoContentEditable(
  target: HTMLElement,
  text: string,
  capturedRange: Range | null,
): void {
  restoreSelection(target, capturedRange);

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const start = selection.getRangeAt(0).cloneRange();
  start.collapse(true);

  try {
    if (document.execCommand("insertText", false, text)) {
      return;
    }
  } catch {
    // Fall through to the Range path when the host blocks execCommand.
  }

  insertWithRange(target, text);
}

function restoreSelection(target: HTMLElement, capturedRange: Range | null): void {
  if (!capturedRange) {
    ensureSelectionInside(target);
    return;
  }

  if (
    !capturedRange.startContainer.isConnected ||
    !capturedRange.endContainer.isConnected ||
    !target.contains(capturedRange.startContainer) ||
    !target.contains(capturedRange.endContainer)
  ) {
    ensureSelectionInside(target);
    return;
  }

  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(capturedRange);
}

function ensureSelectionInside(target: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (target.contains(range.startContainer) && target.contains(range.endContainer)) {
      return;
    }
  }

  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertWithRange(target: HTMLElement, text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  dispatchInput(target, text);
}

function dispatchInput(target: HTMLElement, text: string): void {
  target.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertFromPaste",
      data: text,
    }),
  );
}

function setNativeValue(target: TextControl, value: string): void {
  const prototype =
    target instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (setter) {
    setter.call(target, value);
  } else {
    target.value = value;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
