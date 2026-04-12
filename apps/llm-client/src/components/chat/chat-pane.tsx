"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  buildRequestMessages,
  type ChatMessage,
  computeInputBudget,
  previewContext,
  REPLY_BUDGET,
} from "@/lib/context-manager";
import { streamChat, LlamaClientError } from "@/lib/llama-client";
import { effectivePerSlot } from "@/lib/verify-endpoint";
import { summarizeMessages } from "@/lib/summarize";
import { isDuplicateResponse } from "@/lib/dedup";
import { Composer } from "./composer";
import { MessageList } from "./message-list";

const MAX_DEDUP_RETRIES = 2;
const DEDUP_TEMP_BUMP = 0.15;

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
  const autoSummarize = useSettingsStore((s) => s.autoSummarize);
  const deduplicateRetry = useSettingsStore((s) => s.deduplicateRetry);

  const [draft, setDraft] = useState("");
  const summaryRef = useRef<string | null>(null);

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
  }, [
    chat?.messages,
    draft,
    inputBudget,
    effectiveSystemPrompt,
    effectiveSeedPrompt,
  ]);

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

      const currentMessages = useChatStore
        .getState()
        .chats[chatId].messages.slice(0, -1);
      const historyForRequest = currentMessages.map((m) => ({
        role: m.role,
        content: m.content,
        pinned: m.pinned,
      }));

      const buildResult = buildRequestMessages(historyForRequest, {
        inputBudget,
        systemPrompt: effectiveSystemPrompt,
        seedPrompt: effectiveSeedPrompt,
      });

      let requestMessages = buildResult.messages;

      // Auto-summarize: when messages are being dropped, generate a
      // summary of the dropped portion and inject it as context.
      if (
        autoSummarize &&
        buildResult.truncated &&
        buildResult.droppedCount > 0
      ) {
        const droppedMsgs: ChatMessage[] = [];
        const keptIndices = new Set<number>();
        // Rebuild which indices were kept by running the same logic
        for (let i = 0; i < historyForRequest.length; i++) {
          if (
            requestMessages.some(
              (rm) =>
                rm.content === historyForRequest[i].content &&
                rm.role === historyForRequest[i].role,
            )
          ) {
            keptIndices.add(i);
          }
        }
        for (let i = 0; i < historyForRequest.length; i++) {
          if (!keptIndices.has(i)) {
            droppedMsgs.push({
              role: historyForRequest[i].role,
              content: historyForRequest[i].content,
            });
          }
        }

        if (droppedMsgs.length > 0) {
          const summary = await summarizeMessages(droppedMsgs, {
            endpoint,
            maxTokens: 150,
          });
          if (summary) {
            summaryRef.current = summary;
            const summaryMsg: ChatMessage = {
              role: "system",
              content: `[Summary of earlier conversation]: ${summary}`,
            };
            // Insert summary after any system prompt, before conversation
            const systemIdx = requestMessages.findIndex(
              (m) => m.role === "system",
            );
            if (systemIdx >= 0) {
              requestMessages = [
                ...requestMessages.slice(0, systemIdx + 1),
                summaryMsg,
                ...requestMessages.slice(systemIdx + 1),
              ];
            } else {
              requestMessages = [summaryMsg, ...requestMessages];
            }
          }
        }
      }

      const controller = new AbortController();
      setStreaming({ chatId, abort: () => controller.abort() });

      const runStream = async (
        msgs: ChatMessage[],
        temperature?: number,
      ): Promise<string> => {
        let accumulated = "";
        for await (const delta of streamChat({
          endpoint,
          messages: msgs,
          signal: controller.signal,
          maxTokens: REPLY_BUDGET,
          temperature,
        })) {
          accumulated += delta;
          appendToLastMessage(chatId, delta);
        }
        return accumulated;
      };

      try {
        const fullResponse = await runStream(requestMessages);

        // Dedup retry: if the response matches a recent assistant message,
        // clear it and retry with bumped temperature.
        if (deduplicateRetry && fullResponse) {
          const priorMessages = currentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          }));
          if (isDuplicateResponse(fullResponse, priorMessages)) {
            for (let retry = 0; retry < MAX_DEDUP_RETRIES; retry++) {
              // Clear the current assistant message and start fresh
              const chatState = useChatStore.getState().chats[chatId];
              if (!chatState) break;
              const lastMsg =
                chatState.messages[chatState.messages.length - 1];
              if (lastMsg?.role === "assistant") {
                // Replace content by appending negative of current + new
                const clearDelta = "";
                // We need to reset the message. Use set directly.
                useChatStore.setState((s) => {
                  const c = s.chats[chatId];
                  if (!c) return s;
                  const msgs = c.messages.slice();
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: "",
                  };
                  return {
                    chats: { ...s.chats, [chatId]: { ...c, messages: msgs } },
                  };
                });
              }

              const bumpedTemp =
                0.7 + DEDUP_TEMP_BUMP * (retry + 1);
              const retryResponse = await runStream(
                requestMessages,
                bumpedTemp,
              );
              if (
                !isDuplicateResponse(retryResponse, priorMessages)
              ) {
                break;
              }
            }
          }
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
      autoSummarize,
      deduplicateRetry,
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
