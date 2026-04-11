import { test, expect } from "@playwright/test";
import { mockChatCompletions } from "./_helpers";

test("new chat → send → assistant bubble appears with streamed text", async ({
  page,
}) => {
  await mockChatCompletions(page, {
    tokens: ["Hel", "lo ", "there!"],
  });

  await page.goto("/");
  await page.getByTestId("new-chat-btn").click();

  const composer = page.getByTestId("composer-input");
  await composer.fill("Say hi");
  await composer.press("Enter");

  const bot = page.getByTestId("msg-assistant").last();
  await expect(bot).toContainText("Hello there!", { timeout: 10_000 });
  await expect(page.getByTestId("msg-user").last()).toContainText("Say hi");
});
