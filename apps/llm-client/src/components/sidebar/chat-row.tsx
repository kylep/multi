"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatRowProps {
  id: string;
  title: string;
  updatedAt: number;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ChatRow({
  id,
  title,
  active,
  onSelect,
  onDelete,
}: ChatRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center rounded-md transition-colors",
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
        className="flex-1 truncate px-3 py-2 text-left text-sm"
        title={title}
      >
        {title}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "mr-1 rounded p-1 opacity-0 transition-opacity hover:bg-background/30 focus:opacity-100 group-hover:opacity-100",
            active && "opacity-100",
          )}
          aria-label="Chat actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
