import { log } from "./logger";
import { estimateMessagesTokens, estimateTokens } from "./tokens";

export const PER_SLOT_CTX = 2048;
export const REPLY_BUDGET = 1024;
export const SAFETY = 64;
export const INPUT_BUDGET = PER_SLOT_CTX - REPLY_BUDGET - SAFETY;

export function computeReplyBudget(
  perSlotCtx: number,
  override?: number | null,
): number {
  const slot = Number.isFinite(perSlotCtx) && perSlotCtx > 0 ? perSlotCtx : PER_SLOT_CTX;
  if (override && override > 0) return Math.min(override, slot - SAFETY);
  return Math.min(REPLY_BUDGET, Math.floor(slot * 0.5));
}

export function computeInputBudget(
  perSlotCtx: number,
  replyBudgetOverride?: number | null,
): number {
  const slot = Number.isFinite(perSlotCtx) && perSlotCtx > 0 ? perSlotCtx : PER_SLOT_CTX;
  const reply = computeReplyBudget(slot, replyBudgetOverride);
  return Math.max(64, slot - reply - SAFETY);
}

export function effectiveMaxTokens(
  replyBudget: number,
  perSlotCtx: number,
  usedInputTokens: number,
): number {
  const available = perSlotCtx - usedInputTokens - SAFETY;
  return Math.max(1, Math.min(replyBudget, available));
}

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface BuildOptions {
  inputBudget?: number;
  systemPrompt?: string;
  seedPrompt?: string;
  summary?: string;
  summaryBudgetPct?: number;
}

export interface BuildResult {
  messages: ChatMessage[];
  truncated: boolean;
  droppedCount: number;
  droppedMessages: ChatMessage[];
}

export function buildRequestMessages(
  history: ChatMessage[],
  options: BuildOptions = {},
): BuildResult {
  const budget = options.inputBudget ?? INPUT_BUDGET;
  const systemPrompt = options.systemPrompt?.trim();
  const seedPrompt = options.seedPrompt?.trim();
  const summary = options.summary?.trim();
  const summaryBudgetPct = options.summaryBudgetPct ?? 25;
  const summaryBudgetTokens = Math.floor(
    (budget * summaryBudgetPct) / 100,
  );

  const systemMsg: ChatMessage | null = systemPrompt
    ? { role: "system", content: systemPrompt }
    : null;
  const systemCost = systemMsg ? estimateTokens(systemMsg.content) + 4 : 0;

  // Summary: truncated to fit within the summary budget.
  let effectiveSummary = "";
  let summaryCost = 0;
  if (summary) {
    const rawCost = estimateTokens(summary);
    if (rawCost <= summaryBudgetTokens) {
      effectiveSummary = summary;
      summaryCost = rawCost;
    } else {
      effectiveSummary = summary.slice(0, summaryBudgetTokens * 4);
      summaryCost = summaryBudgetTokens;
    }
  }

  // Seed + summary: both prepended to first user message content.
  // This avoids breaking chat templates that require strict role alternation.
  let seedAugmentedFirst: ChatMessage | null = null;
  let seedCost = 0;
  if (history.length > 0 && history[0].role === "user") {
    let prefix = "";
    if (seedPrompt) prefix += seedPrompt;
    if (effectiveSummary) {
      if (prefix) prefix += "\n\n";
      prefix += `[Story so far]: ${effectiveSummary}`;
    }
    if (prefix) {
      seedAugmentedFirst = {
        role: "user",
        content: prefix + "\n\n" + history[0].content,
      };
    }
    seedCost = seedAugmentedFirst
      ? estimateTokens(seedAugmentedFirst.content) + 4
      : estimateTokens(history[0].content) + 4;
  }

  const fixedCost = systemCost + seedCost + 2;
  const remaining = budget - fixedCost;

  log.info(`buildRequestMessages: budget=${budget} fixed=${fixedCost} remaining=${remaining} history=${history.length} seed=${!!seedPrompt} summary=${!!summary} summaryLen=${summary?.length ?? 0}`);

  if (history.length === 0) {
    const msgs: ChatMessage[] = [];
    if (systemMsg) msgs.push(systemMsg);
    return { messages: msgs, truncated: false, droppedCount: 0, droppedMessages: [] };
  }

  // Walk history (excluding index 0 if seed-augmented) newest→oldest.
  const startIdx = seedAugmentedFirst ? 1 : 0;
  const kept: ChatMessage[] = [];
  const dropped: ChatMessage[] = [];
  let used = 0;

  for (let i = history.length - 1; i >= startIdx; i--) {
    const cost = estimateTokens(history[i].content) + 4;
    if (used + cost <= remaining) {
      kept.push({ role: history[i].role, content: history[i].content });
      used += cost;
    } else {
      dropped.push({ role: history[i].role, content: history[i].content });
    }
  }

  kept.reverse();
  dropped.reverse();
  const truncated = dropped.length > 0;

  // Assemble final message array.
  const messages: ChatMessage[] = [];
  if (systemMsg) messages.push(systemMsg);

  // Include seed-augmented first message only if it won't break alternation.
  // If the first kept message is also a user message, skip the seed to avoid
  // consecutive same-role messages (which crash Mistral-style templates).
  const firstKeptRole = kept.length > 0 ? kept[0].role : null;
  if (seedAugmentedFirst) {
    if (!firstKeptRole || firstKeptRole === "assistant") {
      messages.push(seedAugmentedFirst);
    } else {
      // Can't include seed as standalone — embed seed+summary into the
      // first kept user message instead.
      kept[0] = {
        role: kept[0].role,
        content: seedAugmentedFirst.content + "\n\n" + kept[0].content,
      };
    }
  } else if (history.length > 0) {
    if (!firstKeptRole || firstKeptRole !== history[0].role) {
      messages.push({ role: history[0].role, content: history[0].content });
    }
  }
  messages.push(...kept);

  log.info(`buildRequestMessages: kept=${kept.length} dropped=${dropped.length} truncated=${truncated} finalMsgCount=${messages.length}`);
  if (truncated) {
    log.info(`buildRequestMessages: dropped roles=[${dropped.map(m => m.role).join(",")}]`);
  }

  // Final alternation validation: drop messages that would create
  // consecutive same-role entries (defensive, shouldn't trigger normally).
  for (let i = messages.length - 1; i > 0; i--) {
    if (
      messages[i].role === messages[i - 1].role &&
      messages[i].role !== "system"
    ) {
      messages.splice(i, 1);
    }
  }

  return {
    messages,
    truncated,
    droppedCount: dropped.length,
    droppedMessages: dropped,
  };
}

export function totalTokenEstimate(messages: ChatMessage[]): number {
  return estimateMessagesTokens(messages);
}

export interface ContextPreview {
  inputBudget: number;
  usedTokens: number;
  usedPercent: number;
  recentStartIndex: number;
  droppedCount: number;
  truncated: boolean;
  summaryTokens: number;
}

export function previewContext(
  history: { role: ChatRole; content: string }[],
  draft: string,
  opts: {
    inputBudget: number;
    systemPrompt?: string;
    seedPrompt?: string;
    summary?: string;
    summaryBudgetPct?: number;
  },
): ContextPreview {
  const systemCost = opts.systemPrompt
    ? estimateTokens(opts.systemPrompt) + 4
    : 0;
  const draftCost = draft ? estimateTokens(draft) + 4 : 0;
  const summaryBudgetPct = opts.summaryBudgetPct ?? 25;
  const summaryBudgetTokens = Math.floor(
    (opts.inputBudget * summaryBudgetPct) / 100,
  );
  const summaryTokens = opts.summary
    ? Math.min(estimateTokens(opts.summary), summaryBudgetTokens)
    : 0;

  // Build the combined first-message content (seed + summary + first user msg)
  const hasFirstUser = history.length > 0 && history[0].role === "user";
  let firstMsgContent = hasFirstUser ? history[0].content : "";
  if (opts.seedPrompt && hasFirstUser) {
    firstMsgContent = opts.seedPrompt + "\n\n" + firstMsgContent;
  }
  if (opts.summary && hasFirstUser) {
    const effectiveSummary =
      estimateTokens(opts.summary) <= summaryBudgetTokens
        ? opts.summary
        : opts.summary.slice(0, summaryBudgetTokens * 4);
    const sep = opts.seedPrompt ? "\n\n" : "";
    firstMsgContent = firstMsgContent.replace(
      history[0].content,
      `${sep}[Story so far]: ${effectiveSummary}\n\n${history[0].content}`,
    );
    if (!opts.seedPrompt) {
      firstMsgContent = `[Story so far]: ${effectiveSummary}\n\n${history[0].content}`;
    }
  }
  const seedCost = hasFirstUser
    ? estimateTokens(firstMsgContent) + 4
    : 0;

  const fixedCost = systemCost + seedCost + draftCost + 2;
  const remaining = opts.inputBudget - fixedCost;

  const startIdx = hasFirstUser ? 1 : 0;
  let used = 0;
  let droppedCount = 0;
  let recentStartIndex = history.length;

  for (let i = history.length - 1; i >= startIdx; i--) {
    const cost = estimateTokens(history[i].content) + 4;
    if (used + cost <= remaining) {
      used += cost;
      recentStartIndex = i;
    } else {
      droppedCount++;
    }
  }

  const usedTokens = fixedCost + used;
  const usedPercent = Math.min(
    100,
    Math.round((usedTokens / opts.inputBudget) * 100),
  );

  return {
    inputBudget: opts.inputBudget,
    usedTokens,
    usedPercent,
    recentStartIndex,
    droppedCount,
    truncated: droppedCount > 0,
    summaryTokens,
  };
}
