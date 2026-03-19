import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import { homedir } from "node:os";
// ---------------------------------------------------------------------------
// Pricing — fetched once from LiteLLM (same source as ccusage)
// ---------------------------------------------------------------------------
const LITELLM_PRICING_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";
let pricingCache = null;
async function getPricing() {
    if (pricingCache)
        return pricingCache;
    const res = await fetch(LITELLM_PRICING_URL);
    if (!res.ok)
        throw new Error(`Failed to fetch pricing: ${res.status}`);
    const raw = (await res.json());
    const pricing = {};
    for (const [model, data] of Object.entries(raw)) {
        if (typeof data !== "object" || data === null)
            continue;
        pricing[model] = data;
    }
    pricingCache = pricing;
    return pricing;
}
function findModelPricing(pricing, model) {
    // Try exact match, then with "anthropic/" prefix, then partial match
    if (pricing[model])
        return pricing[model];
    const prefixed = `anthropic/${model}`;
    if (pricing[prefixed])
        return pricing[prefixed];
    for (const key of Object.keys(pricing)) {
        if (key.includes(model) || model.includes(key.replace("anthropic/", ""))) {
            return pricing[key];
        }
    }
    return undefined;
}
// ---------------------------------------------------------------------------
// Cost calculation (mirrors ccusage tiered pricing logic)
// ---------------------------------------------------------------------------
const TIER_THRESHOLD = 200_000;
function tieredCost(tokens, baseRate, tieredRate) {
    if (!baseRate)
        return 0;
    if (tokens > TIER_THRESHOLD && tieredRate) {
        return TIER_THRESHOLD * baseRate + (tokens - TIER_THRESHOLD) * tieredRate;
    }
    return tokens * baseRate;
}
function calculateCost(usage, mp) {
    let cost = tieredCost(usage.input_tokens, mp.input_cost_per_token, mp.input_cost_per_token_above_200k_tokens) +
        tieredCost(usage.output_tokens, mp.output_cost_per_token, mp.output_cost_per_token_above_200k_tokens) +
        tieredCost(usage.cache_creation_input_tokens ?? 0, mp.cache_creation_input_token_cost, mp.cache_creation_input_token_cost_above_200k_tokens) +
        tieredCost(usage.cache_read_input_tokens ?? 0, mp.cache_read_input_token_cost, mp.cache_read_input_token_cost_above_200k_tokens);
    // Speed multiplier (e.g. 6x for fast Opus)
    if (usage.speed === "fast" && mp.provider_specific_entry?.fast) {
        cost *= mp.provider_specific_entry.fast;
    }
    return cost;
}
// ---------------------------------------------------------------------------
// JSONL file discovery and parsing
// ---------------------------------------------------------------------------
async function findJsonlFiles(baseDir) {
    const files = [];
    async function walk(dir) {
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
            }
            else if (entry.name.endsWith(".jsonl")) {
                files.push(full);
            }
        }
    }
    await walk(baseDir);
    return files;
}
async function parseJsonlFile(filePath) {
    const entries = [];
    const stream = createReadStream(filePath, { encoding: "utf-8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
        if (!line.trim())
            continue;
        try {
            const record = JSON.parse(line);
            if (!record?.message?.usage)
                continue;
            const usage = record.message.usage;
            if (typeof usage.input_tokens !== "number")
                continue;
            entries.push({
                timestamp: record.timestamp ?? "",
                model: record.message?.model ?? record.model ?? "unknown",
                usage: {
                    input_tokens: usage.input_tokens,
                    output_tokens: usage.output_tokens ?? 0,
                    cache_creation_input_tokens: usage.cache_creation_input_tokens,
                    cache_read_input_tokens: usage.cache_read_input_tokens,
                    speed: usage.speed,
                },
                costUSD: record.costUSD,
            });
        }
        catch {
            // Skip unparseable lines
        }
    }
    return entries;
}
function getProjectsDir() {
    const envDir = process.env.CLAUDE_CONFIG_DIR;
    if (envDir)
        return join(envDir, "projects");
    return join(homedir(), ".claude", "projects");
}
// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------
function toDateStr(iso) {
    if (!iso)
        return "unknown";
    return iso.slice(0, 10); // YYYY-MM-DD
}
function toMonthStr(iso) {
    if (!iso)
        return "unknown";
    return iso.slice(0, 7); // YYYY-MM
}
async function loadAllEntries() {
    const dir = getProjectsDir();
    const files = await findJsonlFiles(dir);
    const allEntries = [];
    for (const file of files) {
        const entries = await parseJsonlFile(file);
        allEntries.push(...entries);
    }
    return allEntries;
}
async function aggregateByPeriod(entries, periodFn) {
    const pricing = await getPricing();
    const groups = new Map();
    for (const entry of entries) {
        const period = periodFn(entry.timestamp);
        let summary = groups.get(period);
        if (!summary) {
            summary = {
                date: period,
                inputTokens: 0,
                outputTokens: 0,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                totalCost: 0,
                models: {},
            };
            groups.set(period, summary);
        }
        const mp = findModelPricing(pricing, entry.model);
        const cost = mp ? calculateCost(entry.usage, mp) : (entry.costUSD ?? 0);
        summary.inputTokens += entry.usage.input_tokens;
        summary.outputTokens += entry.usage.output_tokens;
        summary.cacheCreationTokens += entry.usage.cache_creation_input_tokens ?? 0;
        summary.cacheReadTokens += entry.usage.cache_read_input_tokens ?? 0;
        summary.totalCost += cost;
        const modelKey = entry.model;
        if (!summary.models[modelKey]) {
            summary.models[modelKey] = { inputTokens: 0, outputTokens: 0, cost: 0 };
        }
        summary.models[modelKey].inputTokens += entry.usage.input_tokens;
        summary.models[modelKey].outputTokens += entry.usage.output_tokens;
        summary.models[modelKey].cost += cost;
    }
    return Array.from(groups.values()).sort((a, b) => a.date.localeCompare(b.date));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function formatDollars(n) {
    return `$${n.toFixed(4)}`;
}
function formatTokens(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}
function formatSummaries(summaries, title) {
    if (summaries.length === 0)
        return "No usage data found.";
    const lines = [title, ""];
    let totalCost = 0;
    let totalInput = 0;
    let totalOutput = 0;
    for (const s of summaries) {
        totalCost += s.totalCost;
        totalInput += s.inputTokens;
        totalOutput += s.outputTokens;
        lines.push(`${s.date}  ${formatDollars(s.totalCost)}  ` +
            `in: ${formatTokens(s.inputTokens)}  out: ${formatTokens(s.outputTokens)}`);
        // Model breakdown
        const modelEntries = Object.entries(s.models).sort((a, b) => b[1].cost - a[1].cost);
        for (const [model, m] of modelEntries) {
            lines.push(`  ${model}: ${formatDollars(m.cost)}  ` +
                `in: ${formatTokens(m.inputTokens)}  out: ${formatTokens(m.outputTokens)}`);
        }
    }
    lines.push("");
    lines.push(`Total: ${formatDollars(totalCost)}  ` +
        `in: ${formatTokens(totalInput)}  out: ${formatTokens(totalOutput)}`);
    return lines.join("\n");
}
// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------
const server = new McpServer({
    name: "cc-usage",
    version: "1.0.0",
});
server.tool("get_usage", "Get Claude Code usage and estimated cost from local session logs. " +
    "Returns daily or monthly breakdowns with per-model cost estimates.", {
    period: z
        .enum(["daily", "monthly"])
        .optional()
        .describe("Aggregation period (default: daily)"),
    days: z
        .number()
        .optional()
        .describe("Number of days to look back (default: 30)"),
}, async ({ period, days }) => {
    const lookback = days ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookback);
    const cutoffStr = cutoff.toISOString();
    const allEntries = await loadAllEntries();
    const filtered = allEntries.filter((e) => e.timestamp >= cutoffStr);
    const periodFn = period === "monthly" ? toMonthStr : toDateStr;
    const summaries = await aggregateByPeriod(filtered, periodFn);
    const title = period === "monthly"
        ? `Monthly Claude Code usage (last ${lookback} days)`
        : `Daily Claude Code usage (last ${lookback} days)`;
    return { content: [{ type: "text", text: formatSummaries(summaries, title) }] };
});
server.tool("get_total_spend", "Get total Claude Code spend across all time or a specific number of days.", {
    days: z
        .number()
        .optional()
        .describe("Number of days to look back (omit for all time)"),
}, async ({ days }) => {
    const allEntries = await loadAllEntries();
    const pricing = await getPricing();
    let filtered = allEntries;
    if (days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffStr = cutoff.toISOString();
        filtered = allEntries.filter((e) => e.timestamp >= cutoffStr);
    }
    let totalCost = 0;
    let totalInput = 0;
    let totalOutput = 0;
    const modelCosts = {};
    for (const entry of filtered) {
        const mp = findModelPricing(pricing, entry.model);
        const cost = mp ? calculateCost(entry.usage, mp) : (entry.costUSD ?? 0);
        totalCost += cost;
        totalInput += entry.usage.input_tokens;
        totalOutput += entry.usage.output_tokens;
        modelCosts[entry.model] = (modelCosts[entry.model] ?? 0) + cost;
    }
    const periodLabel = days ? `last ${days} days` : "all time";
    const lines = [
        `Claude Code usage (${periodLabel})`,
        "",
        `Total cost: ${formatDollars(totalCost)}`,
        `Input tokens: ${formatTokens(totalInput)}`,
        `Output tokens: ${formatTokens(totalOutput)}`,
        "",
        "By model:",
    ];
    const sorted = Object.entries(modelCosts).sort((a, b) => b[1] - a[1]);
    for (const [model, cost] of sorted) {
        lines.push(`  ${model}: ${formatDollars(cost)}`);
    }
    return { content: [{ type: "text", text: lines.join("\n") }] };
});
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
