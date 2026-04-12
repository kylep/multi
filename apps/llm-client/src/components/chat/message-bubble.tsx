"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatRole } from "@/lib/context-manager";

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
  streaming?: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
}

export function MessageBubble({
  role,
  content,
  streaming,
  pinned,
  onTogglePin,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const label = isUser ? "User:" : role === "assistant" ? "Bot:" : "System:";

  return (
    <div
      className={cn(
        "group flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
      data-role={role}
      data-testid={`msg-${role}`}
    >
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-1.5">
          {!isUser && (
            <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          )}
          {onTogglePin && (
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={onTogglePin}
                data-testid="pin-toggle"
                className={cn(
                  "rounded p-0.5 transition-colors",
                  pinned
                    ? "text-amber-500 hover:text-amber-400"
                    : "text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-muted-foreground",
                )}
                aria-label={pinned ? "Unpin message" : "Pin message"}
              >
                <Pin
                  className={cn("h-3 w-3", pinned && "fill-current")}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {pinned
                  ? "Pinned — won't be dropped during truncation"
                  : "Pin to keep in context during truncation"}
              </TooltipContent>
            </Tooltip>
          )}
          {isUser && (
            <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          )}
        </div>
        <div
          className={cn(
            "prose-message rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm",
            pinned && "ring-1 ring-amber-500/40",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {content || ""}
              </ReactMarkdown>
              {streaming ? (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-current align-middle"
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
