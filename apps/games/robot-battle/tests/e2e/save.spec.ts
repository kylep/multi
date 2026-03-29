import { test, expect } from "@playwright/test";

async function freshStart(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
}

async function newGame(page: import("@playwright/test").Page, name: string) {
  await freshStart(page);
  const input = page.getByTestId("text-input");
  await expect(input).toBeVisible();
  await input.click();
  await input.fill(name);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
}

test.describe("Save & Load", () => {
  test("fresh start shows name prompt (no New/Continue)", async ({ page }) => {
    await freshStart(page);
    await expect(page.getByText("ROBOT BATTLE")).toBeVisible();
    await expect(page.getByTestId("text-input")).toBeVisible();
    await expect(page.getByTestId("choice-continue")).not.toBeVisible();
  });

  test("new game creates save — reload shows Continue", async ({ page }) => {
    await newGame(page, "SaveBot");

    await page.reload();

    await expect(page.getByText("Continue: SaveBot Lv.1")).toBeVisible();
  });

  test("Continue loads saved game with inventory", async ({ page }) => {
    await newGame(page, "InvBot");

    // Buy a Stick (buy tab is active by default)
    await page.getByTestId("choice-shop").click();
    await page.getByText("Stick", { exact: false }).first().click();
    await page.getByTestId("confirm-true").click();
    await page.getByTestId("choice-back").first().click();

    // Reload and continue
    await page.reload();
    await page.getByTestId("choice-continue").click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Check money in header
    await expect(page.getByText("$50")).toBeVisible();
  });

  test("save persists after fight (surrender)", async ({ page }) => {
    await newGame(page, "FightSaveBot");

    // Buy a Stick (buy tab is active by default)
    await page.getByTestId("choice-shop").click();
    await page.getByText("Stick", { exact: false }).first().click();
    await page.getByTestId("confirm-true").click();
    await page.getByTestId("choice-back").first().click();

    // Fight and surrender
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-surrender").click();
    await page.getByTestId("confirm-true").click();
    await page.getByTestId("choice-continue").click();

    // Reload and continue
    await page.reload();
    await page.getByTestId("choice-continue").click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Check fights count in main menu header
    await expect(page.getByText("0W / 1F").first()).toBeVisible();
  });

  test("save persists after shop session", async ({ page }) => {
    await newGame(page, "ShopSaveBot");

    // Buy a Stick (buy tab is active by default)
    await page.getByTestId("choice-shop").click();
    await page.getByText("Stick", { exact: false }).first().click();
    await page.getByTestId("confirm-true").click();
    await page.getByTestId("choice-back").first().click();

    // Reload and continue
    await page.reload();
    await page.getByTestId("choice-continue").click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Check money in header
    await expect(page.getByText("$50")).toBeVisible();
  });

  test("New Game from Continue screen starts fresh", async ({ page }) => {
    await newGame(page, "OldBot");

    await page.reload();
    await expect(page.getByText("Continue")).toBeVisible();

    await page.getByTestId("choice-new").click();

    const input = page.getByTestId("text-input");
    await expect(input).toBeVisible();
    await input.click();
    await input.fill("FreshBot");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Check fresh money in header
    await expect(page.getByText("$100")).toBeVisible();
  });

  test("Quit returns to title screen with Continue", async ({ page }) => {
    await newGame(page, "QuitBot");

    await page.getByTestId("choice-quit").click();

    await expect(page.getByText("ROBOT BATTLE")).toBeVisible();
    await expect(page.getByText("Continue: QuitBot Lv.1")).toBeVisible();

    await page.getByTestId("choice-continue").click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
  });
});
