import { test, expect, Route } from "@playwright/test";
import { mockChatCompletions } from "./_helpers";

test("blocks app with endpoint dialog when server is unreachable", async ({
  page,
}) => {
  await page.route("**/v1/models", async (route: Route) => {
    await route.fulfill({ status: 500, body: "down" });
  });

  await page.goto("/");

  await expect(page.getByTestId("gate-blocked")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Can't reach your llama-server/ }),
  ).toBeVisible();
});

test("clicking the sidebar endpoint label opens the dialog and saves a new address", async ({
  page,
}) => {
  await mockChatCompletions(page, { tokens: ["ok"] });
  await page.goto("/");

  await page.getByTestId("endpoint-open").click();
  const input = page.getByTestId("endpoint-input");
  await input.fill("http://127.0.0.1:9999");
  await page.getByTestId("endpoint-verify").click();
  await expect(page.getByTestId("probe-status")).toContainText("Reachable");

  // Metadata card from /v1/models meta + /props
  const card = page.getByTestId("server-info-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("8.0B");          // n_params 8e9
  await expect(card).toContainText("4,096");         // n_ctx
  await expect(card).toContainText("2,048");         // per-slot = 4096 / 2
  await expect(card).toContainText("32,768");        // n_ctx_train

  await page.getByTestId("endpoint-save").click();
  await expect(page.getByTestId("endpoint-open")).toContainText("127.0.0.1:9999");
});
