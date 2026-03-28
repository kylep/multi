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
    // Should NOT see continue button
    await expect(page.locator("button", { hasText: "Continue" })).not.toBeVisible();
  });

  test("new game creates save — reload shows Continue", async ({ page }) => {
    await newGame(page, "SaveBot");

    // Reload the page
    await page.reload();

    // Should see Continue option
    await expect(page.locator("button", { hasText: "Continue: SaveBot Lv.1" })).toBeVisible();
  });

  test("Continue loads saved game with inventory", async ({ page }) => {
    await newGame(page, "InvBot");

    // Buy a Stick
    await page.getByTestId("choice-shop").click();
    await page.getByTestId("choice-buy").click();
    const stickButton = page.locator("button", { hasText: "Stick" });
    await stickButton.click();
    await page.getByTestId("text-input").press("Enter");
    await page.getByTestId("choice-back").click(); // back to shop
    await page.getByTestId("choice-back").click(); // back to main menu (triggers save)

    // Reload and continue
    await page.reload();
    await page.locator("button", { hasText: "Continue" }).click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Inspect robot
    await page.getByTestId("choice-inspect").click();
    await expect(page.getByText("Money: $50")).toBeVisible();
    await expect(page.getByText("1. Stick")).toBeVisible();
    await expect(page.getByText("2. Stick")).toBeVisible();
  });

  test("save persists after fight (surrender)", async ({ page }) => {
    await newGame(page, "FightSaveBot");

    // Buy a Stick
    await page.getByTestId("choice-shop").click();
    await page.getByTestId("choice-buy").click();
    page.locator("button", { hasText: "Stick" }).click();
    await page.getByTestId("text-input").press("Enter");
    await page.getByTestId("choice-back").click();
    await page.getByTestId("choice-back").click();

    // Fight and surrender
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();
    await page.getByTestId("choice-surrender").click();
    await page.getByTestId("choice-yes").click();
    await page.getByTestId("text-input").press("Enter"); // dismiss battle result

    // Reload and continue
    await page.reload();
    await page.locator("button", { hasText: "Continue" }).click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Check fights count
    await page.getByTestId("choice-inspect").click();
    await expect(page.getByText("Wins: 0 / Fights: 1")).toBeVisible();
  });

  test("save persists after shop session", async ({ page }) => {
    await newGame(page, "ShopSaveBot");

    // Buy a Stick
    await page.getByTestId("choice-shop").click();
    await page.getByTestId("choice-buy").click();
    page.locator("button", { hasText: "Stick" }).click();
    await page.getByTestId("text-input").press("Enter");
    await page.getByTestId("choice-back").click();
    await page.getByTestId("choice-back").click(); // triggers save

    // Reload and continue
    await page.reload();
    await page.locator("button", { hasText: "Continue" }).click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    await page.getByTestId("choice-inspect").click();
    await expect(page.getByText("1. Stick")).toBeVisible();
    await expect(page.getByText("Money: $50")).toBeVisible();
  });

  test("New Game from Continue screen starts fresh", async ({ page }) => {
    // Create a save first
    await newGame(page, "OldBot");

    // Reload — should see Continue
    await page.reload();
    await expect(page.locator("button", { hasText: "Continue" })).toBeVisible();

    // Click New Game
    await page.getByTestId("choice-new").click();

    // Should get name prompt
    const input = page.getByTestId("text-input");
    await expect(input).toBeVisible();
    await input.click();
    await input.fill("FreshBot");
    await page.keyboard.press("Enter");

    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });

    // Inspect — should be fresh
    await page.getByTestId("choice-inspect").click();
    await expect(page.getByText("=== FreshBot ===")).toBeVisible();
    await expect(page.getByText("Money: $100")).toBeVisible();
  });

  test("Quit returns to title screen with Continue", async ({ page }) => {
    await newGame(page, "QuitBot");

    // Quit
    await page.getByTestId("choice-quit").click();

    // Should be at title with Continue
    await expect(page.getByText("ROBOT BATTLE")).toBeVisible();
    await expect(page.locator("button", { hasText: "Continue: QuitBot Lv.1" })).toBeVisible();

    // Click Continue — should be back at main menu
    await page.locator("button", { hasText: "Continue" }).click();
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
  });
});
