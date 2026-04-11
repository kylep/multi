import { test, expect, Route } from "@playwright/test";
import { mockModelsEndpoint, mockPropsEndpoint } from "./_helpers";

test("stop button aborts an in-flight request and keeps partial text", async ({
  page,
}) => {
  await mockModelsEndpoint(page);
  await mockPropsEndpoint(page);
  await page.route("**/v1/chat/completions", async (route: Route) => {
    // Never fulfill — the composer should abort this request, which
    // cancels the request in the browser.
    await new Promise((r) => setTimeout(r, 15_000));
    try {
      await route.fulfill({ status: 200, body: "data: [DONE]\n\n" });
    } catch {
      /* ignore when aborted */
    }
  });

  await page.goto("/");
  await page.getByTestId("new-chat-btn").click();
  await page.getByTestId("composer-input").fill("write a poem");
  await page.getByTestId("composer-input").press("Enter");

  const stop = page.getByTestId("composer-stop");
  await expect(stop).toBeVisible();
  await stop.click();

  await expect(page.getByTestId("composer-send")).toBeVisible();
  await expect(page.getByTestId("msg-user").last()).toContainText(
    "write a poem",
  );
});
