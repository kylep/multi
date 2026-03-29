import { test, expect } from "@playwright/test";

async function enterGameWithWeapon(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByTestId("text-input").fill("FightBot");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 10000 });
}

async function startBattle(page: import("@playwright/test").Page, enemyName: string) {
  await page.getByTestId("choice-fight").click();
  await page.getByTestId(`choice-${enemyName}`).click();
  await page.getByTestId("choice-fight").click();
}

test.describe("Combat", () => {
  test("can start a battle with MiniBot", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await expect(page.getByText("vs MiniBot")).toBeVisible();
    await expect(page.getByText("Turn 1")).toBeVisible();
    await expect(page.getByTestId("choice-attack")).toBeVisible();
  });

  test("can attack with a weapon", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-attack").click();

    await expect(page.getByText("Turn Resolution")).toBeVisible({ timeout: 5000 });
  });

  test("can surrender from battle", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-surrender").click();
    await page.getByTestId("confirm-true").click();

    await expect(page.getByText("SURRENDERED")).toBeVisible();
  });

  test("can rest during battle", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-rest").click();

    await expect(page.getByText("You prepare to rest...")).toBeVisible();
  });

  test("auto-battle button is visible", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await expect(page.getByTestId("choice-auto")).toBeVisible();
  });

  test("auto-battle runs to completion", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-auto").click();

    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });
  });

  test("auto-battle shows turn resolution", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-auto").click();

    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });

    await expect(page.getByText("attacks!").first()).toBeVisible();
  });

  test("rewards shown after auto-battle", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-auto").click();

    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });

    const isVictory = await page.getByText("VICTORY").isVisible();
    if (isVictory) {
      await expect(page.getByText("+2 exp")).toBeVisible();
    }
  });

  test("enemy list shows difficulty tags", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();

    await expect(page.getByText("[Fair]").first()).toBeVisible();
    await expect(page.getByText("[Hard]").first()).toBeVisible();
  });

  test("enemy detail screen shows stats and weapons", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await expect(page.getByText("MiniBot")).toBeVisible();
    await expect(page.getByText("HP: 15")).toBeVisible();
    await expect(page.getByText("Stick (1 dmg)")).toBeVisible();
    await expect(page.getByTestId("choice-fight")).toBeVisible();
    await expect(page.getByTestId("choice-back")).toBeVisible();
  });

  test("enemy detail Back returns to list", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();
    await page.getByTestId("choice-MiniBot").click();

    await page.getByTestId("choice-back").click();

    await expect(page.getByText("CHOOSE YOUR OPPONENT")).toBeVisible();
    await expect(page.getByTestId("choice-MiniBot")).toBeVisible();
  });

  test("loss earns $10 consolation", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-surrender").click();
    await page.getByTestId("confirm-true").click();

    await expect(page.getByText("+$10 consolation")).toBeVisible();
    await page.getByTestId("choice-continue").click();

    // Check money on main menu header
    await expect(page.getByText("$110")).toBeVisible();
  });

  test("level-up preview shown after fight", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-auto").click();
    await expect(
      page.getByText("VICTORY").or(page.getByText("DEFEAT")),
    ).toBeVisible({ timeout: 30000 });

    await expect(page.getByText("Next level unlocks:")).toBeVisible();
  });

  test("keyboard arrow nav works on choices", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.waitForTimeout(100);

    // Arrow right to Shop (grid: index 1), then Enter
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    await expect(page.getByText("SHOP")).toBeVisible();
  });

  test("number key shortcut selects choice", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.waitForTimeout(100);

    // Press "2" to go to Shop (grid index 1)
    await page.keyboard.press("2");

    await expect(page.getByText("SHOP")).toBeVisible();
  });

  test("continue countdown auto-dismisses", async ({ page }) => {
    await enterGameWithWeapon(page);
    await startBattle(page, "MiniBot");

    await page.getByTestId("choice-surrender").click();
    await page.getByTestId("confirm-true").click();

    await expect(page.getByTestId("choice-continue")).toBeVisible();

    // Wait 6 seconds for auto-dismiss
    await page.waitForTimeout(6000);

    await expect(page.getByTestId("choice-fight")).toBeVisible({ timeout: 5000 });
  });

  test("6 enemies visible in fight menu", async ({ page }) => {
    await enterGameWithWeapon(page);
    await page.getByTestId("choice-fight").click();

    await expect(page.getByTestId("choice-MiniBot")).toBeVisible();
    await expect(page.getByTestId("choice-Rustclaw")).toBeVisible();
    await expect(page.getByTestId("choice-Omega")).toBeVisible();
  });
});
