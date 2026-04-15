export interface ServerInfo {
  endpoint: string;
  modelId: string;
  // From /v1/models meta (optional)
  nCtxTrain?: number;
  nParams?: number;
  sizeBytes?: number;
  // From /props (llama-server only, optional)
  nCtx?: number;
  totalSlots?: number;
  modelAlias?: string;
  modelPath?: string;
  modalities?: { vision?: boolean; audio?: boolean };
  probedProps: boolean;
}

export interface VerifyResult {
  ok: boolean;
  endpoint: string;
  info?: ServerInfo;
  error?: string;
}

import { log } from "./logger";

const PROPS_TIMEOUT = 3000;

export async function verifyEndpoint(
  rawEndpoint: string,
  timeoutMs = 5000,
  apiKey?: string,
): Promise<VerifyResult> {
  const endpoint = rawEndpoint.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(endpoint)) {
    return {
      ok: false,
      endpoint,
      error: "Must start with http:// or https://",
    };
  }

  const modelsController = new AbortController();
  const modelsTimer = setTimeout(() => modelsController.abort(), timeoutMs);

  let modelsJson:
    | {
        data?: Array<{
          id?: string;
          meta?: {
            n_ctx_train?: number;
            n_params?: number;
            size?: number;
          };
        }>;
        models?: Array<{ id?: string }>;
      }
    | undefined;

  try {
    const headers: Record<string, string> = { accept: "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const res = await fetch(`${endpoint}/v1/models`, {
      method: "GET",
      signal: modelsController.signal,
      headers,
    });
    if (!res.ok) {
      return {
        ok: false,
        endpoint,
        error: `Server responded with HTTP ${res.status}`,
      };
    }
    modelsJson = await res.json();
  } catch (err) {
    const isAbort =
      (err as Error)?.name === "AbortError" || modelsController.signal.aborted;
    return {
      ok: false,
      endpoint,
      error: isAbort
        ? `Timed out after ${timeoutMs}ms`
        : ((err as Error)?.message ?? "Network error"),
    };
  } finally {
    clearTimeout(modelsTimer);
  }

  const firstModel = modelsJson?.data?.[0];
  const fallbackModel = modelsJson?.models?.[0];
  const modelId = firstModel?.id ?? fallbackModel?.id;
  if (!modelId) {
    return {
      ok: false,
      endpoint,
      error: "Endpoint responded but returned no models",
    };
  }

  log.info(`verifyEndpoint: /v1/models OK, modelId=${modelId}`);

  const info: ServerInfo = {
    endpoint,
    modelId,
    nCtxTrain: firstModel?.meta?.n_ctx_train,
    nParams: firstModel?.meta?.n_params,
    sizeBytes: firstModel?.meta?.size,
    probedProps: false,
  };

  // Opportunistically probe /props. Non-fatal on any failure.
  const propsController = new AbortController();
  const propsTimer = setTimeout(() => propsController.abort(), PROPS_TIMEOUT);
  try {
    const res = await fetch(`${endpoint}/props`, {
      method: "GET",
      signal: propsController.signal,
      headers: { accept: "application/json" },
    });
    if (res.ok) {
      const props = (await res.json()) as {
        model_alias?: string;
        model_path?: string;
        total_slots?: number;
        modalities?: { vision?: boolean; audio?: boolean };
        default_generation_settings?: { n_ctx?: number };
      };
      info.probedProps = true;
      log.info(`verifyEndpoint: /props OK, nCtx=${props.default_generation_settings?.n_ctx} slots=${props.total_slots}`);
      info.modelAlias = props.model_alias;
      info.modelPath = props.model_path;
      info.totalSlots = props.total_slots;
      info.nCtx = props.default_generation_settings?.n_ctx;
      if (props.modalities) info.modalities = props.modalities;
    }
  } catch {
    // ignore — /props is llama-server-specific
  } finally {
    clearTimeout(propsTimer);
  }

  return { ok: true, endpoint, info };
}

export function perSlotCtx(info: ServerInfo | null | undefined): number {
  if (!info) return 2048;
  if (!info.nCtx || !info.totalSlots || info.totalSlots < 1) return 2048;
  return Math.floor(info.nCtx / info.totalSlots);
}

/**
 * Effective per-slot context: the user's override clamped to the server's
 * real per-slot maximum. Null / undefined / NaN override → server default.
 */
export function effectivePerSlot(
  info: ServerInfo | null | undefined,
  override: number | null | undefined,
): number {
  const serverMax = perSlotCtx(info);
  if (!override || Number.isNaN(override) || override < 1) return serverMax;
  return Math.min(override, serverMax);
}
