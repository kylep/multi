import { log } from "./logger";
import type { ChatMessage } from "./context-manager";

export const DEFAULT_CHOICE_PROMPT =
  "Generate a unique option the player could take next. One short sentence only.";

export interface GeneratedChoice {
  number: number;
  text: string;
}

/**
 * Generate N choices in parallel by making independent LLM calls.
 * Each call sees the conversation context + any already-generated choices
 * to encourage uniqueness.
 */
export async function generateChoices(
  context: ChatMessage[],
  opts: {
    endpoint: string;
    count: number;
    prompt: string;
    tempOffset?: number;
  },
): Promise<GeneratedChoice[]> {
  const { endpoint, count, prompt, tempOffset = 0 } = opts;
  const url = `${endpoint.replace(/\/+$/, "")}/v1/chat/completions`;

  // Build a compact context summary: system + last few messages
  const recentMessages = context.slice(-6);

  const results: GeneratedChoice[] = [];

  for (let i = 0; i < count; i++) {
    const alreadyGenerated =
      results.length > 0
        ? `\n\nAlready generated options (do NOT repeat these):\n${results.map((r) => `- ${r.text}`).join("\n")}`
        : "";

    const messages: ChatMessage[] = [
      ...recentMessages,
      {
        role: "user",
        content: `${prompt}${alreadyGenerated}\n\nRespond with ONLY the option text, nothing else. No numbering, no prefix.`,
      },
    ];

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages,
          max_tokens: 60,
          temperature: Math.min(2, 0.9 + i * 0.1 + tempOffset),
          stream: false,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        log.warn(`generateChoices: call ${i + 1} failed with ${res.status}`);
        continue;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) {
        // Strip numbering prefix and wrapping quotes the model might add
        const cleaned = text
          .replace(/^\d+[.)]\s*/, "")
          .replace(/^["']|["']$/g, "")
          .trim();
        if (cleaned) {
          results.push({ number: i + 1, text: cleaned });
        }
      }

      log.exchange(`exchange:choice-${i + 1}`, {
        messages,
        response: text ?? null,
        endpoint,
        temperature: Math.min(2, 0.9 + i * 0.1 + tempOffset),
      });
    } catch (err) {
      log.warn(`generateChoices: call ${i + 1} error: ${(err as Error).message}`);
    }
  }

  // Re-number sequentially
  return results.map((r, idx) => ({ ...r, number: idx + 1 }));
}
