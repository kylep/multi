"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

export interface ModelEntry {
  id: string;
  name: string;
  contextLength?: number;
  pricing?: { prompt: string; completion: string };
}

interface ModelPickerProps {
  endpoint: string;
  apiKey: string;
  selected: string;
  onSelect: (modelId: string, contextLength?: number) => void;
}

export function ModelPicker({
  endpoint,
  apiKey,
  selected,
  onSelect,
}: ModelPickerProps) {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!endpoint || !apiKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const headers: Record<string, string> = {
          accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
        const res = await fetch(
          `${endpoint.replace(/\/+$/, "")}/v1/models`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (!res.ok) {
          if (!cancelled) setError(`HTTP ${res.status}`);
          return;
        }
        const json = await res.json();
        const data = (json.data ?? []) as Array<{
          id: string;
          name?: string;
          context_length?: number;
          pricing?: { prompt?: string; completion?: string };
        }>;
        if (!cancelled) {
          setModels(
            data.map((m) => ({
              id: m.id,
              name: m.name ?? m.id,
              contextLength: m.context_length,
              pricing: m.pricing
                ? {
                    prompt: m.pricing.prompt ?? "?",
                    completion: m.pricing.completion ?? "?",
                  }
                : undefined,
            })),
          );
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [endpoint, apiKey]);

  const filtered = useMemo(() => {
    let list = models;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
      );
    }
    return list.slice().sort((a, b) => {
      const priceA = parseFloat(a.pricing?.prompt ?? "999");
      const priceB = parseFloat(b.pricing?.prompt ?? "999");
      return priceA - priceB;
    });
  }, [models, search]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading models…
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-1 text-xs text-destructive">
        Failed to load models: {error}
      </p>
    );
  }

  if (models.length === 0) return null;

  function formatPrice(perToken: string): string {
    const n = parseFloat(perToken);
    if (isNaN(n) || n === 0) return "free";
    const perMillion = n * 1_000_000;
    if (perMillion < 0.01) return "<$0.01/M";
    return `$${perMillion.toFixed(2)}/M`;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="model-search"
        className="text-xs font-medium text-muted-foreground"
      >
        Model ({models.length} available)
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          id="model-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search models…"
          className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus:border-ring"
          data-testid="model-search"
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-md border border-border">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No models match "{search}"
          </p>
        ) : (
          filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id, m.contextLength)}
              className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-1 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/60 ${
                m.id === selected
                  ? "bg-primary/10 text-primary"
                  : ""
              }`}
              data-testid={`model-${m.id}`}
            >
              <span className="truncate font-mono">
                {m.id}
              </span>
              <span className="w-10 text-right text-muted-foreground">
                {m.contextLength ? `${Math.round(m.contextLength / 1000)}k` : ""}
              </span>
              <span className="w-16 text-right text-muted-foreground">
                {m.pricing ? formatPrice(m.pricing.prompt) : ""}
              </span>
            </button>
          ))
        )}
      </div>
      {selected && (
        <p className="text-[11px] text-muted-foreground">
          Selected: <code className="text-foreground">{selected}</code>
        </p>
      )}
    </div>
  );
}
