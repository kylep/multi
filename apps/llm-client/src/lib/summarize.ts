import type { ChatMessage } from "./context-manager";

const SUMMARIZE_PROMPT =
  "Summarize the following conversation excerpt in 2-3 concise sentences. " +
  "Preserve key facts, character names, decisions, and current situation. " +
  "Write in third person, past tense. Do not add anything that wasn't in the conversation.";

const EXTEND_PROMPT =
  "You have an existing summary of an earlier conversation, followed by new " +
  "conversation that needs to be folded in. Produce an updated summary that " +
  "covers everything — keep it to 3-5 concise sentences. Preserve key facts, " +
  "character names, decisions, and the current situation. Write in third " +
  "person, past tense.";

export async function summarizeMessages(
  messages: ChatMessage[],
  opts: {
    endpoint: string;
    existingSummary?: string;
    maxTokens?: number;
  },
): Promise<string | null> {
  if (messages.length === 0 && !opts.existingSummary) return null;

  const excerpt = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const hasExisting = !!opts.existingSummary?.trim();
  const systemContent = hasExisting ? EXTEND_PROMPT : SUMMARIZE_PROMPT;
  const userContent = hasExisting
    ? `## Existing summary\n${opts.existingSummary}\n\n## New conversation to fold in\n${excerpt}`
    : excerpt;

  try {
    const res = await fetch(
      `${opts.endpoint.replace(/\/+$/, "")}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent },
          ],
          max_tokens: opts.maxTokens ?? 200,
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
