import { Page, Route } from "@playwright/test";

export async function mockModelsEndpoint(page: Page) {
  await page.route("**/v1/models", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "test-model",
            object: "model",
            created: 0,
            meta: {
              n_ctx_train: 32768,
              n_params: 8_000_000_000,
              size: 4 * 1024 ** 3,
            },
          },
        ],
      }),
    });
  });
}

export async function mockPropsEndpoint(
  page: Page,
  opts: { nCtx?: number; totalSlots?: number } = {},
) {
  await page.route("**/props", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        model_alias: "test-model",
        model_path: "/tmp/test.gguf",
        total_slots: opts.totalSlots ?? 2,
        modalities: { vision: false, audio: false },
        default_generation_settings: { n_ctx: opts.nCtx ?? 4096 },
      }),
    });
  });
}

function sseData(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function delta(content: string) {
  return {
    id: "test",
    object: "chat.completion.chunk",
    created: 0,
    model: "test",
    choices: [{ index: 0, delta: { content } }],
  };
}

export async function mockChatCompletions(
  page: Page,
  opts: {
    tokens?: string[];
    interChunkDelayMs?: number;
    captureRequest?: (body: unknown) => void;
  } = {},
) {
  await mockModelsEndpoint(page);
  await mockPropsEndpoint(page);
  const tokens = opts.tokens ?? ["Hello", " ", "world", "!"];
  const delay = opts.interChunkDelayMs ?? 30;

  await page.route("**/v1/chat/completions", async (route: Route) => {
    const req = route.request();
    if (opts.captureRequest) {
      try {
        const body = req.postDataJSON();
        opts.captureRequest(body);
      } catch {
        /* ignore */
      }
    }

    const chunks: string[] = [];
    for (const t of tokens) chunks.push(sseData(delta(t)));
    chunks.push("data: [DONE]\n\n");

    // Build a single combined body; Playwright doesn't expose streaming
    // fulfillment, so tokens arrive as one network event. The component
    // parser still yields them sequentially; timing is simulated via a
    // small initial delay for "streaming-looking" effect.
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      headers: {
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
      body: chunks.join(""),
    });
  });
}
