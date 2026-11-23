import { CheckIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import {
  type CSSProperties,
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";
import type {
  DiffHunk,
  DiffLine,
  DiffSegment,
  TextDiff,
} from "../../../lib/wasm";

export type DiffViewMode = "unified" | "split";

const ROW_LIMIT = 2_000;
const LINE_LIMIT = 2_000;
const EMPTY_EXPANSIONS: ReadonlySet<string> = new Set();
const focus = { outline: "2px solid", outlineColor: "border.focus" };

const panelStyles = {
  ".diff-row, .diff-line": { display: "grid", minW: 0 },
  ".diff-row-split": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  ".diff-row-split > :nth-child(2)": {
    borderInlineStart: "1px solid",
    borderColor: "border.base",
  },
  ".diff-line": { gridTemplateColumns: "var(--gutter) 2ch minmax(0, 1fr)" },
  ".diff-line-unified": {
    gridTemplateColumns: "repeat(2, var(--gutter)) 2ch minmax(0, 1fr)",
  },
  ".diff-filler, .diff-hunk": { bg: "surface.muted" },
  ".diff-hunk": { color: "text.subtle", px: 2, py: 1 },
  ".diff-removed": {
    bg: "diff.removed.bg",
    ".diff-sign": { color: "diff.removed.fg" },
    ".diff-emphasis": { bg: "diff.removed.emphasis" },
  },
  ".diff-added": {
    bg: "diff.added.bg",
    ".diff-sign": { color: "diff.added.fg" },
    ".diff-emphasis": { bg: "diff.added.emphasis" },
  },
  ".diff-emphasis": { borderRadius: "2px" },
  ".diff-gutter": {
    textAlign: "right",
    color: "text.subtle",
    pe: 2,
    userSelect: "none",
  },
  ".diff-sign": { textAlign: "center", userSelect: "none" },
  ".diff-code": { whiteSpace: "pre-wrap", overflowWrap: "anywhere", pe: 2 },
  ".diff-marker": { color: "text.subtle", ms: 2, userSelect: "none" },
  ".diff-expand": {
    fontFamily: "body",
    fontSize: "xs",
    color: "text.primary",
    textDecoration: "underline",
    ms: 2,
    minH: "6",
    _focusVisible: focus,
  },
  ".diff-sr": {
    position: "absolute",
    w: "1px",
    h: "1px",
    p: 0,
    m: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
};

function isLowSurrogate(code: number) {
  return code >= 0xdc00 && code <= 0xdfff;
}

function visibleSegments(segments: DiffSegment[], expanded: boolean) {
  const size = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  if (expanded || size <= LINE_LIMIT) {
    return { segments, elided: false };
  }
  if (
    size <= 2 * LINE_LIMIT &&
    segments.reduce((count, segment) => count + [...segment.text].length, 0) <=
      LINE_LIMIT
  ) {
    return { segments, elided: false };
  }

  const emphasized = segments.filter((segment) => segment.emphasized).length;
  const budget = Math.floor(LINE_LIMIT / Math.max(1, emphasized));
  const windows: { start: number; end: number }[] = [];
  let offset = 0;
  for (const segment of segments) {
    if (segment.emphasized) {
      const padding = Math.floor(Math.max(0, budget - segment.text.length) / 2);
      const start = Math.max(0, Math.min(offset - padding, size - budget));
      const previous = windows[windows.length - 1];
      if (previous && start <= previous.end) {
        previous.end = start + budget;
      } else {
        windows.push({ start, end: start + budget });
      }
    }
    offset += segment.text.length;
  }
  if (windows.length === 0) windows.push({ start: 0, end: LINE_LIMIT });

  const visible: DiffSegment[] = [];
  let index = 0;
  let segmentStart = 0;
  let lastEnd = 0;
  for (const window of windows) {
    if (window.start > lastEnd) visible.push({ text: "…", emphasized: false });
    while (index < segments.length && segmentStart < window.end) {
      const segment = segments[index];
      const segmentEnd = segmentStart + segment.text.length;
      let start = Math.max(0, window.start - segmentStart);
      let end = Math.min(segment.text.length, window.end - segmentStart);
      if (isLowSurrogate(segment.text.charCodeAt(start))) start++;
      if (isLowSurrogate(segment.text.charCodeAt(end))) end--;
      if (end > start) {
        visible.push({
          text: segment.text.slice(start, end),
          emphasized: segment.emphasized,
        });
      }
      if (segmentEnd > window.end) break;
      segmentStart = segmentEnd;
      index++;
    }
    lastEnd = window.end;
  }
  if (lastEnd < size) visible.push({ text: "…", emphasized: false });
  return { segments: visible, elided: true };
}

function CodeLine({
  line,
  side,
  expanded,
  onExpand,
}: {
  line: DiffLine;
  side?: "original" | "changed";
  expanded: boolean;
  onExpand: () => void;
}) {
  const display = visibleSegments(line.segments, expanded);
  const sign = line.kind === "removed" ? "-" : line.kind === "added" ? "+" : "";
  return (
    <div
      className={`diff-line diff-${line.kind}${side ? "" : " diff-line-unified"}`}
    >
      {side !== "changed" && (
        <span className="diff-gutter" aria-hidden="true">
          {line.fromLine}
        </span>
      )}
      {side !== "original" && (
        <span className="diff-gutter" aria-hidden="true">
          {line.toLine}
        </span>
      )}
      <span className="diff-sign" aria-hidden="true">
        {sign}
      </span>
      <div className="diff-code">
        {sign && (
          <span className="diff-sr">
            {line.kind === "removed" ? "Removed line" : "Added line"}{" "}
          </span>
        )}
        {display.segments.map((segment, index) =>
          segment.emphasized ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: ordered immutable pieces of this line
            <span className="diff-emphasis" key={index}>
              {segment.text}
            </span>
          ) : (
            segment.text
          ),
        )}
        {line.missingNewline && (
          <>
            <span className="diff-marker" aria-hidden="true">
              ⏎̸
            </span>
            <span className="diff-sr"> No newline at end of file</span>
          </>
        )}
        {(display.elided || expanded) && (
          <button
            className="diff-expand"
            type="button"
            aria-expanded={expanded}
            onClick={onExpand}
          >
            {expanded ? "Show less" : "Show full line"}
          </button>
        )}
      </div>
    </div>
  );
}

const DiffRow = memo(function DiffRow({
  rowId,
  left,
  right,
  split,
  leftExpanded,
  rightExpanded,
  onExpand,
}: {
  rowId: string;
  left?: DiffLine;
  right?: DiffLine;
  split: boolean;
  leftExpanded: boolean;
  rightExpanded: boolean;
  onExpand: (key: string) => void;
}) {
  return (
    <div className={split ? "diff-row diff-row-split" : "diff-row"}>
      {left ? (
        <CodeLine
          line={left}
          side={split ? "original" : undefined}
          expanded={leftExpanded}
          onExpand={() => onExpand(`${rowId}-left`)}
        />
      ) : (
        <div className="diff-filler" aria-hidden="true" />
      )}
      {split &&
        (right ? (
          <CodeLine
            line={right}
            side="changed"
            expanded={rightExpanded}
            onExpand={() => onExpand(`${rowId}-right`)}
          />
        ) : (
          <div className="diff-filler" aria-hidden="true" />
        ))}
    </div>
  );
});

type ViewRow =
  | { id: string; hunk: DiffHunk }
  | { id: string; left?: DiffLine; right?: DiffLine };

function makeRows(diff: TextDiff, split: boolean, limit: number) {
  const rows: ViewRow[] = [];
  let totalLines = 0;
  let gutter = 1;
  for (const [hunkIndex, hunk] of diff.hunks.entries()) {
    gutter = Math.max(
      gutter,
      String(hunk.fromStart + hunk.fromCount - 1).length,
      String(hunk.toStart + hunk.toCount - 1).length,
    );
    if (rows.length < limit) rows.push({ id: `${hunkIndex}`, hunk });
    const { lines } = hunk;
    let i = 0;
    while (i < lines.length) {
      if (!split || lines[i].kind === "context") {
        if (rows.length < limit) {
          rows.push({
            id: `${hunkIndex}-${i}`,
            left: lines[i],
            right: split ? lines[i] : undefined,
          });
        }
        totalLines++;
        i++;
        continue;
      }

      const start = i;
      while (lines[i]?.kind === "removed") i++;
      const middle = i;
      while (lines[i]?.kind === "added") i++;
      const length = Math.max(middle - start, i - middle);
      for (let j = 0; j < length && rows.length < limit; j++) {
        rows.push({
          id: `${hunkIndex}-${start + j}`,
          left: start + j < middle ? lines[start + j] : undefined,
          right: middle + j < i ? lines[middle + j] : undefined,
        });
      }
      totalLines += length;
    }
  }
  return { rows, gutter, totalLines };
}

function formatRange(start: number, count: number) {
  return count === 1 ? String(start) : `${start},${count}`;
}

export const DiffViewer = memo(function DiffViewer({
  diff,
  mode,
}: {
  diff: TextDiff;
  mode: DiffViewMode;
}) {
  const [reveal, setReveal] = useState<{
    diff: TextDiff;
    mode: DiffViewMode;
    all: boolean;
    lines: ReadonlySet<string>;
  }>();
  const current = reveal?.diff === diff && reveal.mode === mode ? reveal : null;
  if (reveal && !current) setReveal(undefined);
  const all = current?.all ?? false;
  const lines = current?.lines ?? EMPTY_EXPANSIONS;
  const split = mode === "split";
  const { rows, gutter, totalLines } = useMemo(
    () => makeRows(diff, split, all ? Infinity : ROW_LIMIT),
    [diff, split, all],
  );
  const onExpand = useCallback(
    (id: string) =>
      setReveal((prev) => {
        const same = prev?.diff === diff && prev.mode === mode;
        const next = new Set(same ? prev.lines : EMPTY_EXPANSIONS);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { diff, mode, all: same ? prev.all : false, lines: next };
      }),
    [diff, mode],
  );

  return (
    <Box
      as="section"
      aria-label="Diff"
      border="1px solid"
      borderColor="border.base"
      rounded="md"
      overflow="hidden"
      fontFamily="mono"
      fontSize="sm"
      color="text.primary"
      bg="form.bg"
      sx={panelStyles}
      style={{ "--gutter": `${gutter + 2}ch` } as CSSProperties}
    >
      {rows.map((row) =>
        "hunk" in row ? (
          <div className="diff-hunk" key={row.id}>
            @@ -{formatRange(row.hunk.fromStart, row.hunk.fromCount)} +
            {formatRange(row.hunk.toStart, row.hunk.toCount)} @@
          </div>
        ) : (
          <DiffRow
            key={row.id}
            rowId={row.id}
            left={row.left}
            right={row.right}
            split={split}
            leftExpanded={lines.has(`${row.id}-left`)}
            rightExpanded={lines.has(`${row.id}-right`)}
            onExpand={onExpand}
          />
        ),
      )}
      {!all && totalLines + diff.hunks.length > ROW_LIMIT && (
        <Flex bg="surface.muted" px={2} py={1}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReveal({ diff, mode, all: true, lines })}
            _focusVisible={focus}
          >
            Show all {totalLines.toLocaleString()} lines
          </Button>
        </Flex>
      )}
    </Box>
  );
});

export function DiffStatus({ empty }: { empty: boolean }) {
  return (
    <Flex
      role="status"
      align="center"
      gap={2}
      color="text.subtle"
      fontSize="sm"
    >
      {!empty && <CheckIcon aria-hidden="true" boxSize={3} />}
      <Text>
        {empty ? "Paste text into both fields to compare." : "No differences"}
      </Text>
    </Flex>
  );
}
