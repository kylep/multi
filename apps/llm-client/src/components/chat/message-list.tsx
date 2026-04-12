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
  summaryTokens: number;
  inputBudget: number;
}

export function MessageList({
  messages,
  streamingMessageId,
  recentStartIndex,
  droppedCount,
  summary,
  onSummaryChange,
  summaryTokens,
  inputBudget,
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
  }, [messages]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    isPinnedRef.current = true;
  }, []);

  const hasTruncation = droppedCount > 0;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto"
      data-testid="message-list"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        {/* Seed message (index 0) always shown */}
        {messages.length > 0 && (
          <MessageBubble
            role={messages[0].role}
            content={messages[0].content}
            streaming={messages[0].id === streamingMessageId}
          />
        )}

        {/* Summary panel + truncation boundary */}
        {hasTruncation && (
          <SummaryPanel
            summary={summary}
            onSummaryChange={onSummaryChange}
            droppedCount={droppedCount}
            summaryTokens={summaryTokens}
            inputBudget={inputBudget}
          />
        )}

        {/* Recent messages in context */}
        {messages.slice(hasTruncation ? recentStartIndex : 1).map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            streaming={msg.id === streamingMessageId}
          />
        ))}
      </div>
    </div>
  );
}
