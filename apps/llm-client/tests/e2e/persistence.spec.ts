import { test, expect } from "@playwright/test";
import { mockChatCompletions } from "./_helpers";

test("chats persist across reload via localStorage", async ({ page }) => {
  await mockChatCompletions(page, { tokens: ["ok"] });

  await page.goto("/");

  await page.getByTestId("new-chat-btn").click();
  await page.getByTestId("composer-input").fill("first chat message");
  await page.getByTestId("composer-input").press("Enter");
  await expect(page.getByTestId("msg-assistant").last()).toContainText("ok");

  await page.getByTestId("new-chat-btn").click();
  await page.getByTestId("composer-input").fill("second chat message");
  await page.getByTestId("composer-input").press("Enter");
  await expect(page.getByTestId("msg-assistant").last()).toContainText("ok");

  await page.reload();

  const sidebar = page.getByRole("navigation", { name: "Chat history" });
  await expect(sidebar.getByText("first chat message")).toBeVisible();
  await expect(sidebar.getByText("second chat message")).toBeVisible();
});
