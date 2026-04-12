"use client";

import { Fragment, useEffect, useLayoutEffect, useRef } from "react";
import type { Message } from "@/store/chat-store";
import { MessageBubble } from "./message-bubble";

interface MessageListProps {
  messages: Message[];
  streamingMessageId: string | null;
  truncationIndex: number | null;
  keptSet: Set<number> | null;
  onTogglePin?: (messageId: string) => void;
}

export function MessageList({
  messages,
  streamingMessageId,
  truncationIndex,
  keptSet,
  onTogglePin,
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

  const hasDrops = keptSet !== null;

  // Count how many messages are dropped (not in keptSet, before the tail of kept messages).
  const droppedCount =
    keptSet && hasDrops
      ? messages.filter((_, i) => !keptSet.has(i)).length
      : truncationIndex ?? 0;

  // Find the first dropped (non-kept, non-pinned) message index for the rule.
  let ruleBeforeIndex: number | null = null;
  if (hasDrops && keptSet) {
    for (let i = 0; i < messages.length; i++) {
      if (!keptSet.has(i)) {
        ruleBeforeIndex = i;
        break;
      }
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto"
      data-testid="message-list"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        {messages.map((msg, index) => {
          const isDropped =
            hasDrops && keptSet ? !keptSet.has(index) && !msg.pinned : false;

          return (
            <Fragment key={msg.id}>
              {ruleBeforeIndex === index ? (
                <div
                  className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-destructive"
                  data-testid="truncation-rule"
                >
                  <span className="h-px flex-1 bg-destructive/60" />
                  <span>
                    context cutoff — {droppedCount} older{" "}
                    {droppedCount === 1 ? "message" : "messages"} dropped
                  </span>
                  <span className="h-px flex-1 bg-destructive/60" />
                </div>
              ) : null}
              {isDropped ? null : (
                <MessageBubble
                  role={msg.role}
                  content={msg.content}
                  streaming={msg.id === streamingMessageId}
                  pinned={msg.pinned}
                  onTogglePin={
                    onTogglePin ? () => onTogglePin(msg.id) : undefined
                  }
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
