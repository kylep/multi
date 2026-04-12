"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatRowProps {
  id: string;
  title: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function ChatRow({
  id,
  title,
  active,
  onSelect,
  onDelete,
  onRename,
}: ChatRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(title);
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) onRename(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="flex items-center overflow-hidden rounded-md bg-sidebar-accent px-1 py-1"
        data-testid={`chat-row-${id}`}
      >
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          className="min-w-0 flex-1 rounded bg-background px-2 py-1 text-sm outline-none"
          data-testid="chat-rename-input"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center overflow-hidden rounded-md transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "hover:bg-sidebar-accent/60",
      )}
      data-active={active || undefined}
      data-testid={`chat-row-${id}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
        title={title}
      >
        {title}
      </button>
      <div
        className={cn(
          "mr-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
          active && "opacity-100",
        )}
      >
        <button
          type="button"
          onClick={startEdit}
          aria-label="Rename chat"
          className="rounded p-1 hover:bg-background/30"
          data-testid="chat-rename-btn"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete chat"
          className="rounded p-1 text-destructive hover:bg-destructive/20"
          data-testid="chat-delete-btn"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
