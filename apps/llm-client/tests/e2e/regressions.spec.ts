import { test, expect } from "@playwright/test";
import { mockChatCompletions } from "./_helpers";

test("chat row edit and delete buttons are visible on hover", async ({
  page,
}) => {
  await mockChatCompletions(page, { tokens: ["ok"] });
  await page.goto("/");

  await page.getByTestId("new-chat-btn").click();
  await page.getByTestId("composer-input").fill(
    "a very long chat title that might overflow the sidebar",
  );
  await page.getByTestId("composer-input").press("Enter");
  await expect(page.getByTestId("msg-assistant").last()).toContainText("ok");

  const row = page
    .getByRole("navigation", { name: "Chat history" })
    .locator("[data-testid^='chat-row-']")
    .first();
  await row.hover();

  const editBtn = row.getByTestId("chat-rename-btn");
  const deleteBtn = row.getByTestId("chat-delete-btn");
  await expect(editBtn).toBeVisible();
  await expect(deleteBtn).toBeVisible();
  await expect(editBtn).toBeEnabled();
  await expect(deleteBtn).toBeEnabled();
});

test("settings values persist after switching to chat and back", async ({
  page,
}) => {
  await mockChatCompletions(page, { tokens: ["ok"] });
  await page.goto("/");

  await page.getByTestId("settings-open").click();

  await page.getByTestId("sp-tab-text").click();
  await page.getByTestId("sp-textarea").fill("You are a pirate");

  await page.getByTestId("seed-tab-text").click();
  await page.getByTestId("seed-textarea").fill("Caribbean setting");

  // Switch to chat (pane stays mounted but hidden)
  await page.getByTestId("new-chat-btn").click();

  // Switch back to settings
  await page.getByTestId("settings-open").click();

  await expect(page.getByTestId("sp-textarea")).toHaveValue("You are a pirate");
  await expect(page.getByTestId("seed-textarea")).toHaveValue(
    "Caribbean setting",
  );
});

test("settings values survive page reload after explicit save", async ({
  page,
}) => {
  await mockChatCompletions(page, { tokens: ["ok"] });
  await page.goto("/");

  await page.getByTestId("settings-open").click();

  await page.getByTestId("sp-tab-text").click();
  await page.getByTestId("sp-textarea").fill("persistent system prompt");

  await page.getByTestId("seed-tab-text").click();
  await page.getByTestId("seed-textarea").fill("persistent seed prompt");

  await page.getByTestId("settings-save").click();

  // Verify it's in localStorage
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("llm-client/settings/v1");
    return raw ? JSON.parse(raw)?.state?.systemPrompt : null;
  });
  expect(stored).toBe("persistent system prompt");

  await page.reload();
  await page.getByTestId("settings-open").click();

  await expect(page.getByTestId("sp-textarea")).toHaveValue(
    "persistent system prompt",
    { timeout: 10_000 },
  );
  await expect(page.getByTestId("seed-textarea")).toHaveValue(
    "persistent seed prompt",
  );
});
