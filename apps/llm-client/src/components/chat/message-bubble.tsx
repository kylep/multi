"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { RefreshCw } from "lucide-react";
import { processColors } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatRole } from "@/lib/context-manager";

interface MessageBubbleProps {
  role: ChatRole;
  content: string;
  streaming?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
}

export function MessageBubble({
  role,
  content,
  streaming,
  hasError,
  onRetry,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const label = isUser ? "User:" : role === "assistant" ? "Bot:" : "System:";

  return (
    <div
      className={cn(
        "flex w-full",
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
        <span className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "prose-message rounded-2xl px-4 py-3 shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
              >
                {processColors(content || "")}
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
        {hasError && onRetry && !streaming && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-1 gap-1.5 text-xs text-destructive hover:text-destructive"
            data-testid="retry-btn"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
