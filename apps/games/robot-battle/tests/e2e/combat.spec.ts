import { test, expect } from "@playwright/test";

async function enterGameWithWeapon(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByTestId("text-input").fill("FightBot");
  await page.keyboard.press("Enter");
  // Player starts with a free Stick — no shop visit needed
  await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
}

test.describe("Combat", () => {
  test("can start a battle with MiniBot", async ({ page }) => {
    await enterGameWithWeapon(page);

    // Navigate to fight
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    // Should see battle screen
    await expect(page.getByText("FIGHT #1: vs MiniBot")).toBeVisible();
    await expect(page.getByText("=== Turn 1 ===")).toBeVisible();
    await expect(page.getByTestId("choice-attack")).toBeVisible();
  });

  test("can attack with a weapon", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    // Choose attack
    await page.getByTestId("choice-attack").click();

    // Enter weapon number
    await page.getByTestId("text-input").fill("1");
    await page.keyboard.press("Enter");

    // Should see turn resolution
    await expect(page.getByText("Turn Resolution")).toBeVisible({ timeout: 5000 });
  });

  test("can surrender from battle", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await page.getByTestId("choice-surrender").click();
    await page.getByTestId("choice-yes").click();

    await expect(page.getByText("SURRENDERED")).toBeVisible();
  });

  test("can rest during battle", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await page.getByTestId("choice-rest").click();

    await expect(page.getByText("You prepare to rest...")).toBeVisible();
  });

  test("auto-battle button is visible", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await expect(page.getByTestId("choice-auto")).toBeVisible();
    await expect(page.locator("button", { hasText: "Auto-Battle" })).toBeVisible();
  });

  test("auto-battle runs to completion", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await page.getByTestId("choice-auto").click();

    // Wait for battle to end — either victory or defeat
    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });
  });

  test("auto-battle shows turn resolution", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await page.getByTestId("choice-auto").click();

    // Wait for battle to end
    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });

    // Verify turn resolution happened (attacks! text in output)
    await expect(page.getByText("attacks!").first()).toBeVisible();
  });

  test("rewards shown after auto-battle", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await page.getByTestId("choice-auto").click();

    // Wait for battle to end
    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });

    // If victory, rewards should be shown
    const isVictory = await page.getByText("VICTORY").isVisible();
    if (isVictory) {
      await expect(page.getByText("+2 exp")).toBeVisible();
    }
  });
});
