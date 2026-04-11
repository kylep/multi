"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Message } from "@/store/chat-store";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
}

export function MessageList({
  messages,
  streamingMessageId,
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

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto"
      data-testid="message-list"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        {messages.map((msg) => (
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
