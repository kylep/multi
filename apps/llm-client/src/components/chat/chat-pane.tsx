"use client";

import { useCallback, useMemo } from "react";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  buildRequestMessages,
  computeInputBudget,
  REPLY_BUDGET,
} from "@/lib/context-manager";
import { streamChat, LlamaClientError } from "@/lib/llama-client";
import { perSlotCtx } from "@/lib/verify-endpoint";
import { Composer } from "./composer";
import { MessageList } from "./message-list";

export function ChatPane() {
  const activeChatId = useChatStore((s) => s.activeChatId);
  const chat = useChatStore((s) =>
    s.activeChatId ? s.chats[s.activeChatId] : null,
  );
  const streaming = useChatStore((s) => s.streaming);
  const newChat = useChatStore((s) => s.newChat);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const appendToLastMessage = useChatStore((s) => s.appendToLastMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const endpoint = useSettingsStore((s) => s.endpoint);
  const serverInfo = useSettingsStore((s) => s.serverInfo);

  const streamingMessageId = useMemo(() => {
    if (!chat || !streaming || streaming.chatId !== chat.id) return null;
    const last = chat.messages[chat.messages.length - 1];
    return last?.role === "assistant" ? last.id : null;
  }, [chat, streaming]);

  const handleStop = useCallback(() => {
    streaming?.abort();
  }, [streaming]);

  const handleSend = useCallback(
    async (text: string) => {
      let chatId = activeChatId;
      if (!chatId) chatId = newChat();

      appendMessage(chatId, { role: "user", content: text });
      appendMessage(chatId, { role: "assistant", content: "" });

      const historyForRequest = useChatStore
        .getState()
        .chats[chatId].messages.slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));

      const inputBudget = computeInputBudget(perSlotCtx(serverInfo));
      const { messages: requestMessages } = buildRequestMessages(
        historyForRequest,
        { inputBudget },
      );

      const controller = new AbortController();
      setStreaming({ chatId, abort: () => controller.abort() });

      try {
        for await (const delta of streamChat({
          endpoint,
          messages: requestMessages,
          signal: controller.signal,
          maxTokens: REPLY_BUDGET,
        })) {
          appendToLastMessage(chatId, delta);
        }
      } catch (err) {
        if (
          (err as Error)?.name === "AbortError" ||
          controller.signal.aborted
        ) {
          // user-initiated, keep partial text
        } else {
          const msg =
            err instanceof LlamaClientError
              ? `\n\n⚠️ ${err.message}`
              : `\n\n⚠️ ${(err as Error).message ?? "request failed"}`;
          appendToLastMessage(chatId, msg);
        }
      } finally {
        setStreaming(null);
      }
    },
    [
      activeChatId,
      appendMessage,
      appendToLastMessage,
      endpoint,
      newChat,
      serverInfo,
      setStreaming,
    ],
  );

  const isStreaming = Boolean(
    streaming && chat && streaming.chatId === chat.id,
  );

  return (
    <section className="flex h-dvh flex-1 flex-col bg-background">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="truncate text-sm font-medium text-muted-foreground">
          {chat ? chat.title : "llm-client"}
        </h1>
      </header>
      {chat && chat.messages.length > 0 ? (
        <MessageList
          messages={chat.messages}
          streamingMessageId={streamingMessageId}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 text-4xl font-bold tracking-tight">
              llm-client
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              A local chat interface for llama-server. Start a new conversation
              below — messages and history stay in your browser.
            </p>
          </div>
        </div>
      )}
      <Composer
        onSend={handleSend}
        onStop={handleStop}
        streaming={Boolean(isStreaming)}
      />
    </section>
  );
}
