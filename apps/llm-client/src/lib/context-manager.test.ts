import { describe, expect, it } from "vitest";
import {
  type ChatMessage,
  buildRequestMessages,
  computeInputBudget,
  INPUT_BUDGET,
  previewContext,
  REPLY_BUDGET,
  SAFETY,
} from "./context-manager";

function makeHistory(
  count: number,
  contentFactory: (i: number) => string = (i) => `message ${i}`,
): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      role: i % 2 === 0 ? "user" : "assistant",
      content: contentFactory(i),
    });
  }
  return out;
}

describe("buildRequestMessages", () => {
  it("returns empty messages when history is empty and no system prompt", () => {
    const result = buildRequestMessages([]);
    expect(result.messages).toEqual([]);
    expect(result.truncated).toBe(false);
    expect(result.droppedCount).toBe(0);
  });

  it("includes system prompt when provided", () => {
    const result = buildRequestMessages([], { systemPrompt: "you are nice" });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual({
      role: "system",
      content: "you are nice",
    });
  });

  it("returns full history when it fits in budget", () => {
    const history = makeHistory(4);
    const result = buildRequestMessages(history);
    expect(result.truncated).toBe(false);
    expect(result.droppedCount).toBe(0);
  });

  it("drops oldest messages first when over budget", () => {
    const history = makeHistory(50, (i) => `msg ${i} ` + "x".repeat(400));
    const result = buildRequestMessages(history);
    expect(result.messages.length).toBeLessThan(history.length);
    expect(result.truncated).toBe(true);
    expect(result.droppedCount).toBeGreaterThan(0);
  });

  it("returns dropped messages for summarization", () => {
    const history = makeHistory(20, (i) => `msg ${i} ` + "x".repeat(400));
    const result = buildRequestMessages(history, { inputBudget: 1000 });
    expect(result.droppedMessages.length).toBe(result.droppedCount);
    expect(result.droppedMessages.length).toBeGreaterThan(0);
  });

  it("respects a custom input budget override", () => {
    const history = makeHistory(10);
    const tiny = buildRequestMessages(history, { inputBudget: 50 });
    const big = buildRequestMessages(history, { inputBudget: 10000 });
    expect(tiny.messages.length).toBeLessThan(big.messages.length);
  });
});

describe("buildRequestMessages with seedPrompt", () => {
  it("prepends seed to first user message content", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ];
    const result = buildRequestMessages(history, {
      seedPrompt: "SEED",
      inputBudget: 10000,
    });
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content).toBe("SEED\n\nhello");
  });

  it("always keeps the seed-augmented first message even under tight budget", () => {
    const history = makeHistory(20, (i) => `m ${i} ` + "x".repeat(200));
    const result = buildRequestMessages(history, {
      seedPrompt: "SEED_PROMPT",
      inputBudget: 500,
    });
    expect(result.messages[0].content).toContain("SEED_PROMPT");
    expect(result.truncated).toBe(true);
  });
});

describe("buildRequestMessages with summary", () => {
  it("injects summary as system message", () => {
    const history = makeHistory(4);
    const result = buildRequestMessages(history, {
      summary: "Player met Lyra.",
      inputBudget: 10000,
    });
    const summaryMsg = result.messages.find((m) =>
      m.content.includes("[Story so far]"),
    );
    expect(summaryMsg).toBeDefined();
    expect(summaryMsg!.content).toContain("Player met Lyra.");
  });

  it("places summary after seed, before recent messages", () => {
    const history = makeHistory(4);
    const result = buildRequestMessages(history, {
      seedPrompt: "SEED",
      summary: "Summary here.",
      inputBudget: 10000,
    });
    expect(result.messages[0].content).toContain("SEED");
    expect(result.messages[1].content).toContain("[Story so far]");
    expect(result.messages[2].role).toBe("assistant");
  });
});

describe("computeInputBudget", () => {
  it("subtracts reply budget and safety from per-slot context", () => {
    expect(computeInputBudget(2048)).toBe(2048 - REPLY_BUDGET - SAFETY);
    expect(computeInputBudget(8192)).toBe(8192 - REPLY_BUDGET - SAFETY);
  });

  it("floors at 64 for absurdly small slots", () => {
    expect(computeInputBudget(0)).toBe(64);
    expect(computeInputBudget(100)).toBe(64);
  });
});

describe("previewContext", () => {
  it("keeps every message and reports low usage for small history", () => {
    const history = makeHistory(3);
    const preview = previewContext(history, "hi", { inputBudget: 10000 });
    expect(preview.droppedCount).toBe(0);
    expect(preview.truncated).toBe(false);
    expect(preview.usedPercent).toBeLessThan(5);
  });

  it("drops oldest messages under tight budget", () => {
    const history = makeHistory(20, (i) => `m ${i} ` + "x".repeat(400));
    const preview = previewContext(history, "new", { inputBudget: 1000 });
    expect(preview.droppedCount).toBeGreaterThan(0);
    expect(preview.truncated).toBe(true);
  });

  it("counts summary tokens against the budget", () => {
    const history = makeHistory(5, (i) => `msg ${i}`);
    const withoutSummary = previewContext(history, "", {
      inputBudget: 10000,
    });
    const withSummary = previewContext(history, "", {
      inputBudget: 10000,
      summary: "x".repeat(400),
    });
    expect(withSummary.usedTokens).toBeGreaterThan(
      withoutSummary.usedTokens,
    );
    expect(withSummary.summaryTokens).toBeGreaterThan(0);
  });

  it("caps usedPercent at 100", () => {
    const history = makeHistory(10, (i) => `m ${i} ` + "x".repeat(1000));
    const preview = previewContext(history, "a".repeat(5000), {
      inputBudget: 100,
    });
    expect(preview.usedPercent).toBeLessThanOrEqual(100);
  });

  it("respects summaryBudgetPct cap", () => {
    const history = makeHistory(3);
    const preview = previewContext(history, "", {
      inputBudget: 1000,
      summary: "x".repeat(4000),
      summaryBudgetPct: 10,
    });
    expect(preview.summaryTokens).toBeLessThanOrEqual(100 + 4);
  });
});
