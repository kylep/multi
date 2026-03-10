import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://openrouter.ai/api/v1";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return key;
}

async function apiFetch(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${body}`);
  }
  return res.json();
}

function formatDollars(credits: number): string {
  return `$${credits.toFixed(4)}`;
}

// Per-token price string to per-million-token dollar string
function perMillionTokens(perToken: string | number): string {
  const n = typeof perToken === "string" ? parseFloat(perToken) : perToken;
  if (isNaN(n) || n === 0) return "free";
  return `$${(n * 1_000_000).toFixed(2)}`;
}

const server = new McpServer({
  name: "openrouter",
  version: "1.0.0",
});

// Tool 1: get_usage
server.tool("get_usage", "Get OpenRouter API key usage and credit balance", {}, async () => {
  const data = (await apiFetch("/key")) as {
    data: {
      label: string | null;
      usage: number;
      usage_daily: number;
      usage_weekly: number;
      usage_monthly: number;
      limit: number | null;
      limit_remaining: number | null;
      is_free_tier: boolean;
    };
  };
  const k = data.data;

  const lines = [
    `Key: ${k.label || "(unnamed)"}`,
    `Free tier: ${k.is_free_tier ? "yes" : "no"}`,
    "",
    "Usage:",
    `  Today:  ${formatDollars(k.usage_daily)}`,
    `  Week:   ${formatDollars(k.usage_weekly)}`,
    `  Month:  ${formatDollars(k.usage_monthly)}`,
    `  Total:  ${formatDollars(k.usage)}`,
  ];

  if (k.limit !== null && k.limit_remaining !== null) {
    lines.push("", "Credit limit:");
    lines.push(`  Limit:     ${formatDollars(k.limit)}`);
    lines.push(`  Remaining: ${formatDollars(k.limit_remaining)}`);
  }

  return { content: [{ type: "text", text: lines.join("\n") }] };
});

// Tool 2: get_model_pricing
server.tool(
  "get_model_pricing",
  "Look up OpenRouter model pricing. Optionally filter by model ID or search term.",
  { model: z.string().optional().describe("Model ID or search term to filter by") },
  async ({ model }) => {
    const data = (await apiFetch("/models")) as {
      data: Array<{
        id: string;
        name: string;
        pricing: { prompt: string; completion: string };
        context_length: number;
      }>;
    };

    let models = data.data;
    if (model) {
      const term = model.toLowerCase();
      models = models.filter(
        (m) => m.id.toLowerCase().includes(term) || m.name.toLowerCase().includes(term)
      );
    }

    if (models.length === 0) {
      return { content: [{ type: "text", text: `No models found matching "${model}"` }] };
    }

    const cap = 20;
    const truncated = models.length > cap;
    const shown = models.slice(0, cap);

    const lines = shown.map((m) => {
      const prompt = perMillionTokens(m.pricing.prompt);
      const completion = perMillionTokens(m.pricing.completion);
      return `${m.id}\n  Prompt: ${prompt}/M tokens  Completion: ${completion}/M tokens  Context: ${(m.context_length / 1000).toFixed(0)}k`;
    });

    if (truncated) {
      lines.push(`\n... and ${models.length - cap} more. Use a search term to narrow results.`);
    }

    return { content: [{ type: "text", text: lines.join("\n\n") }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
