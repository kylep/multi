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

  await sidebar
    .getByText("alpha")
    .locator("xpath=..")
    .getByLabel("Chat actions")
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await expect(sidebar).not.toContainText("alpha");
});
