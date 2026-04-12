import { estimateMessagesTokens, estimateTokens } from "./tokens";

export const PER_SLOT_CTX = 2048;
export const REPLY_BUDGET = 512;
export const SAFETY = 64;
export const INPUT_BUDGET = PER_SLOT_CTX - REPLY_BUDGET - SAFETY;

export function computeInputBudget(perSlotCtx: number): number {
  return Math.max(64, perSlotCtx - REPLY_BUDGET - SAFETY);
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

  // Seed: prepended to first user message, always kept.
  let seedAugmentedFirst: ChatMessage | null = null;
  let seedCost = 0;
  if (seedPrompt && history.length > 0 && history[0].role === "user") {
    seedAugmentedFirst = {
      role: "user",
      content: seedPrompt + "\n\n" + history[0].content,
    };
    seedCost = estimateTokens(seedAugmentedFirst.content) + 4;
  }

  // Summary: injected after system/seed, before recent messages.
  let summaryMsg: ChatMessage | null = null;
  let summaryCost = 0;
  if (summary) {
    const rawCost = estimateTokens(summary) + 4;
    summaryCost = Math.min(rawCost, summaryBudgetTokens);
    const content =
      rawCost > summaryBudgetTokens
        ? summary.slice(0, summaryBudgetTokens * 4)
        : summary;
    summaryMsg = {
      role: "system",
      content: `[Story so far]: ${content}`,
    };
  }

  const fixedCost = systemCost + seedCost + summaryCost + 2;
  const remaining = budget - fixedCost;

  if (history.length === 0) {
    const msgs: ChatMessage[] = [];
    if (systemMsg) msgs.push(systemMsg);
    if (summaryMsg) msgs.push(summaryMsg);
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
  if (seedAugmentedFirst) messages.push(seedAugmentedFirst);
  if (summaryMsg) messages.push(summaryMsg);
  messages.push(...kept);

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
  const hasSeed =
    !!opts.seedPrompt && history.length > 0 && history[0].role === "user";
  const seedCost = hasSeed
    ? estimateTokens(opts.seedPrompt + "\n\n" + history[0].content) + 4
    : 0;

  const summaryBudgetPct = opts.summaryBudgetPct ?? 25;
  const summaryBudgetTokens = Math.floor(
    (opts.inputBudget * summaryBudgetPct) / 100,
  );
  const summaryTokens = opts.summary
    ? Math.min(estimateTokens(opts.summary) + 4, summaryBudgetTokens)
    : 0;

  const fixedCost = systemCost + seedCost + summaryTokens + draftCost + 2;
  const remaining = opts.inputBudget - fixedCost;

  const startIdx = hasSeed ? 1 : 0;
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
