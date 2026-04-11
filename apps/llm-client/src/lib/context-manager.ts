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

  const systemMsg: ChatMessage | null = systemPrompt
    ? { role: "system", content: systemPrompt }
    : null;
  const systemCost = systemMsg ? estimateTokens(systemMsg.content) + 4 : 0;
  const remaining = budget - systemCost - 2;

  if (history.length === 0) {
    return {
      messages: systemMsg ? [systemMsg] : [],
      truncated: false,
      droppedCount: 0,
    };
  }

  const kept: ChatMessage[] = [];
  let used = 0;
  let dropped = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const cost = estimateTokens(msg.content) + 4;
    if (used + cost <= remaining) {
      kept.push(msg);
      used += cost;
    } else {
      dropped = i + 1;
      break;
    }
  }

  kept.reverse();
  let truncated = dropped > 0;

  if (kept.length === 0 && history.length > 0) {
    const newest = history[history.length - 1];
    const charBudget = Math.max(0, (remaining - 4) * 4);
    const truncatedContent =
      newest.content.length > charBudget
        ? newest.content.slice(newest.content.length - charBudget)
        : newest.content;
    kept.push({ role: newest.role, content: truncatedContent });
    dropped = history.length - 1;
    truncated = true;
  }

  const messages = systemMsg ? [systemMsg, ...kept] : kept;
  return { messages, truncated, droppedCount: dropped };
}

export function totalTokenEstimate(messages: ChatMessage[]): number {
  return estimateMessagesTokens(messages);
}
