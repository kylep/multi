import { describe, expect, it } from "vitest";
import {
  type ChatMessage,
  buildRequestMessages,
  computeInputBudget,
  computeReplyBudget,
  effectiveMaxTokens,
  INPUT_BUDGET,
  PER_SLOT_CTX,
  planCompaction,
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
  it("embeds summary in first user message content", () => {
    const history = makeHistory(4);
    const result = buildRequestMessages(history, {
      summary: "Player met Lyra.",
      inputBudget: 10000,
    });
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content).toContain("[Story so far]");
    expect(result.messages[0].content).toContain("Player met Lyra.");
  });

  it("places seed + summary together in first user message", () => {
    const history = makeHistory(4);
    const result = buildRequestMessages(history, {
      seedPrompt: "SEED",
      summary: "Summary here.",
      inputBudget: 10000,
    });
    const first = result.messages[0];
    expect(first.role).toBe("user");
    expect(first.content).toContain("SEED");
    expect(first.content).toContain("[Story so far]: Summary here.");
    expect(first.content).toContain("message 0");
  });
});

describe("computeReplyBudget", () => {
  it("caps at 1024 for large contexts", () => {
    expect(computeReplyBudget(4096)).toBe(1024);
    expect(computeReplyBudget(8192)).toBe(1024);
  });

  it("scales to 50% for small contexts", () => {
    expect(computeReplyBudget(600)).toBe(300);
    expect(computeReplyBudget(400)).toBe(200);
  });

  it("respects override", () => {
    expect(computeReplyBudget(8192, 2000)).toBe(2000);
  });

  it("clamps override to perSlot - safety", () => {
    expect(computeReplyBudget(1000, 5000)).toBe(1000 - SAFETY);
  });
});

describe("computeInputBudget", () => {
  it("subtracts scaled reply budget and safety from per-slot context", () => {
    // 8192: reply=min(1024, 4096)=1024, input=8192-1024-64=7104
    expect(computeInputBudget(8192)).toBe(8192 - REPLY_BUDGET - SAFETY);
  });

  it("uses proportional reply budget for small contexts", () => {
    // 600: reply=300, safety=64, input=236
    expect(computeInputBudget(600)).toBe(600 - 300 - SAFETY);
  });

  it("falls back to default for non-positive slots", () => {
    expect(computeInputBudget(0)).toBe(PER_SLOT_CTX - REPLY_BUDGET - SAFETY);
    expect(computeInputBudget(-1)).toBe(PER_SLOT_CTX - REPLY_BUDGET - SAFETY);
  });

  it("floors at 64 for very small positive slots", () => {
    expect(computeInputBudget(100)).toBe(64);
  });
});

describe("effectiveMaxTokens", () => {
  it("returns reply budget when plenty of room", () => {
    expect(effectiveMaxTokens(1024, 8192, 2000)).toBe(1024);
  });

  it("caps to available space when context is mostly used", () => {
    // 8192 slot, 7000 used, safety 64 → available = 1128
    expect(effectiveMaxTokens(4096, 8192, 7000)).toBe(1128);
  });

  it("returns at least 1 even when over budget", () => {
    expect(effectiveMaxTokens(1024, 8192, 9000)).toBe(1);
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

});

describe("planCompaction", () => {
  it("targets half of current usage", () => {
    const history = makeHistory(30, (i) => `msg ${i} ` + "x".repeat(200));
    const plan = planCompaction(history, { inputBudget: 10000 });
    // target should be ~= currentUsedTokens / 2
    expect(plan.targetTokens).toBeGreaterThan(0);
    expect(plan.targetTokens).toBeLessThanOrEqual(plan.currentUsedTokens);
    expect(Math.abs(plan.targetTokens - Math.floor(plan.currentUsedTokens / 2))).toBeLessThanOrEqual(200);
  });

  it("compacts oldest non-anchored messages, leaves recent ones kept", () => {
    const history = makeHistory(30, (i) => `msg ${i} ` + "x".repeat(200));
    const plan = planCompaction(history, { inputBudget: 10000 });
    expect(plan.messagesToCompact.length).toBeGreaterThan(0);
    // First compacted item is the earliest non-anchor, i.e. index 1.
    expect(plan.messagesToCompact[0].content).toContain("msg 1");
    // First user message (anchor) is never compacted.
    for (const m of plan.messagesToCompact) {
      expect(m.content).not.toBe(history[0].content);
    }
  });

  it("no-ops when there is nothing older than the anchor to compact", () => {
    const history = makeHistory(1);
    const plan = planCompaction(history, { inputBudget: 10000 });
    expect(plan.messagesToCompact).toHaveLength(0);
  });

  it("summary token budget is at least 64", () => {
    const history = makeHistory(4);
    const plan = planCompaction(history, { inputBudget: 200 });
    expect(plan.summaryTokenBudget).toBeGreaterThanOrEqual(64);
  });

  it("estimated usage after compaction is ≤ target", () => {
    const history = makeHistory(40, (i) => `msg ${i} ` + "x".repeat(100));
    const plan = planCompaction(history, { inputBudget: 8000 });
    expect(plan.estimatedUsedAfter).toBeLessThanOrEqual(plan.targetTokens + 8);
  });

  it("returns a compactThroughIndex and compacts an even number of messages", () => {
    const history = makeHistory(30, (i) => `msg ${i} ` + "x".repeat(150));
    const plan = planCompaction(history, { inputBudget: 3000 });
    expect(plan.messagesToCompact.length % 2).toBe(0);
    expect(plan.compactThroughIndex).toBe(plan.messagesToCompact.length);
  });

  it("removing the compacted block + applying summary actually shrinks the request", () => {
    // 20 chunky messages simulating a chat near 80% of the input budget.
    const history = makeHistory(20, (i) => `msg ${i} ` + "x".repeat(200));
    const before = buildRequestMessages(history, { inputBudget: 10000 });
    const beforeTokens = estimateMessagesJoined(before.messages);

    const plan = planCompaction(history, { inputBudget: 10000 });
    expect(plan.messagesToCompact.length).toBeGreaterThan(0);

    // Simulate what runCompaction does: drop history[1..compactThroughIndex],
    // then build with a summary that fits the summarizer's budget.
    const remaining = [
      history[0],
      ...history.slice(plan.compactThroughIndex + 1),
    ];
    const summary = "x".repeat(plan.summaryTokenBudget * 3); // ~0.75 of budget
    const after = buildRequestMessages(remaining, {
      inputBudget: 10000,
      summary,
    });
    const afterTokens = estimateMessagesJoined(after.messages);

    expect(afterTokens).toBeLessThan(beforeTokens);
  });
});

function estimateMessagesJoined(messages: ChatMessage[]): number {
  // Rough token count matching the in-app heuristic (chars/4).
  const joined = messages.map((m) => m.content).join("");
  return Math.ceil(joined.length / 4);
}
