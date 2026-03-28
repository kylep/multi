import { test, expect } from "@playwright/test";

async function freshStart(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
}

async function enterName(page: import("@playwright/test").Page, name: string) {
  await freshStart(page);
  const input = page.getByTestId("text-input");
  await expect(input).toBeVisible();
  await input.click();
  await input.fill(name);
  await page.keyboard.press("Enter");
  // Wait for main menu choices to appear
  await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
}

test.describe("Main Menu", () => {
  test("shows title screen and accepts robot name", async ({ page }) => {
    await freshStart(page);
    await expect(page.getByText("ROBOT BATTLE")).toBeVisible();
    const input = page.getByTestId("text-input");
    await expect(input).toBeVisible();

    await input.click();
    await input.fill("E2EBot");
    await page.keyboard.press("Enter");

    // Main menu choices appear
    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
  });

  test("main menu shows all options", async ({ page }) => {
    await enterName(page, "E2EBot");

    await expect(page.getByTestId("choice-fight")).toBeVisible();
    await expect(page.getByTestId("choice-shop")).toBeVisible();
    await expect(page.getByTestId("choice-inspect")).toBeVisible();
    await expect(page.getByTestId("choice-quit")).toBeVisible();
  });

  test("inspect shows robot stats", async ({ page }) => {
    await enterName(page, "E2EBot");

    await page.getByTestId("choice-inspect").click();

    await expect(page.getByText("=== E2EBot ===")).toBeVisible();
    await expect(page.getByText("Money: $100")).toBeVisible();
  });

  test("quit returns to title screen", async ({ page }) => {
    await enterName(page, "E2EBot");

    await page.getByTestId("choice-quit").click();

    // Should be back at title screen with Continue option
    await expect(page.getByText("ROBOT BATTLE")).toBeVisible();
    await expect(page.locator("button", { hasText: "Continue" })).toBeVisible();
  });
});
