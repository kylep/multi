import { test, expect } from "@playwright/test";
import { mockChatCompletions } from "./_helpers";

test("sidebar lists chats, supports selection and delete", async ({ page }) => {
  await mockChatCompletions(page, { tokens: ["done"] });
  await page.goto("/");

  await page.getByTestId("new-chat-btn").click();
  await page.getByTestId("composer-input").fill("alpha");
  await page.getByTestId("composer-input").press("Enter");
  await expect(page.getByTestId("msg-assistant").last()).toContainText("done");

  await page.getByTestId("new-chat-btn").click();
  await page.getByTestId("composer-input").fill("beta");
  await page.getByTestId("composer-input").press("Enter");
  await expect(page.getByTestId("msg-assistant").last()).toContainText("done");

  const sidebar = page.getByRole("navigation", { name: "Chat history" });
  await expect(sidebar).toContainText("alpha");
  await expect(sidebar).toContainText("beta");

  await sidebar.getByText("alpha").click();
  await expect(page.getByTestId("msg-user").last()).toContainText("alpha");

  // Delete via the inline delete button (visible on hover)
  const alphaRow = sidebar.getByText("alpha").locator("xpath=..");
  await alphaRow.hover();
  await alphaRow.getByTestId("chat-delete-btn").click();
  await expect(sidebar).not.toContainText("alpha");
});
