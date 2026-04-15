"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Message } from "@/store/chat-store";
import { MessageBubble } from "./message-bubble";
import { SummaryPanel } from "./summary-panel";

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
  recentStartIndex: number;
  droppedCount: number;
  summary: string;
  onSummaryChange: (next: string) => void;
  onRetry?: () => void;
  onRegen?: (messageId: string) => void;
  summaryTokens: number;
  inputBudget: number;
  scrollTrigger?: number;
}

export function MessageList({
  messages,
  streamingMessageId,
  recentStartIndex,
  droppedCount,
  summary,
  onSummaryChange,
  onRetry,
  onRegen,
  summaryTokens,
  inputBudget,
  scrollTrigger,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    isPinnedRef.current = distance < 80;
  };

  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    if (isPinnedRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollTrigger]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    isPinnedRef.current = true;
  }, []);

  const hasTruncation = droppedCount > 0;
  const lastMsg = messages[messages.length - 1];
  const lastIsError =
    lastMsg?.role === "assistant" &&
    lastMsg.content.includes("⚠️") &&
    lastMsg.id !== streamingMessageId;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto"
      data-testid="message-list"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        {messages.length > 0 && (
          <MessageBubble
            role={messages[0].role}
            content={messages[0].content}
            streaming={messages[0].id === streamingMessageId}
          />
        )}

        {hasTruncation && (
          <SummaryPanel
            summary={summary}
            onSummaryChange={onSummaryChange}
            droppedCount={droppedCount}
            summaryTokens={summaryTokens}
            inputBudget={inputBudget}
          />
        )}

        {messages.slice(hasTruncation ? recentStartIndex : 1).map((msg) => {
          const isLast = msg.id === lastMsg?.id;
          const isError = isLast && lastIsError;
          return (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              streaming={msg.id === streamingMessageId}
              hasError={isError}
              onRetry={isError ? onRetry : undefined}
              onRegen={
                msg.role === "assistant" && !isError && onRegen
                  ? () => onRegen(msg.id)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
