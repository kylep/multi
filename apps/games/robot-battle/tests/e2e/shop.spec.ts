import { test, expect } from "@playwright/test";

async function enterGame(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByTestId("text-input").fill("ShopBot");
  await page.keyboard.press("Enter");
}

test.describe("Shop", () => {
  test("can open shop and see tab bar", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    await expect(page.getByText("SHOP")).toBeVisible();
    // All tabs visible in the tab bar
    await expect(page.getByTestId("choice-buy")).toBeVisible();
    await expect(page.getByTestId("choice-sell")).toBeVisible();
    await expect(page.getByTestId("choice-inventory")).toBeVisible();
    await expect(page.getByTestId("choice-back").first()).toBeVisible();
  });

  test("Wrench visible in buy tab with stats", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    // Buy tab is active by default — items visible immediately
    await expect(page.getByText("Wrench")).toBeVisible();
    await expect(page.getByText("2 dmg")).toBeVisible();
  });

  test("can buy a Stick", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    // Buy tab is active by default — click the Stick card, confirm in modal
    await page.getByText("Stick", { exact: false }).first().click();
    await page.getByTestId("confirm-true").click();

    // Buy menu re-renders — verify money decreased
    await expect(page.getByText("$50", { exact: true })).toBeVisible();
  });

  test("bottom Back card returns to main menu", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    // Click the bottom Back card (not the tab)
    const bottomBack = page.locator(".card.card-back");
    await expect(bottomBack).toBeVisible();
    await bottomBack.click();

    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
  });

  test("can sell an item after buying", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    // Buy a Stick first (buy tab is active by default)
    await page.getByText("Stick", { exact: false }).first().click();
    await page.getByTestId("confirm-true").click();

    // Switch to Sell tab
    await page.getByTestId("choice-sell").click();

    // Sell one of the Sticks
    await page.getByText("Stick", { exact: false }).first().click();
    await page.getByTestId("confirm-true").click();

    // Verify money increased
    await expect(page.getByText("$75")).toBeVisible();
  });
});
