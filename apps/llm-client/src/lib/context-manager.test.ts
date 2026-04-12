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
    expect(result.messages).toEqual(history);
    expect(result.truncated).toBe(false);
    expect(result.droppedCount).toBe(0);
  });

  it("drops oldest messages first when over budget", () => {
    const history = makeHistory(50, (i) => `msg ${i} ` + "x".repeat(400));
    const result = buildRequestMessages(history);
    expect(result.messages.length).toBeLessThan(history.length);
    expect(result.truncated).toBe(true);
    expect(result.droppedCount).toBeGreaterThan(0);
    const last = result.messages[result.messages.length - 1];
    expect(last.content.startsWith("msg 49")).toBe(true);
  });

  it("preserves chronological order after truncation", () => {
    const history = makeHistory(20, (i) => `msg ${i} ` + "x".repeat(400));
    const result = buildRequestMessages(history);
    for (let i = 1; i < result.messages.length; i++) {
      const prevNum = parseInt(
        result.messages[i - 1].content.match(/msg (\d+)/)?.[1] ?? "-1",
        10,
      );
      const curNum = parseInt(
        result.messages[i].content.match(/msg (\d+)/)?.[1] ?? "-1",
        10,
      );
      expect(curNum).toBeGreaterThan(prevNum);
    }
  });

  it("tail-truncates a single oversized message", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "X".repeat(INPUT_BUDGET * 10) },
    ];
    const result = buildRequestMessages(history);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content.length).toBeLessThan(
      history[0].content.length,
    );
    expect(result.truncated).toBe(true);
  });

  it("always retains system prompt even when truncating", () => {
    const history = makeHistory(30, (i) => `msg ${i} ` + "x".repeat(400));
    const result = buildRequestMessages(history, {
      systemPrompt: "keep me",
    });
    expect(result.messages[0]).toEqual({ role: "system", content: "keep me" });
    expect(result.truncated).toBe(true);
  });

  it("respects a custom input budget override", () => {
    const history = makeHistory(10);
    const tiny = buildRequestMessages(history, { inputBudget: 50 });
    const big = buildRequestMessages(history, { inputBudget: 10000 });
    expect(tiny.messages.length).toBeLessThan(big.messages.length);
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
    expect(preview.firstKeptIndex).toBe(0);
    expect(preview.droppedCount).toBe(0);
    expect(preview.truncated).toBe(false);
    expect(preview.usedPercent).toBeLessThan(5);
  });

  it("drops oldest messages and advances firstKeptIndex under tight budget", () => {
    const history = makeHistory(20, (i) => `m ${i} ` + "x".repeat(400));
    const preview = previewContext(history, "new", { inputBudget: 1000 });
    expect(preview.firstKeptIndex).toBeGreaterThan(0);
    expect(preview.droppedCount).toBeGreaterThan(0);
    expect(preview.truncated).toBe(true);
  });

  it("counts system prompt + draft against the budget", () => {
    const history = makeHistory(5, (i) => `msg ${i}`);
    const withoutPrompt = previewContext(history, "hi", {
      inputBudget: 10000,
    });
    const withPrompt = previewContext(history, "hi", {
      inputBudget: 10000,
      systemPrompt: "x".repeat(400),
    });
    expect(withPrompt.usedTokens).toBeGreaterThan(withoutPrompt.usedTokens);
  });

  it("caps usedPercent at 100", () => {
    const history = makeHistory(10, (i) => `m ${i} ` + "x".repeat(1000));
    const preview = previewContext(history, "a".repeat(5000), {
      inputBudget: 100,
    });
    expect(preview.usedPercent).toBeLessThanOrEqual(100);
  });

  it("pins index 0 implicitly when seedPrompt is provided", () => {
    const history = makeHistory(10, (i) => `m ${i} ` + "x".repeat(300));
    const preview = previewContext(history, "", {
      inputBudget: 500,
      seedPrompt: "x".repeat(200),
    });
    expect(preview.truncated).toBe(true);
    expect(preview.keptSet.has(0)).toBe(true);
  });

  it("keeps explicitly pinned messages even when over budget", () => {
    const history = makeHistory(10, (i) => `m ${i} ` + "x".repeat(300));
    history[5].pinned = true;
    const preview = previewContext(history, "", { inputBudget: 500 });
    expect(preview.truncated).toBe(true);
    expect(preview.keptSet.has(5)).toBe(true);
  });

  it("keptSet indices map to original history array", () => {
    const history = makeHistory(5, (i) => `m ${i}`);
    const preview = previewContext(history, "", {
      inputBudget: 10000,
      seedPrompt: "seed",
    });
    // All should be kept with a large budget
    for (let i = 0; i < 5; i++) {
      expect(preview.keptSet.has(i)).toBe(true);
    }
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
    expect(result.droppedCount).toBeGreaterThan(0);
  });

  it("keeps explicitly pinned messages during truncation", () => {
    const history = makeHistory(20, (i) => `m ${i} ` + "x".repeat(200));
    history[3].pinned = true;
    const result = buildRequestMessages(history, { inputBudget: 500 });
    const contents = result.messages.map((m) => m.content);
    expect(contents.some((c) => c.includes("m 3"))).toBe(true);
  });
});
