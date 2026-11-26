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

export function isNonEditableBoundary(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.disabled || element.readOnly;
  }
  if (element instanceof HTMLInputElement) {
    return (
      element.disabled ||
      element.readOnly ||
      !TEXT_INPUT_TYPES.has(element.type.toLowerCase())
    );
  }

  return element.getAttribute("contenteditable")?.toLowerCase() === "false";
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

type SelectionWithComposedRanges = Selection & {
  getComposedRanges?: (...shadowRoots: ShadowRoot[]) => StaticRange[];
};

function targetSelection(target: HTMLElement): Selection | null {
  const root = target.getRootNode();
  if (root instanceof Document || root instanceof ShadowRoot) {
    const rootWithSelection = root as Document & {
      getSelection?: () => Selection | null;
    };
    const selection = rootWithSelection.getSelection?.() ?? null;
    if (selection) {
      return selection;
    }
  }
  return window.getSelection();
}

function inShadowRoot(target: HTMLElement): boolean {
  return target.getRootNode() instanceof ShadowRoot;
}

function ownsFocus(target: HTMLElement): boolean {
  const root = target.getRootNode();
  if (root instanceof ShadowRoot) {
    return root.activeElement === target;
  }
  return document.activeElement === target;
}

function focusTarget(target: HTMLElement): void {
  target.focus({ preventScroll: true });
  if (!ownsFocus(target) && typeof (target as { focus?: () => void }).focus === "function") {
    (target as { focus: () => void }).focus();
  }
}

function rangeInsideTarget(target: HTMLElement, range: Range): boolean {
  return target.contains(range.startContainer) && target.contains(range.endContainer);
}

function composedRangeForTarget(target: HTMLElement, selection: Selection): Range | null {
  const getComposedRanges = (selection as SelectionWithComposedRanges).getComposedRanges;
  if (typeof getComposedRanges !== "function") {
    return null;
  }

  const root = target.getRootNode();
  const staticRange = getComposedRanges.call(
    selection,
    ...(root instanceof ShadowRoot ? [root] : []),
  )[0];
  if (!staticRange) {
    return null;
  }

  try {
    const range = document.createRange();
    range.setStart(staticRange.startContainer, staticRange.startOffset);
    range.setEnd(staticRange.endContainer, staticRange.endOffset);
    return rangeInsideTarget(target, range) ? range : null;
  } catch {
    return null;
  }
}

function captureRange(target: HTMLElement): Range | null {
  const selection = targetSelection(target);
  if (!selection) {
    return null;
  }

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (rangeInsideTarget(target, range)) {
      return range.cloneRange();
    }
  }

  return composedRangeForTarget(target, selection);
}

export function captureSelection(target: HTMLElement): SelectionSnapshot {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    return readSelection(target);
  }

  return captureRange(target);
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

export function readText(target: HTMLElement): string | null {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    return target.value;
  }

  return target.textContent;
}

export function insertText(
  target: HTMLElement,
  text: string,
  snapshot: SelectionSnapshot = null,
): void {
  if (!target.isConnected) {
    return;
  }

  focusTarget(target);

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
  if (selection) {
    try {
      target.setSelectionRange(selection.start, selection.end);
    } catch {
      // Some text-like inputs do not expose a selection range.
    }
  }

  if (!inShadowRoot(target)) {
    try {
      if (
        ownsFocus(target) &&
        typeof document.execCommand === "function" &&
        document.execCommand("insertText", false, text)
      ) {
        return;
      }
    } catch {
      // Fall through to the value path when the host blocks execCommand.
    }
  }

  insertWithValue(target, text);
}

function insertWithValue(target: TextControl, text: string): void {
  const valueLength = target.value.length;
  const rawStart = target.selectionStart ?? valueLength;
  const rawEnd = target.selectionEnd ?? rawStart;
  const start = clamp(Math.min(rawStart, rawEnd), 0, valueLength);
  const end = clamp(Math.max(rawStart, rawEnd), start, valueLength);
  const maxLength = target.maxLength >= 0 ? target.maxLength : Number.MAX_SAFE_INTEGER;
  const allowed = text.slice(0, Math.max(0, maxLength - (valueLength - (end - start))));
  if (allowed.length === 0) {
    return;
  }

  setNativeValue(target, target.value.slice(0, start) + allowed + target.value.slice(end));

  const caret = start + allowed.length;
  try {
    target.setSelectionRange(caret, caret);
  } catch {
    // Some text-like inputs do not expose a selection range.
  }
  dispatchInput(target, allowed);
}

function insertIntoContentEditable(
  target: HTMLElement,
  text: string,
  capturedRange: Range | null,
): void {
  const range =
    capturedRange && isUsableRange(target, capturedRange)
      ? capturedRange.cloneRange()
      : endRange(target);
  if (!range) {
    return;
  }

  if (!inShadowRoot(target)) {
    restoreSelection(target, range);

    try {
      if (
        ownsFocus(target) &&
        typeof document.execCommand === "function" &&
        document.execCommand("insertText", false, text)
      ) {
        return;
      }
    } catch {
      // Fall through to the Range path when the host blocks execCommand.
    }
  }

  insertWithRange(target, text, range);
}

function isUsableRange(target: HTMLElement, range: Range): boolean {
  return (
    range.startContainer.isConnected &&
    range.endContainer.isConnected &&
    rangeInsideTarget(target, range)
  );
}

function endRange(node: Node): Range | null {
  try {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    return range;
  } catch {
    return null;
  }
}

function restoreSelection(target: HTMLElement, range: Range): void {
  if (!isUsableRange(target, range)) {
    return;
  }

  const selection = targetSelection(target);
  if (!selection) {
    return;
  }

  try {
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    // A Range insert still works when the host rejects the Selection update.
  }
}

function insertWithRange(target: HTMLElement, text: string, range: Range): void {
  if (!isUsableRange(target, range)) {
    return;
  }

  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);

  const caret = endRange(textNode);
  if (caret) {
    restoreSelection(target, caret);
  }

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
