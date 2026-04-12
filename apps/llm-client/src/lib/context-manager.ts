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
  pinned?: boolean;
}

export interface BuildOptions {
  inputBudget?: number;
  systemPrompt?: string;
  seedPrompt?: string;
}

export interface BuildResult {
  messages: ChatMessage[];
  truncated: boolean;
  droppedCount: number;
}

export function buildRequestMessages(
  history: ChatMessage[],
  options: BuildOptions = {},
): BuildResult {
  const budget = options.inputBudget ?? INPUT_BUDGET;
  const systemPrompt = options.systemPrompt?.trim();
  const seedPrompt = options.seedPrompt?.trim();

  const systemMsg: ChatMessage | null = systemPrompt
    ? { role: "system", content: systemPrompt }
    : null;
  const systemCost = systemMsg ? estimateTokens(systemMsg.content) + 4 : 0;

  // Seed prompt: prepended to the first user message's content.
  // The first message (with seed) is always pinned — never truncated.
  let historyWithSeed = history;
  if (seedPrompt && history.length > 0 && history[0].role === "user") {
    historyWithSeed = [
      {
        ...history[0],
        content: seedPrompt + "\n\n" + history[0].content,
        pinned: true,
      },
      ...history.slice(1),
    ];
  }

  // Separate pinned vs unpinned. Pinned messages are always included.
  const pinnedCost = historyWithSeed
    .filter((m) => m.pinned)
    .reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);

  const remaining = budget - systemCost - pinnedCost - 2;

  if (historyWithSeed.length === 0) {
    return {
      messages: systemMsg ? [systemMsg] : [],
      truncated: false,
      droppedCount: 0,
    };
  }

  // Walk unpinned messages newest→oldest, fitting into remaining budget.
  const keptIndices = new Set<number>();
  // Always keep pinned indices.
  for (let i = 0; i < historyWithSeed.length; i++) {
    if (historyWithSeed[i].pinned) keptIndices.add(i);
  }

  let used = 0;
  let dropped = 0;
  for (let i = historyWithSeed.length - 1; i >= 0; i--) {
    if (keptIndices.has(i)) continue;
    const cost = estimateTokens(historyWithSeed[i].content) + 4;
    if (used + cost <= remaining) {
      keptIndices.add(i);
      used += cost;
    } else {
      dropped++;
    }
  }

  // Build final ordered list preserving original order.
  const kept: ChatMessage[] = [];
  for (let i = 0; i < historyWithSeed.length; i++) {
    if (keptIndices.has(i)) {
      kept.push({
        role: historyWithSeed[i].role,
        content: historyWithSeed[i].content,
      });
    }
  }

  const truncated = dropped > 0;

  if (kept.length === 0 && historyWithSeed.length > 0) {
    const newest = historyWithSeed[historyWithSeed.length - 1];
    const charBudget = Math.max(0, (budget - systemCost - 4 - 2) * 4);
    const truncatedContent =
      newest.content.length > charBudget
        ? newest.content.slice(newest.content.length - charBudget)
        : newest.content;
    kept.push({ role: newest.role, content: truncatedContent });
  }

  const messages = systemMsg ? [systemMsg, ...kept] : kept;
  return { messages, truncated, droppedCount: dropped };
}

export function totalTokenEstimate(messages: ChatMessage[]): number {
  return estimateMessagesTokens(messages);
}

export interface ContextPreview {
  inputBudget: number;
  usedTokens: number;
  usedPercent: number;
  firstKeptIndex: number;
  droppedCount: number;
  truncated: boolean;
  keptSet: Set<number>;
}

export function previewContext(
  history: { role: ChatRole; content: string; pinned?: boolean }[],
  draft: string,
  opts: {
    inputBudget: number;
    systemPrompt?: string;
    seedPrompt?: string;
  },
): ContextPreview {
  const systemCost = opts.systemPrompt
    ? estimateTokens(opts.systemPrompt) + 4
    : 0;
  const draftCost = draft ? estimateTokens(draft) + 4 : 0;
  const hasSeed =
    !!opts.seedPrompt && history.length > 0 && history[0].role === "user";

  // Compute pinned cost. Index 0 is implicitly pinned when there's a seed.
  // Use the seed-augmented content for token estimation.
  const pinnedIndices = new Set<number>();
  let pinnedCost = 0;
  for (let i = 0; i < history.length; i++) {
    const isPinned = history[i].pinned || (i === 0 && hasSeed);
    if (isPinned) {
      pinnedIndices.add(i);
      const content =
        i === 0 && hasSeed
          ? opts.seedPrompt + "\n\n" + history[i].content
          : history[i].content;
      pinnedCost += estimateTokens(content) + 4;
    }
  }

  const remaining =
    opts.inputBudget - systemCost - draftCost - pinnedCost - 2;

  // Indices use the original history array, so the UI can map directly.
  const keptSet = new Set(pinnedIndices);
  let used = 0;
  let droppedCount = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (keptSet.has(i)) continue;
    const cost = estimateTokens(history[i].content) + 4;
    if (used + cost <= remaining) {
      keptSet.add(i);
      used += cost;
    } else {
      droppedCount++;
    }
  }

  const usedTokens = systemCost + draftCost + pinnedCost + used + 2;
  const usedPercent = Math.min(
    100,
    Math.round((usedTokens / opts.inputBudget) * 100),
  );

  let firstKeptIndex = history.length;
  for (let i = 0; i < history.length; i++) {
    if (keptSet.has(i)) {
      firstKeptIndex = i;
      break;
    }
  }

  return {
    inputBudget: opts.inputBudget,
    usedTokens,
    usedPercent,
    firstKeptIndex,
    droppedCount,
    truncated: droppedCount > 0,
    keptSet,
  };
}
