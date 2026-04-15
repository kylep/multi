import { useSettingsStore } from "@/store/settings-store";

/** Build headers for LLM API calls, adding auth if an API key is configured. */
export function apiHeaders(): Record<string, string> {
  const apiKey = useSettingsStore.getState().apiKey;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}

/** Get the configured model ID, falling back to "local-model". */
export function apiModel(): string {
  return useSettingsStore.getState().modelId || "local-model";
}
