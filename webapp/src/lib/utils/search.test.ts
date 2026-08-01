import { describe, expect, it } from "vitest";
import { searchItems } from "./search";

const items = [
  {
    id: "reverse",
    name: "Reverse Text",
    description: "Reverse character order",
    aliases: ["backwards"],
    category: "string",
  },
  {
    id: "ulid",
    name: "ULID Generator",
    description: "Generate sortable identifiers",
    aliases: ["sortable id"],
    category: "identifiers",
  },
];

describe("shared tool search", () => {
  it("matches partial names, aliases, categories, and fuzzy gaps", () => {
    expect(searchItems("rev", items)[0].id).toBe("reverse");
    expect(searchItems("back", items)[0].id).toBe("reverse");
    expect(searchItems("identifiers", items)[0].id).toBe("ulid");
    expect(searchItems("bckw", items)[0].id).toBe("reverse");
  });

  it("applies identical relative ranking to any candidate subset", () => {
    const full = searchItems("id", items).map(({ id }) => id);
    const subset = searchItems(
      "id",
      items.filter(({ id }) => id !== "reverse"),
    );
    expect(subset.map(({ id }) => id)).toEqual(
      full.filter((id) => id !== "reverse"),
    );
  });
});
