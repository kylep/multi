import type { ChatMessage } from "./context-manager";
import { log } from "./logger";
import { estimateTokens } from "./tokens";

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

const SHORTEN_PROMPT =
  "Shorten the following summary to fit within the specified token budget. " +
  "Keep the most important facts, drop less critical details. " +
  "Write in third person, past tense.";

const MAX_RETRIES = 2;

async function callModel(
  endpoint: string,
  systemContent: string,
  userContent: string,
  maxTokens: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${endpoint.replace(/\/+$/, "")}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemContent },
            { role: "user", content: userContent },
          ],
          max_tokens: maxTokens,
          temperature: 0.3,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000),
      },
    );
    if (!res.ok) {
      log.warn(`summarize: server returned ${res.status}`);
      return null;
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? null;
    if (!content) log.warn("summarize: model returned empty content");
    return content;
  } catch (err) {
    log.warn(`summarize: ${(err as Error)?.message ?? "unknown error"}`);
    return null;
  }
}

export async function summarizeMessages(
  messages: ChatMessage[],
  opts: {
    endpoint: string;
    existingSummary?: string;
    maxTokens?: number;
    tokenBudget?: number;
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

  log.info(`summarize: ${messages.length} messages, existing=${!!opts.existingSummary}, maxTokens=${opts.maxTokens ?? 200}, tokenBudget=${opts.tokenBudget ?? "none"}`);

  const maxTokens = opts.maxTokens ?? 200;
  let result = await callModel(
    opts.endpoint,
    systemContent,
    userContent,
    maxTokens,
  );
  if (!result) {
    log.warn("summarize: model returned null");
    return null;
  }

  log.info(`summarize: got ${result.length} chars (~${estimateTokens(result)} tokens)`);

  // If a token budget is specified, check and retry if overshot.
  if (opts.tokenBudget && opts.tokenBudget > 0) {
    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      const tokens = estimateTokens(result);
      if (tokens <= opts.tokenBudget) break;
      log.info(`summarize: overshot budget (${tokens}/${opts.tokenBudget}), retry ${retry + 1}`);

      const shortened = await callModel(
        opts.endpoint,
        SHORTEN_PROMPT,
        `Token budget: ${opts.tokenBudget} tokens.\n\nSummary to shorten:\n${result}`,
        Math.floor(opts.tokenBudget * 0.9),
      );
      if (!shortened) break;
      result = shortened;
    }
  }

  return result;
}
