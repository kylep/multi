import { describe, expect, it } from "vitest";
import {
  type ChatMessage,
  buildRequestMessages,
  computeInputBudget,
  INPUT_BUDGET,
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
