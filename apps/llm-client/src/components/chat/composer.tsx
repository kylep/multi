"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings-store";

interface ComposerProps {
  value: string;
  onValueChange: (next: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  usedTokens: number;
  inputBudget: number;
  usedPercent: number;
  truncated: boolean;
  compacting?: boolean;
  onCompact?: () => void;
  compactDisabled?: boolean;
  /** Real prompt_tokens from the last completed request, if known. */
  lastRealPromptTokens?: number;
  /** Real completion_tokens from the last completed request, if known. */
  lastRealCompletionTokens?: number;
}

export function Composer({
  value,
  onValueChange,
  onSend,
  onStop,
  streaming,
  disabled,
  usedTokens,
  inputBudget,
  usedPercent,
  truncated,
  compacting,
  onCompact,
  compactDisabled,
  lastRealPromptTokens,
  lastRealCompletionTokens,
}: ComposerProps) {
  const serverType = useSettingsStore((s) => s.serverType);
  const endpoint = useSettingsStore((s) => s.endpoint);
  const modelId = useSettingsStore((s) => s.modelId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 240;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value]);

  const canSend = !streaming && !disabled && value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    onValueChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const meterColor =
    usedPercent >= 100 || truncated
      ? "text-destructive"
      : usedPercent >= 80
        ? "text-amber-500"
        : "text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-6">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg transition-shadow focus-within:border-ring focus-within:shadow-xl",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Create a new chat to start…"
              : "Message the model… (Enter to send, Shift+Enter for newline)"
          }
          disabled={disabled}
          rows={1}
          data-testid="composer-input"
          className="flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
          style={{ minHeight: "36px" }}
        />
        {streaming ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onStop}
            aria-label="Stop"
            data-testid="composer-stop"
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            disabled={!canSend}
            onClick={submit}
            aria-label="Send"
            data-testid="composer-send"
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <p className="truncate text-muted-foreground">
          {serverType === "local"
            ? "Local model — data stays on your network."
            : `${endpoint.replace(/^https?:\/\//, "")}/${modelId}`}
        </p>
        <div className="flex items-center gap-3">
          {compacting ? (
            <span
              className="animate-pulse text-amber-500"
              data-testid="compacting-indicator"
            >
              compacting…
            </span>
          ) : (
            onCompact && (
              <button
                type="button"
                onClick={onCompact}
                disabled={compactDisabled}
                className={cn(
                  "underline-offset-2 transition-colors",
                  compactDisabled
                    ? "cursor-not-allowed text-muted-foreground/40"
                    : "text-muted-foreground hover:text-foreground hover:underline",
                )}
                data-testid="compact-link"
                title="Summarize older messages to shrink context to the Compaction target"
              >
                compact
              </button>
            )
          )}
        </div>
        <p
          className={cn("font-mono", meterColor)}
          data-testid="context-meter"
          title={
            `${usedTokens.toLocaleString()} / ${inputBudget.toLocaleString()} tokens (estimate)` +
            (typeof lastRealPromptTokens === "number"
              ? `\nLast request (real): prompt=${lastRealPromptTokens.toLocaleString()}, completion=${(lastRealCompletionTokens ?? 0).toLocaleString()}`
              : "")
          }
        >
          {truncated ? "⚠ " : ""}
          {usedPercent}% ctx
        </p>
      </div>
    </div>
  );
}
