import { test, expect } from "@playwright/test";
import { mockChatCompletions } from "./_helpers";

test("context manager drops oldest messages when over budget", async ({
  page,
}) => {
  let captured: { messages?: { role: string; content: string }[] } | undefined;
  await mockChatCompletions(page, {
    tokens: ["ok"],
    captureRequest: (body) => {
      captured = body as typeof captured;
    },
  });

  // Seed 20 long messages into localStorage before the page runs.
  await page.addInitScript(() => {
    const now = Date.now();
    const id = "seeded-chat";
    const longContent = "x".repeat(2000);
    const messages = [];
    for (let i = 0; i < 20; i++) {
      messages.push({
        id: `m-${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `msg ${i} ${longContent}`,
        createdAt: now + i,
      });
    }
    const state = {
      state: {
        chats: {
          [id]: {
            id,
            title: "seeded",
            messages,
            createdAt: now,
            updatedAt: now + 100,
          },
        },
        chatOrder: [id],
        activeChatId: id,
      },
      version: 0,
    };
    localStorage.setItem("llm-client/chat-store/v1", JSON.stringify(state));
  });

  await page.goto("/");
  await page.getByTestId("composer-input").fill("final question");
  await page.getByTestId("composer-input").press("Enter");
  await expect(page.getByTestId("msg-assistant").last()).toContainText("ok");

  expect(captured?.messages).toBeDefined();
  const sent = captured!.messages!;
  expect(sent.length).toBeLessThan(21);
  expect(sent[sent.length - 1].content).toBe("final question");
});
