import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_COLORIZE_PROMPT } from "@/lib/colorize-pass";
import type { ServerInfo } from "@/lib/verify-endpoint";

export const DEFAULT_ENDPOINT = "http://127.0.0.1:8080";

export type PromptSource = "none" | "text" | "file";

export interface SettingsStore {
  endpoint: string;
  serverInfo: ServerInfo | null;
  systemPrompt: string;
  systemPromptSource: PromptSource;
  systemPromptFilename: string | null;
  seedPrompt: string;
  seedPromptSource: PromptSource;
  seedPromptFilename: string | null;
  contextOverride: number | null;
  replyBudgetOverride: number | null;
  autoSummarize: boolean;
  summaryBudgetPct: number;
  deduplicateRetry: boolean;
  temperature: number;
  colorSupport: boolean;
  colorPrompt: string;
  minReplyTokens: number;
  extractChoices: boolean;
  setEndpoint(next: string): void;
  setServerInfo(info: ServerInfo | null): void;
  setSystemPrompt(
    source: PromptSource,
    text: string,
    filename?: string | null,
  ): void;
  setSeedPrompt(
    source: PromptSource,
    text: string,
    filename?: string | null,
  ): void;
  setContextOverride(next: number | null): void;
  setReplyBudgetOverride(next: number | null): void;
  setAutoSummarize(v: boolean): void;
  setSummaryBudgetPct(v: number): void;
  setDeduplicateRetry(v: boolean): void;
  setTemperature(v: number): void;
  setColorSupport(v: boolean): void;
  setColorPrompt(v: string): void;
  setMinReplyTokens(v: number): void;
  setExtractChoices(v: boolean): void;
}

function normalizeEndpoint(raw: string): string {
  let value = raw.trim();
  if (!value) return value;
  if (!/^https?:\/\//i.test(value)) value = `http://${value}`;
  return value.replace(/\/+$/, "");
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      endpoint: DEFAULT_ENDPOINT,
      serverInfo: null,
      systemPrompt: "",
      systemPromptSource: "none",
      systemPromptFilename: null,
      seedPrompt: "",
      seedPromptSource: "none",
      seedPromptFilename: null,
      contextOverride: null,
      replyBudgetOverride: null,
      autoSummarize: true,
      summaryBudgetPct: 25,
      deduplicateRetry: true,
      temperature: 0.7,
      colorSupport: true,
      colorPrompt: DEFAULT_COLORIZE_PROMPT,
      minReplyTokens: 500,
      extractChoices: true,
      setEndpoint(next) {
        set({ endpoint: normalizeEndpoint(next) });
      },
      setServerInfo(info) {
        set({ serverInfo: info });
      },
      setSystemPrompt(source, text, filename) {
        set({
          systemPromptSource: source,
          systemPrompt: text,
          systemPromptFilename: filename ?? null,
        });
      },
      setSeedPrompt(source, text, filename) {
        set({
          seedPromptSource: source,
          seedPrompt: text,
          seedPromptFilename: filename ?? null,
        });
      },
      setContextOverride(next) {
        set({
          contextOverride:
            next === null || Number.isNaN(next) ? null : Math.max(1, next),
        });
      },
      setReplyBudgetOverride(next) {
        set({
          replyBudgetOverride:
            next === null || Number.isNaN(next) ? null : Math.max(1, next),
        });
      },
      setAutoSummarize(v) {
        set({ autoSummarize: v });
      },
      setSummaryBudgetPct(v) {
        set({ summaryBudgetPct: Math.max(5, Math.min(50, v)) });
      },
      setDeduplicateRetry(v) {
        set({ deduplicateRetry: v });
      },
      setTemperature(v) {
        set({ temperature: Math.max(0, Math.min(2, v)) });
      },
      setColorSupport(v) {
        set({ colorSupport: v });
      },
      setColorPrompt(v) {
        set({ colorPrompt: v });
      },
      setMinReplyTokens(v) {
        set({ minReplyTokens: Math.max(1, v) });
      },
      setExtractChoices(v) {
        set({ extractChoices: v });
      },
    }),
    {
      name: "llm-client/settings/v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { normalizeEndpoint };
