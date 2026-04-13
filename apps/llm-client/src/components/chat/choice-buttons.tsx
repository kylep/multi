"use client";

import type { Choice } from "@/lib/extract-choices";

interface ChoiceButtonsProps {
  choices: Choice[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function ChoiceButtons({
  choices,
  onSelect,
  disabled,
}: ChoiceButtonsProps) {
  if (choices.length === 0) return null;

  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-wrap gap-2 px-4 pb-3"
      data-testid="choice-buttons"
    >
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
  );
}
