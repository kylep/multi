import type { ChatMessage } from "./context-manager";
import { apiHeaders, apiModel } from "./api-headers";
import { log } from "./logger";
import { estimateTokens } from "./tokens";

function summarizePrompt(tokenBudget: number): string {
  return (
    `Summarize the following conversation excerpt as thoroughly as possible. ` +
    `Use up to ${tokenBudget} tokens — fill the budget. ` +
    `Preserve ALL key facts, character names, items, locations, decisions, relationships, and the current situation. ` +
    `Include details that might matter later. ` +
    `Write in third person, past tense. Do not add anything that wasn't in the conversation.`
  );
}

function extendPrompt(tokenBudget: number): string {
  return (
    `You have an existing summary of an earlier conversation, followed by new ` +
    `conversation that needs to be folded in. Produce an updated summary that ` +
    `covers everything — use up to ${tokenBudget} tokens, fill the budget. ` +
    `Preserve ALL key facts, character names, items, locations, decisions, relationships, ` +
    `and the current situation. Include details that might matter later. ` +
    `Write in third person, past tense.`
  );
}

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
        headers: apiHeaders(),
        body: JSON.stringify({
          model: apiModel(),
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
    log.exchange("exchange:compaction", {
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      response: content,
      responseLength: content?.length ?? 0,
      endpoint,
      maxTokens,
      temperature: 0.3,
    });
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

  const maxTokens = opts.maxTokens ?? 200;

  const excerpt = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const hasExisting = !!opts.existingSummary?.trim();
  const systemContent = hasExisting
    ? extendPrompt(maxTokens)
    : summarizePrompt(maxTokens);
  const userContent = hasExisting
    ? `## Existing summary\n${opts.existingSummary}\n\n## New conversation to fold in\n${excerpt}`
    : excerpt;

  log.info(`summarize: ${messages.length} messages, existing=${!!opts.existingSummary}, maxTokens=${maxTokens}, tokenBudget=${opts.tokenBudget ?? "none"}`);
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
