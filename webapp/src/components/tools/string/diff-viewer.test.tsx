import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { DiffLine, TextDiff } from "../../../lib/wasm";
import { DiffStatus, DiffViewer } from "./diff-viewer";

const line = (
  kind: DiffLine["kind"],
  fromLine: number | null,
  toLine: number | null,
  text: string,
): DiffLine => ({
  kind,
  fromLine,
  toLine,
  segments: [{ text, emphasized: false }],
  missingNewline: false,
});

const removed = line("removed", 2, null, "timeout = 30;");
const added = line("added", null, 2, "timeout = 60;");
const diff: TextDiff = {
  added: 2,
  removed: 1,
  hunks: [
    {
      fromStart: 1,
      fromCount: 2,
      toStart: 1,
      toCount: 3,
      lines: [
        line("context", 1, 1, "[server]"),
        {
          ...removed,
          segments: [
            { text: "timeout = ", emphasized: false },
            { text: "30", emphasized: true },
            { text: ";", emphasized: false },
          ],
        },
        added,
        { ...line("added", null, 3, "port = 80;"), missingNewline: true },
      ],
    },
  ],
};

describe("diff viewer", () => {
  it("renders unified ranges, gutters, signs, emphasis and accessible labels", () => {
    render(
      <ChakraProvider>
        <DiffViewer diff={diff} mode="unified" />
      </ChakraProvider>,
    );
    const viewer = screen.getByRole("region", { name: "Diff" });
    expect(within(viewer).getByText("@@ -1,2 +1,3 @@")).toBeVisible();
    const row = within(viewer).getByText("Removed line").closest(".diff-line");
    expect(row?.querySelector(".diff-gutter")).toHaveTextContent("2");
    expect(row?.querySelector(".diff-sign")).toHaveTextContent("-");
    expect(within(viewer).getByText("30")).toHaveClass("diff-emphasis");
    expect(within(viewer).getAllByText("Added line")).toHaveLength(2);
    expect(
      within(viewer).getByText("No newline at end of file"),
    ).toBeInTheDocument();
  });

  it("pairs by position and fills the missing side of an unpaired row", () => {
    render(
      <ChakraProvider>
        <DiffViewer diff={diff} mode="split" />
      </ChakraProvider>,
    );
    const removed = screen.getByText("Removed line").closest(".diff-row");
    const added = screen.getAllByText("Added line");
    expect(added[0].closest(".diff-row")).toBe(removed);
    expect(added[1].closest(".diff-row")?.firstChild).toHaveClass(
      "diff-filler",
    );
  });

  it("elides long lines around emphasized tokens and expands on demand", () => {
    const long = "x".repeat(3_000);
    const diff: TextDiff = {
      added: 1,
      removed: 0,
      hunks: [
        {
          fromStart: 0,
          fromCount: 0,
          toStart: 1,
          toCount: 1,
          lines: [
            {
              ...added,
              segments: [
                { text: long, emphasized: false },
                { text: "highlight", emphasized: true },
                { text: long, emphasized: false },
              ],
            },
          ],
        },
      ],
    };
    render(
      <ChakraProvider>
        <DiffViewer diff={diff} mode="unified" />
      </ChakraProvider>,
    );
    expect(screen.getByText("highlight")).toHaveClass("diff-emphasis");
    const region = screen.getByRole("region");
    expect(region.textContent).not.toContain(long);
    fireEvent.click(screen.getByRole("button", { name: "Show full line" }));
    expect(region.textContent).toContain(`${long}highlight${long}`);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("caps initial rows, including the hunk header", () => {
    const lines = Array.from({ length: 2_003 }, (_, index) =>
      line("added", null, index + 1, "new line"),
    );
    render(
      <ChakraProvider>
        <DiffViewer
          mode="unified"
          diff={{
            added: lines.length,
            removed: 0,
            hunks: [
              {
                fromStart: 0,
                fromCount: 0,
                toStart: 1,
                toCount: lines.length,
                lines,
              },
            ],
          }}
        />
      </ChakraProvider>,
    );
    expect(screen.getAllByText("Added line")).toHaveLength(1_999);
    fireEvent.click(
      screen.getByRole("button", { name: "Show all 2,003 lines" }),
    );
    expect(screen.getAllByText("Added line")).toHaveLength(2_003);
  });

  it("distinguishes empty inputs from identical input", () => {
    const { rerender } = render(
      <ChakraProvider>
        <DiffStatus empty />
      </ChakraProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Paste text into both fields to compare.",
    );
    rerender(
      <ChakraProvider>
        <DiffStatus empty={false} />
      </ChakraProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("No differences");
  });
});
