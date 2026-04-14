import { afterEach, describe, expect, it, vi } from "vitest";
import { streamChat, LlamaClientError } from "./llama-client";

function mockSSEResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: { "content-type": "text/event-stream" },
  });
}

function dataEvent(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function delta(content: string) {
  return { choices: [{ delta: { content }, index: 0 }] };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("streamChat", () => {
  it("yields deltas in order and stops on [DONE]", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockSSEResponse([
        dataEvent(delta("Hel")),
        dataEvent(delta("lo ")),
        dataEvent(delta("world")),
        "data: [DONE]\n\n",
        dataEvent(delta("SHOULD NOT APPEAR")),
      ]),
    );

    const controller = new AbortController();
    const out: string[] = [];
    for await (const token of streamChat({
      messages: [{ role: "user", content: "hi" }],
      signal: controller.signal,
      maxTokens: 128,
    })) {
      out.push(token);
    }
    expect(out.join("")).toBe("Hello world");
  });

  it("ignores malformed JSON data lines", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockSSEResponse([
        "data: {broken json\n\n",
        dataEvent(delta("ok")),
        "data: [DONE]\n\n",
      ]),
    );
    const out: string[] = [];
    for await (const tok of streamChat({
      messages: [{ role: "user", content: "hi" }],
      signal: new AbortController().signal,
      maxTokens: 16,
    })) {
      out.push(tok);
    }
    expect(out.join("")).toBe("ok");
  });

  it("handles events split across chunks", async () => {
    const payload = dataEvent(delta("hello"));
    const mid = Math.floor(payload.length / 2);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockSSEResponse([
        payload.slice(0, mid),
        payload.slice(mid),
        "data: [DONE]\n\n",
      ]),
    );
    const out: string[] = [];
    for await (const tok of streamChat({
      messages: [{ role: "user", content: "hi" }],
      signal: new AbortController().signal,
      maxTokens: 16,
    })) {
      out.push(tok);
    }
    expect(out.join("")).toBe("hello");
  });

  it("throws LlamaClientError on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("kaboom", { status: 500 }),
    );
    await expect(async () => {
      for await (const _ of streamChat({
        messages: [{ role: "user", content: "hi" }],
        signal: new AbortController().signal,
        maxTokens: 16,
      })) {
        // drain
      }
    }).rejects.toBeInstanceOf(LlamaClientError);
  });

  it("passes AbortSignal to fetch", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(mockSSEResponse(["data: [DONE]\n\n"]));
    const controller = new AbortController();
    const gen = streamChat({
      messages: [{ role: "user", content: "hi" }],
      signal: controller.signal,
      maxTokens: 16,
    });
    await gen.next();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/v1/chat/completions"),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
