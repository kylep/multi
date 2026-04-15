import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_CHOICE_PROMPT } from "@/lib/generate-choices";
import { DEFAULT_COLOR_COLORS, type ColorConfig } from "@/lib/colors";
import type { ServerInfo } from "@/lib/verify-endpoint";

export const DEFAULT_ENDPOINT = "http://127.0.0.1:8080";
export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api";

export type PromptSource = "none" | "text" | "file";
export type ServerType = "local" | "openrouter";

export interface SettingsStore {
  serverType: ServerType;
  endpoint: string;
  apiKey: string;
  modelId: string;
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
  colorColors: Record<string, ColorConfig>;
  minReplyTokens: number;
  choiceButtons: boolean;
  choicePrompt: string;
  choiceCount: number;
  disableTextInput: boolean;
  setServerType(v: ServerType): void;
  setEndpoint(next: string): void;
  setApiKey(v: string): void;
  setModelId(v: string): void;
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
  setColorColors(v: Record<string, ColorConfig>): void;
  setMinReplyTokens(v: number): void;
  setChoiceButtons(v: boolean): void;
  setChoicePrompt(v: string): void;
  setChoiceCount(v: number): void;
  setDisableTextInput(v: boolean): void;
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
      serverType: "local" as ServerType,
      endpoint: DEFAULT_ENDPOINT,
      apiKey: "",
      modelId: "",
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
      colorSupport: false,
      colorColors: DEFAULT_COLOR_COLORS,
      minReplyTokens: 500,
      choiceButtons: false,
      choicePrompt: DEFAULT_CHOICE_PROMPT,
      choiceCount: 3,
      disableTextInput: false,
      setServerType(v) {
        set({ serverType: v });
      },
      setEndpoint(next) {
        set({ endpoint: normalizeEndpoint(next) });
      },
      setApiKey(v) {
        set({ apiKey: v });
      },
      setModelId(v) {
        set({ modelId: v });
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
      setColorColors(v) {
        set({ colorColors: v });
      },
      setMinReplyTokens(v) {
        set({ minReplyTokens: Math.max(1, v) });
      },
      setChoiceButtons(v) {
        set({ choiceButtons: v });
      },
      setChoicePrompt(v) {
        set({ choicePrompt: v });
      },
      setChoiceCount(v) {
        set({ choiceCount: Math.max(1, Math.min(6, v)) });
      },
      setDisableTextInput(v) {
        set({ disableTextInput: v });
      },
    }),
    {
      name: "llm-client/settings/v1",
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | null;
        if (p) {
          // Remove stale keys from older versions
          delete p.colorPrompt;
          delete p.extractChoices;
        }
        return {
          ...current,
          ...(p as Partial<SettingsStore>),
        };
      },
    },
  ),
);

export { normalizeEndpoint };
