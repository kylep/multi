"use client";

import { useCallback, useMemo, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  buildRequestMessages,
  computeInputBudget,
  previewContext,
  REPLY_BUDGET,
} from "@/lib/context-manager";
import { streamChat, LlamaClientError } from "@/lib/llama-client";
import { effectivePerSlot } from "@/lib/verify-endpoint";
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
  const togglePin = useChatStore((s) => s.togglePin);
  const endpoint = useSettingsStore((s) => s.endpoint);
  const serverInfo = useSettingsStore((s) => s.serverInfo);
  const systemPrompt = useSettingsStore((s) => s.systemPrompt);
  const systemPromptSource = useSettingsStore((s) => s.systemPromptSource);
  const seedPrompt = useSettingsStore((s) => s.seedPrompt);
  const seedPromptSource = useSettingsStore((s) => s.seedPromptSource);
  const contextOverride = useSettingsStore((s) => s.contextOverride);

  const [draft, setDraft] = useState("");

  const effectiveSystemPrompt =
    systemPromptSource === "none" ? undefined : systemPrompt || undefined;
  const effectiveSeedPrompt =
    seedPromptSource === "none" ? undefined : seedPrompt || undefined;
  const perSlot = effectivePerSlot(serverInfo, contextOverride);
  const inputBudget = computeInputBudget(perSlot);

  const preview = useMemo(() => {
    const history = (chat?.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      pinned: m.pinned,
    }));
    return previewContext(history, draft, {
      inputBudget,
      systemPrompt: effectiveSystemPrompt,
      seedPrompt: effectiveSeedPrompt,
    });
  }, [chat?.messages, draft, inputBudget, effectiveSystemPrompt, effectiveSeedPrompt]);

  const streamingMessageId = useMemo(() => {
    if (!chat || !streaming || streaming.chatId !== chat.id) return null;
    const last = chat.messages[chat.messages.length - 1];
    return last?.role === "assistant" ? last.id : null;
  }, [chat, streaming]);

  const handleStop = useCallback(() => {
    streaming?.abort();
  }, [streaming]);

  const handleTogglePin = useCallback(
    (messageId: string) => {
      if (activeChatId) togglePin(activeChatId, messageId);
    },
    [activeChatId, togglePin],
  );

  const handleSend = useCallback(
    async (text: string) => {
      let chatId = activeChatId;
      if (!chatId) chatId = newChat();

      appendMessage(chatId, { role: "user", content: text });
      appendMessage(chatId, { role: "assistant", content: "" });

      const historyForRequest = useChatStore
        .getState()
        .chats[chatId].messages.slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content, pinned: m.pinned }));

      const { messages: requestMessages } = buildRequestMessages(
        historyForRequest,
        {
          inputBudget,
          systemPrompt: effectiveSystemPrompt,
          seedPrompt: effectiveSeedPrompt,
        },
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
          // user-initiated stop
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
      effectiveSeedPrompt,
      effectiveSystemPrompt,
      endpoint,
      inputBudget,
      newChat,
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
          truncationIndex={
            preview.truncated ? preview.firstKeptIndex : null
          }
          keptSet={preview.truncated ? preview.keptSet : null}
          onTogglePin={handleTogglePin}
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
        value={draft}
        onValueChange={setDraft}
        onSend={handleSend}
        onStop={handleStop}
        streaming={Boolean(isStreaming)}
        usedTokens={preview.usedTokens}
        inputBudget={preview.inputBudget}
        usedPercent={preview.usedPercent}
        truncated={preview.truncated}
      />
    </section>
  );
}
