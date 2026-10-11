import { expect, type Locator, type Page, test } from "@playwright/test";

const pipe = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "A deliberately long mobile pipe name that must never overflow",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  steps: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      toolId: "string-reverse",
      toolVersion: 1,
      config: {},
    },
  ],
};

const seedPipe = async (page: Page) => {
  await page.addInitScript((savedPipe) => {
    localStorage.setItem(
      "strapd-pipes",
      JSON.stringify({ schemaVersion: 1, pipes: [savedPipe] }),
    );
  }, pipe);
};

const openPipes = async (page: Page) => {
  await page.goto("/#/pipes");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

const expectNoPageOverflow = async (page: Page) => {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
};

const expectTouchTarget = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
};

const openSavedPipes = async (page: Page) => {
  const toggle = page.getByRole("button", {
    name: /Browse saved pipes|Collapse saved pipes/,
  });
  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
  }
};

const expectInsideViewport = async (page: Page, locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(0);
  expect(box?.y).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    viewport?.width ?? 0,
  );
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    viewport?.height ?? 0,
  );
};

test("runs and renames a pipe without overflow across mobile viewports", async ({
  page,
}) => {
  await seedPipe(page);
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });

  for (const viewport of [
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await openPipes(page);
    await expectNoPageOverflow(page);

    await page.getByLabel("Pipe input").fill("mobile");
    await page.getByRole("button", { name: "Run pipe" }).click();
    await expect(page.getByLabel("Final pipe output")).toHaveValue("elibom");
  }

  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole("button", { name: "More pipe actions" }).click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await page
    .getByLabel("Pipe name")
    .fill("An even longer renamed pipe that remains usable on a phone");
  await expectNoPageOverflow(page);
  await expectTouchTarget(page.getByRole("button", { name: "Save name" }));
  await expectTouchTarget(page.getByRole("button", { name: "Cancel rename" }));
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(
    page.getByRole("heading", { name: /An even longer renamed pipe/ }),
  ).toBeVisible();

  const expand = page.getByRole("button", { name: "Expand input pane" });
  await expectTouchTarget(expand);
  await expand.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectInsideViewport(page, dialog);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(
    page.getByRole("button", { name: "Restore input pane" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(expand).toBeFocused();
});

test("creates, edits, and duplicates several pipes at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openPipes(page);
  await page.getByRole("button", { name: "Create pipe" }).click();
  await page.getByLabel("Pipe name").fill("Phone reverse");
  const toolSearch = page.getByRole("combobox", {
    name: "Find a tool to add",
  });
  await toolSearch.fill("reverse");
  await page.getByRole("option", { name: /Reverse Text/ }).click();
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: "Save pipe" }).click();

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Pipe name").fill("Phone reverse edited");
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: "Save pipe" }).click();

  for (let index = 0; index < 2; index += 1) {
    await page.getByRole("button", { name: "More pipe actions" }).click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      index === 0
        ? "Phone reverse edited copy"
        : "Phone reverse edited copy copy",
    );
  }

  await openSavedPipes(page);
  await expect(
    page.getByRole("navigation", { name: "Saved pipes" }),
  ).toContainText("Phone reverse edited copy copy");
  await expectNoPageOverflow(page);
});

test("keeps conflict and delete dialogs usable with increased text", async ({
  page,
}) => {
  await seedPipe(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    document.documentElement.style.fontSize = "20px";
  });
  await openPipes(page);
  await openSavedPipes(page);
  await page.getByLabel("Import pipe JSON").setInputFiles({
    name: "conflicting.strapd-pipe.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, pipe })),
  });

  const conflict = page.getByRole("alertdialog", {
    name: "Pipe already exists",
  });
  await expect(conflict).toBeVisible();
  await expectInsideViewport(page, conflict);
  for (const name of ["Cancel", "Import as copy", "Replace existing"]) {
    await expectInsideViewport(page, conflict.getByRole("button", { name }));
  }
  await conflict.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "More pipe actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const deletion = page.getByRole("alertdialog", { name: "Delete this pipe?" });
  await expectInsideViewport(page, deletion);
  await deletion.getByRole("button", { name: "Delete pipe" }).click();
  await expect(
    page.getByRole("heading", { name: "Build a repeatable pipe" }),
  ).toBeVisible();
  await expectNoPageOverflow(page);
});

test("exposes mobile search and keeps sidebar controls clear of text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/#/");
  await page.getByRole("button", { name: "Search tools" }).click();
  await expect(
    page.getByRole("combobox", { name: "Search all tools" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Toggle navigation" }).click();
  const navigation = page.getByRole("navigation", {
    name: "Developer tools navigation",
  });
  await expect(navigation).toHaveCSS("width", "280px");
  const close = page.getByRole("button", { name: "Close navigation" });
  const label = navigation.getByText("Text Tools", { exact: true }).first();
  const closeBox = await close.boundingBox();
  const labelBox = await label.boundingBox();
  expect(closeBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect((closeBox?.y ?? 0) + (closeBox?.height ?? 0)).toBeLessThanOrEqual(
    labelBox?.y ?? 0,
  );
  await expectTouchTarget(close);
  await expectNoPageOverflow(page);
});
