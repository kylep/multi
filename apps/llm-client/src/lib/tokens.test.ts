import { describe, expect, it } from "vitest";
import { estimateMessagesTokens, estimateTokens } from "./tokens";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("grows monotonically with input length", () => {
    const a = estimateTokens("hello");
    const b = estimateTokens("hello world");
    const c = estimateTokens("hello world, how are you today?");
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThanOrEqual(c);
  });

  it("handles unicode without throwing", () => {
    expect(() => estimateTokens("🦙🦙🦙 café naïve")).not.toThrow();
    expect(estimateTokens("🦙🦙🦙 café naïve")).toBeGreaterThan(0);
  });

  it("is roughly chars/4 within ±25% for plain ascii", () => {
    const text = "The quick brown fox jumps over the lazy dog.".repeat(20);
    const estimate = estimateTokens(text);
    const expected = text.length / 4;
    const ratio = estimate / expected;
    expect(ratio).toBeGreaterThan(0.75);
    expect(ratio).toBeLessThan(1.25);
  });
});

describe("estimateMessagesTokens", () => {
  it("returns small non-zero overhead for empty messages array", () => {
    expect(estimateMessagesTokens([])).toBe(2);
  });

  it("accounts for per-message overhead", () => {
    const single = estimateMessagesTokens([{ role: "user", content: "hi" }]);
    const raw = estimateTokens("hi");
    expect(single).toBeGreaterThan(raw);
  });
});
