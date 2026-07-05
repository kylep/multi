import { afterEach, describe, expect, it, vi } from "vitest";
import {
  effectivePerSlot,
  perSlotCtx,
  verifyEndpoint,
} from "./verify-endpoint";

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockFetchByUrl(
  routes: Record<string, Response | (() => Promise<Response>)>,
) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    for (const [pattern, resp] of Object.entries(routes)) {
      if (url.endsWith(pattern)) {
        if (typeof resp === "function") return resp();
        return resp.clone();
      }
    }
    throw new Error(`unmocked fetch: ${url}`);
  });
}

describe("verifyEndpoint", () => {
  it("rejects endpoints without http(s) scheme", async () => {
    const result = await verifyEndpoint("127.0.0.1:8080");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/http/i);
  });

  it("collects meta from /v1/models alone when /props 404s", async () => {
    mockFetchByUrl({
      "/v1/models": jsonResponse({
        data: [
          {
            id: "Mistral-Nemo.gguf",
            meta: {
              n_ctx_train: 1024000,
              n_params: 12247782400,
              size: 7967395840,
            },
          },
        ],
      }),
      "/props": jsonResponse({}, 404),
    });
    const result = await verifyEndpoint("http://127.0.0.1:8080");
    expect(result.ok).toBe(true);
    expect(result.info?.modelId).toBe("Mistral-Nemo.gguf");
    expect(result.info?.nCtxTrain).toBe(1024000);
    expect(result.info?.nParams).toBe(12247782400);
    expect(result.info?.sizeBytes).toBe(7967395840);
    expect(result.info?.probedProps).toBe(false);
    expect(result.info?.nCtx).toBeUndefined();
    expect(result.info?.totalSlots).toBeUndefined();
  });

  it("populates props fields when /props responds", async () => {
    mockFetchByUrl({
      "/v1/models": jsonResponse({
        data: [{ id: "m", meta: { n_ctx_train: 1000 } }],
      }),
      "/props": jsonResponse({
        model_alias: "m",
        model_path: "/models/m.gguf",
        total_slots: 4,
        modalities: { vision: false, audio: false },
        default_generation_settings: { n_ctx: 8192 },
      }),
    });
    const result = await verifyEndpoint("http://127.0.0.1:8080");
    expect(result.ok).toBe(true);
    expect(result.info?.probedProps).toBe(true);
    expect(result.info?.nCtx).toBe(8192);
    expect(result.info?.totalSlots).toBe(4);
    expect(result.info?.modelAlias).toBe("m");
    expect(result.info?.modalities?.vision).toBe(false);
  });

  it("swallows /props JSON parse errors without failing verification", async () => {
    mockFetchByUrl({
      "/v1/models": jsonResponse({ data: [{ id: "m" }] }),
      "/props": new Response("not json", { status: 200 }),
    });
    const result = await verifyEndpoint("http://127.0.0.1:8080");
    expect(result.ok).toBe(true);
    expect(result.info?.probedProps).toBe(false);
  });

  it("falls back to models[0].id for ollama-shaped responses", async () => {
    mockFetchByUrl({
      "/v1/models": jsonResponse({ models: [{ id: "llama3" }] }),
      "/props": jsonResponse({}, 404),
    });
    const result = await verifyEndpoint("http://localhost:11434");
    expect(result.ok).toBe(true);
    expect(result.info?.modelId).toBe("llama3");
  });

  it("fails when /v1/models returns no models at all", async () => {
    mockFetchByUrl({
      "/v1/models": jsonResponse({}),
      "/props": jsonResponse({}, 404),
    });
    const result = await verifyEndpoint("http://127.0.0.1:8080");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no models/i);
  });

  it("fails on /v1/models 500", async () => {
    mockFetchByUrl({
      "/v1/models": new Response("nope", { status: 500 }),
    });
    const result = await verifyEndpoint("http://127.0.0.1:8080");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it("fails on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await verifyEndpoint("http://127.0.0.1:8080");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/ECONNREFUSED/);
  });
});

describe("perSlotCtx", () => {
  it("returns 2048 fallback for null", () => {
    expect(perSlotCtx(null)).toBe(2048);
  });

  it("returns nCtx directly when totalSlots is missing (remote API)", () => {
    expect(
      perSlotCtx({
        endpoint: "x",
        modelId: "m",
        probedProps: false,
        nCtx: 8192,
      }),
    ).toBe(8192);
  });

  it("returns 2048 when only totalSlots is set without nCtx", () => {
    expect(
      perSlotCtx({
        endpoint: "x",
        modelId: "m",
        probedProps: true,
        totalSlots: 4,
      }),
    ).toBe(2048);
  });

  it("divides nCtx by totalSlots", () => {
    expect(
      perSlotCtx({
        endpoint: "x",
        modelId: "m",
        probedProps: true,
        nCtx: 8192,
        totalSlots: 4,
      }),
    ).toBe(2048);
    expect(
      perSlotCtx({
        endpoint: "x",
        modelId: "m",
        probedProps: true,
        nCtx: 32000,
        totalSlots: 1,
      }),
    ).toBe(32000);
  });
});

describe("effectivePerSlot", () => {
  const info = {
    endpoint: "x",
    modelId: "m",
    probedProps: true,
    nCtx: 8192,
    totalSlots: 4,
  };

  it("returns server max when override is null/undefined", () => {
    expect(effectivePerSlot(info, null)).toBe(2048);
    expect(effectivePerSlot(info, undefined)).toBe(2048);
  });

  it("returns override when override is below server max", () => {
    expect(effectivePerSlot(info, 1024)).toBe(1024);
  });

  it("clamps override to server max when override exceeds it", () => {
    expect(effectivePerSlot(info, 9999)).toBe(2048);
  });

  it("returns server max for invalid overrides", () => {
    expect(effectivePerSlot(info, 0)).toBe(2048);
    expect(effectivePerSlot(info, -100)).toBe(2048);
    expect(effectivePerSlot(info, Number.NaN)).toBe(2048);
  });
});
