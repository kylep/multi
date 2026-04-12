import type { ChatMessage } from "./context-manager";

const SUMMARIZE_PROMPT =
  "Summarize the following conversation excerpt in 2-3 concise sentences. " +
  "Preserve key facts, character names, decisions, and current situation. " +
  "Write in third person, past tense. Do not add anything that wasn't in the conversation.";

export async function summarizeMessages(
  messages: ChatMessage[],
  opts: { endpoint: string; maxTokens?: number },
): Promise<string | null> {
  if (messages.length === 0) return null;

  const excerpt = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  try {
    const res = await fetch(
      `${opts.endpoint.replace(/\/+$/, "")}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SUMMARIZE_PROMPT },
            { role: "user", content: excerpt },
          ],
          max_tokens: opts.maxTokens ?? 150,
          temperature: 0.3,
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
