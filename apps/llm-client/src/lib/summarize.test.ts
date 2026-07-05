import { afterEach, describe, expect, it, vi } from "vitest";
import { summarizeMessages } from "./summarize";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("summarizeMessages", () => {
  it("returns null for empty messages", async () => {
    expect(
      await summarizeMessages([], { endpoint: "http://localhost:8080" }),
    ).toBeNull();
  });

  it("sends dropped messages to /v1/chat/completions and returns content", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Player explored the cave." } }],
        }),
        { status: 200 },
      ),
    );
    const result = await summarizeMessages(
      [
        { role: "user", content: "I go into the cave" },
        { role: "assistant", content: "You enter a dark cave." },
      ],
      { endpoint: "http://localhost:8080" },
    );
    expect(result).toBe("Player explored the cave.");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("uses low temperature for deterministic summaries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "sum" } }] }),
        { status: 200 },
      ),
    );
    await summarizeMessages(
      [{ role: "user", content: "test" }],
      { endpoint: "http://localhost:8080" },
    );
    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.temperature).toBe(0.3);
    expect(body.stream).toBe(false);
  });

  it("returns null on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
    const result = await summarizeMessages(
      [{ role: "user", content: "test" }],
      { endpoint: "http://localhost:8080" },
    );
    expect(result).toBeNull();
  });

  it("returns null on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("error", { status: 500 }),
    );
    const result = await summarizeMessages(
      [{ role: "user", content: "test" }],
      { endpoint: "http://localhost:8080" },
    );
    expect(result).toBeNull();
  });
});
