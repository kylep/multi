import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServerInfo } from "@/lib/verify-endpoint";

export const DEFAULT_ENDPOINT = "http://127.0.0.1:8080";

export interface SettingsStore {
  endpoint: string;
  serverInfo: ServerInfo | null;
  setEndpoint(next: string): void;
  setServerInfo(info: ServerInfo | null): void;
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
      setEndpoint(next) {
        set({ endpoint: normalizeEndpoint(next) });
      },
      setServerInfo(info) {
        set({ serverInfo: info });
      },
    }),
    {
      name: "llm-client/settings/v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { normalizeEndpoint };
