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

    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
  });

  test("main menu shows all options", async ({ page }) => {
    await enterName(page, "E2EBot");

    await expect(page.getByTestId("choice-fight")).toBeVisible();
    await expect(page.getByTestId("choice-shop")).toBeVisible();
    await expect(page.getByTestId("choice-upgrades")).toBeVisible();
    await expect(page.getByTestId("choice-settings")).toBeVisible();
    await expect(page.getByTestId("choice-quit")).toBeVisible();
  });

  test("upgrades screen shows options", async ({ page }) => {
    await enterName(page, "E2EBot");
    await page.getByTestId("choice-upgrades").click();

    await expect(page.getByText("UPGRADES")).toBeVisible();
    await expect(page.getByTestId("choice-inventory-5")).toBeVisible();
    await expect(page.getByTestId("choice-inventory-6")).toBeVisible();
  });

  test("settings screen shows mode toggle", async ({ page }) => {
    await enterName(page, "E2EBot");
    await page.getByTestId("choice-settings").click();

    await expect(page.getByText("SETTINGS")).toBeVisible();
    await expect(page.getByTestId("choice-oliver")).toBeVisible();
    await expect(page.getByTestId("choice-lucas")).toBeVisible();
  });

  test("quit returns to title screen", async ({ page }) => {
    await enterName(page, "E2EBot");

    await page.getByTestId("choice-quit").click();

    await expect(page.getByText("ROBOT BATTLE")).toBeVisible();
    await expect(page.getByText("Continue")).toBeVisible();
  });

  test("Enter button submits robot name", async ({ page }) => {
    await freshStart(page);
    const input = page.getByTestId("text-input");
    await expect(input).toBeVisible();
    await input.fill("BtnBot");

    await page.getByTestId("text-submit").click();

    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
  });
});
