import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
    }),
    {
      name: "llm-client/settings/v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { normalizeEndpoint };
