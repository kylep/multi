import { test, expect } from "@playwright/test";

async function enterGame(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByTestId("text-input").fill("ShopBot");
  await page.keyboard.press("Enter");
}

test.describe("Shop", () => {
  test("can open shop and see buy/sell options", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    await expect(page.getByText("=== SHOP ===")).toBeVisible();
    await expect(page.getByTestId("choice-buy")).toBeVisible();
    await expect(page.getByTestId("choice-sell")).toBeVisible();
    await expect(page.getByTestId("choice-back")).toBeVisible();
  });

  test("can buy a Stick", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();
    await page.getByTestId("choice-buy").click();

    await expect(page.getByText("=== BUY ===")).toBeVisible();

    // Find and click the Stick item
    const stickButton = page.locator("button", { hasText: "Stick" });
    await stickButton.click();

    await expect(page.getByText("Bought Stick for $50")).toBeVisible();
  });

  test("can sell an item after buying", async ({ page }) => {
    await enterGame(page);
    await page.getByTestId("choice-shop").click();

    // Buy a Stick first
    await page.getByTestId("choice-buy").click();
    const stickButton = page.locator("button", { hasText: "Stick" });
    await stickButton.click();
    await page.getByTestId("text-input").press("Enter"); // dismiss "Press Enter"

    // Go back to shop menu
    await page.getByTestId("choice-back").click();

    // Sell one of the Sticks (starter + purchased = 2)
    await page.getByTestId("choice-sell").click();
    const sellButton = page.locator("button", { hasText: "Stick" }).first();
    await sellButton.click();

    await expect(page.getByText("Sold Stick for $25")).toBeVisible();
  });
});
