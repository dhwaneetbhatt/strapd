import type { DiffSegment } from "./types";

const REDACTION_PREFIX = "[REDACTED_";
const MAX_DIFF_LENGTH = 8000;

/**
 * Derives display-only replacements by anchoring on the placeholders WASM
 * already inserted. It is called only when a user opens a diff, never during
 * paste handling.
 */
export function buildDiffSegments(original: string, scrubbed: string): DiffSegment[] {
  if (original === scrubbed || original.length > MAX_DIFF_LENGTH || scrubbed.length > MAX_DIFF_LENGTH) {
    return [];
  }

  const segments = deriveSegments(original, scrubbed);
  if (reconstruct(original, segments) === scrubbed) {
    return segments;
  }

  return [{ start: 0, end: original.length, raw: original, tag: scrubbed }];
}

function deriveSegments(original: string, scrubbed: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  let originalOffset = 0;
  let scrubbedOffset = 0;
  let searchFrom = 0;

  while (searchFrom < scrubbed.length) {
    const tagStart = scrubbed.indexOf(REDACTION_PREFIX, searchFrom);
    if (tagStart === -1) {
      break;
    }

    const tagEnd = scrubbed.indexOf("]", tagStart + REDACTION_PREFIX.length);
    if (tagEnd === -1) {
      break;
    }
    const tag = scrubbed.slice(tagStart, tagEnd + 1);

    const prefix = commonPrefix(
      original,
      originalOffset,
      scrubbed,
      scrubbedOffset,
      tagStart - scrubbedOffset,
    );
    originalOffset += prefix;
    scrubbedOffset += prefix;

    const nextTag = scrubbed.indexOf(REDACTION_PREFIX, tagEnd + 1);
    const after = nextTag === -1
      ? scrubbed.slice(tagEnd + 1)
      : scrubbed.slice(tagEnd + 1, nextTag);
    const rawStart = originalOffset;
    const rawEnd = after.length === 0 ? original.length : original.indexOf(after, rawStart);

    if (rawEnd > rawStart) {
      segments.push({
        start: rawStart,
        end: rawEnd,
        raw: original.slice(rawStart, rawEnd),
        tag,
      });
    }

    originalOffset = rawEnd === -1
      ? original.length
      : Math.min(original.length, rawEnd + after.length);
    scrubbedOffset = Math.min(scrubbed.length, tagEnd + 1 + after.length);
    searchFrom = nextTag === -1 ? scrubbed.length : nextTag;
  }

  return segments;
}

function reconstruct(original: string, segments: DiffSegment[]): string {
  let result = "";
  let offset = 0;
  for (const segment of segments) {
    result += original.slice(offset, segment.start) + segment.tag;
    offset = segment.end;
  }
  return result + original.slice(offset);
}

function commonPrefix(
  original: string,
  originalOffset: number,
  scrubbed: string,
  scrubbedOffset: number,
  limit: number,
): number {
  let length = 0;
  while (length < limit && original[originalOffset + length] === scrubbed[scrubbedOffset + length]) {
    length += 1;
  }
  return length;
}
