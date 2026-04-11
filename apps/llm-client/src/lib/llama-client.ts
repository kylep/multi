import type { ChatMessage } from "./context-manager";

export const DEFAULT_ENDPOINT = "http://127.0.0.1:8080";
export const DEFAULT_MODEL = "local-model";

export interface StreamChatOptions {
  endpoint?: string;
  model?: string;
  messages: ChatMessage[];
  signal: AbortSignal;
  maxTokens: number;
  temperature?: number;
}

export class LlamaClientError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "LlamaClientError";
    this.status = status;
  }
}

export async function* streamChat(
  options: StreamChatOptions,
): AsyncGenerator<string> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const url = `${endpoint.replace(/\/$/, "")}/v1/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages: options.messages,
      stream: true,
      max_tokens: options.maxTokens,
      temperature: options.temperature ?? 0.7,
    }),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new LlamaClientError(
      `llama-server ${res.status}: ${text.slice(0, 200)}`,
      res.status,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex = buffer.indexOf("\n\n");
      while (sepIndex !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        sepIndex = buffer.indexOf("\n\n");

        for (const line of rawEvent.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "" || data === "[DONE]") {
            if (data === "[DONE]") return;
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta: string | undefined =
              parsed?.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // Ignore malformed JSON chunks.
          }
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

export async function fetchAvailableModel(
  endpoint: string = DEFAULT_ENDPOINT,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${endpoint.replace(/\/$/, "")}/v1/models`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const id: string | undefined = json?.data?.[0]?.id;
    return id ?? null;
  } catch {
    return null;
  }
}
