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
}

export interface BuildResult {
  messages: ChatMessage[];
  truncated: boolean;
  droppedCount: number;
  droppedMessages: ChatMessage[];
}

const COLOR_TAG_RE = /\{[a-z]\}|\{\/[a-z]\}/g;

function stripColorTags(text: string): string {
  return text.replace(COLOR_TAG_RE, "");
}

export function buildRequestMessages(
  history: ChatMessage[],
  options: BuildOptions = {},
): BuildResult {
  // Strip color tags from history so the model doesn't learn to output them.
  history = history.map((m) => ({
    role: m.role,
    content: stripColorTags(m.content),
  }));
  const budget = options.inputBudget ?? INPUT_BUDGET;
  const systemPrompt = options.systemPrompt?.trim();
  const seedPrompt = options.seedPrompt?.trim();
  const summary = options.summary?.trim();

  const systemMsg: ChatMessage | null = systemPrompt
    ? { role: "system", content: systemPrompt }
    : null;
  const systemCost = systemMsg ? estimateTokens(systemMsg.content) + 4 : 0;

  // Summary is trusted at face value from the summarizer, but we still
  // clamp to half the input budget as a hard safety net — if an upstream
  // bug produced a runaway summary we don't want to blow past ctx.
  const summaryCap = Math.max(128, Math.floor(budget * 0.5));
  let effectiveSummary = summary ?? "";
  if (effectiveSummary && estimateTokens(effectiveSummary) > summaryCap) {
    const before = estimateTokens(effectiveSummary);
    effectiveSummary = effectiveSummary.slice(0, summaryCap * 4);
    log.warn(
      `buildRequestMessages: summary over cap (${before} > ${summaryCap}), truncating`,
    );
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

export interface CompactionPlan {
  messagesToCompact: ChatMessage[];
  /** Inclusive index of the last message that should be removed from history
   *  after the summary is written. -1 when nothing is compacted. Caller should
   *  splice history[1..compactThroughIndex] out of the chat. */
  compactThroughIndex: number;
  summaryTokenBudget: number;
  targetTokens: number;
  currentUsedTokens: number;
  estimatedUsedAfter: number;
}

export interface CompactionPlanOptions {
  inputBudget: number;
  systemPrompt?: string;
  seedPrompt?: string;
  existingSummary?: string;
}

/**
 * Plan compaction: target tokens = current-used / 2. Picks oldest
 * non-anchored messages to fold into the story-so-far so the rebuilt
 * request lands near the target. Summary gets up to half of the target
 * room; the rest is reserved for the most recent messages.
 */
export function planCompaction(
  history: ChatMessage[],
  options: CompactionPlanOptions,
): CompactionPlan {
  const { inputBudget, systemPrompt, seedPrompt, existingSummary } = options;

  const systemCost = systemPrompt?.trim()
    ? estimateTokens(systemPrompt) + 4
    : 0;
  const firstUser =
    history.length > 0 && history[0].role === "user" ? history[0] : null;
  const summaryTrimmed = existingSummary?.trim() ?? "";
  const seedTrimmed = seedPrompt?.trim() ?? "";

  // Anchor = system + (seed + firstUser content), no summary. This is the
  // floor that every request — pre- or post-compaction — carries.
  const firstAnchorContent =
    (seedTrimmed ? seedTrimmed + "\n\n" : "") + (firstUser?.content ?? "");
  const firstUserAnchorCost = firstUser
    ? estimateTokens(firstAnchorContent) + 4
    : 0;
  const baseFixedAnchor = systemCost + firstUserAnchorCost + 2;

  // The existing summary (if any) is currently embedded in the first user
  // message. Account for it so currentUsedTokens matches the real request
  // size, but do NOT use it when sizing the NEW summary + kept messages —
  // the new summary replaces the old one.
  const existingSummaryCost = summaryTrimmed
    ? estimateTokens(`[Story so far]: ${summaryTrimmed}\n\n`)
    : 0;

  let recentCost = 0;
  for (let i = 1; i < history.length; i++) {
    recentCost += estimateTokens(history[i].content) + 4;
  }
  const currentUsedTokens = Math.min(
    inputBudget,
    baseFixedAnchor + existingSummaryCost + recentCost,
  );

  // Target: half of current usage, floored so we leave at least 128 tokens
  // for something other than the anchor.
  const targetTokens = Math.max(
    baseFixedAnchor + 128,
    Math.floor(currentUsedTokens / 2),
  );

  // Split the post-compaction room evenly between the new summary and
  // recent kept messages.
  const targetRoom = Math.max(0, targetTokens - baseFixedAnchor);
  const summaryTokenBudget = Math.max(64, Math.floor(targetRoom * 0.5));
  const recentBudget = Math.max(0, targetRoom - summaryTokenBudget);

  // Find the contiguous newest-suffix that fits recentBudget. Walk forward
  // from the end; stop when adding one more message would overflow.
  const startIdx = firstUser ? 1 : 0;
  let suffixStart = history.length;
  let suffixUsed = 0;
  for (let i = history.length - 1; i >= startIdx; i--) {
    const cost = estimateTokens(history[i].content) + 4;
    if (suffixUsed + cost > recentBudget) break;
    suffixUsed += cost;
    suffixStart = i;
  }

  // The compacted block is history[startIdx..suffixStart - 1]. Its length
  // must be even to preserve role alternation after removal (msg 0 is user;
  // each user+assistant pair we drop keeps alternation intact). If odd,
  // spare the newest-of-compact by bumping suffixStart up by one.
  let compactLength = suffixStart - startIdx;
  if (compactLength % 2 === 1) {
    const spared = history[suffixStart - 1];
    suffixStart -= 1;
    compactLength -= 1;
    if (spared) {
      suffixUsed += estimateTokens(spared.content) + 4;
    }
  }

  const messagesToCompact = history.slice(startIdx, suffixStart);
  const compactThroughIndex =
    compactLength === 0 ? -1 : suffixStart - 1;
  const estimatedUsedAfter =
    baseFixedAnchor + summaryTokenBudget + suffixUsed;

  log.info(
    `planCompaction: currentUsed=${currentUsedTokens} target=${targetTokens} anchor=${baseFixedAnchor} existingSummary=${existingSummaryCost} summaryBudget=${summaryTokenBudget} recentBudget=${recentBudget} toCompact=${messagesToCompact.length} compactThroughIdx=${compactThroughIndex} kept=${history.length - suffixStart} estAfter=${estimatedUsedAfter}`,
  );

  return {
    messagesToCompact,
    compactThroughIndex,
    summaryTokenBudget,
    targetTokens,
    currentUsedTokens,
    estimatedUsedAfter,
  };
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
  },
): ContextPreview {
  const systemCost = opts.systemPrompt
    ? estimateTokens(opts.systemPrompt) + 4
    : 0;
  const draftCost = draft ? estimateTokens(draft) + 4 : 0;
  const summaryTokens = opts.summary ? estimateTokens(opts.summary) : 0;

  // Build the combined first-message content (seed + summary + first user msg)
  const hasFirstUser = history.length > 0 && history[0].role === "user";
  let firstMsgContent = hasFirstUser ? history[0].content : "";
  if (opts.seedPrompt && hasFirstUser) {
    firstMsgContent = opts.seedPrompt + "\n\n" + firstMsgContent;
  }
  if (opts.summary && hasFirstUser) {
    const sep = opts.seedPrompt ? "\n\n" : "";
    firstMsgContent = firstMsgContent.replace(
      history[0].content,
      `${sep}[Story so far]: ${opts.summary}\n\n${history[0].content}`,
    );
    if (!opts.seedPrompt) {
      firstMsgContent = `[Story so far]: ${opts.summary}\n\n${history[0].content}`;
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
