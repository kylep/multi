"use client";

import { RefreshCw } from "lucide-react";
import type { GeneratedChoice } from "@/lib/generate-choices";

interface ChoiceButtonsProps {
  choices: GeneratedChoice[];
  loading: boolean;
  onSelect: (text: string) => void;
  onRefresh: () => void;
  disabled?: boolean;
}

export function ChoiceButtons({
  choices,
  loading,
  onSelect,
  onRefresh,
  disabled,
}: ChoiceButtonsProps) {
  if (!loading && choices.length === 0) return null;

  return (
    <div
      className="mx-auto w-full max-w-3xl border-t border-border/60 bg-card/50 px-4 py-3"
      data-testid="choice-buttons"
    >
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">
            Generating options…
          </span>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-wrap gap-2">
            {choices.map((c) => (
              <button
                key={c.number}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(c.text)}
                data-testid={`choice-${c.number}`}
                className="rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
              >
                <span className="mr-2 font-mono text-xs text-muted-foreground">
                  {c.number}.
                </span>
                {c.text}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onRefresh}
            aria-label="Regenerate options"
            data-testid="refresh-choices"
            className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
