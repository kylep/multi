"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { estimateTokens } from "@/lib/tokens";

interface SummaryPanelProps {
  summary: string;
  onSummaryChange: (next: string) => void;
  droppedCount: number;
  summaryTokens: number;
  inputBudget: number;
}

export function SummaryPanel({
  summary,
  onSummaryChange,
  droppedCount,
  summaryTokens,
  inputBudget,
}: SummaryPanelProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [localText, setLocalText] = useState(summary);

  const pct =
    inputBudget > 0 ? Math.round((summaryTokens / inputBudget) * 100) : 0;

  const startEdit = () => {
    setLocalText(summary);
    setEditing(true);
    setExpanded(true);
  };

  const saveEdit = () => {
    onSummaryChange(localText);
    setEditing(false);
  };

  const cancelEdit = () => {
    setLocalText(summary);
    setEditing(false);
  };

  if (!summary && droppedCount === 0) return null;

  return (
    <div
      className="flex w-full flex-col gap-2 px-6 pb-3"
      data-testid="summary-panel"
    >
      {/* Collapsed bar */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
          summary
            ? "border-amber-500/30 bg-amber-500/5 text-amber-200 hover:bg-amber-500/10"
            : "border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
        )}
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">
          {summary
            ? "Story so far"
            : `${droppedCount} older messages compacted`}
          {summary && (
            <span className="ml-2 font-mono text-[10px] opacity-70">
              {estimateTokens(summary)} tok ({pct}% of budget)
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          {editing ? (
            <div className="flex flex-col gap-2">
              <Textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                className="min-h-[100px] font-mono text-xs"
                data-testid="summary-editor"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {estimateTokens(localText)} tokens
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit} data-testid="summary-save">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
                {summary || (
                  <span className="italic text-muted-foreground">
                    No summary yet — will be generated when context fills up.
                  </span>
                )}
              </p>
              {summary && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEdit}
                    className="gap-1.5 text-xs"
                    data-testid="summary-edit"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
