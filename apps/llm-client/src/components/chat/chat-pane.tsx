"use client";

import { useCallback, useMemo, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  buildRequestMessages,
  type ChatMessage,
  computeInputBudget,
  computeReplyBudget,
  previewContext,
} from "@/lib/context-manager";
import { estimateTokens } from "@/lib/tokens";
import { streamChat, LlamaClientError } from "@/lib/llama-client";
import { effectivePerSlot } from "@/lib/verify-endpoint";
import { summarizeMessages } from "@/lib/summarize";
import { isDuplicateResponse } from "@/lib/dedup";
import { generateTitle } from "@/lib/generate-title";
import { COLOR_PROMPT } from "@/lib/colors";
import { log } from "@/lib/logger";
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
  const setSummary = useChatStore((s) => s.setSummary);
  const endpoint = useSettingsStore((s) => s.endpoint);
  const serverInfo = useSettingsStore((s) => s.serverInfo);
  const systemPrompt = useSettingsStore((s) => s.systemPrompt);
  const systemPromptSource = useSettingsStore((s) => s.systemPromptSource);
  const seedPrompt = useSettingsStore((s) => s.seedPrompt);
  const seedPromptSource = useSettingsStore((s) => s.seedPromptSource);
  const contextOverride = useSettingsStore((s) => s.contextOverride);
  const autoSummarize = useSettingsStore((s) => s.autoSummarize);
  const summaryBudgetPct = useSettingsStore((s) => s.summaryBudgetPct);
  const deduplicateRetry = useSettingsStore((s) => s.deduplicateRetry);
  const temperature = useSettingsStore((s) => s.temperature);
  const colorSupport = useSettingsStore((s) => s.colorSupport);

  const [draft, setDraft] = useState("");
  const [compacting, setCompacting] = useState(false);

  const rawSystemPrompt =
    systemPromptSource === "none" ? undefined : systemPrompt || undefined;
  const effectiveSystemPrompt = colorSupport
    ? [rawSystemPrompt, COLOR_PROMPT].filter(Boolean).join("\n") || COLOR_PROMPT
    : rawSystemPrompt;
  const effectiveSeedPrompt =
    seedPromptSource === "none" ? undefined : seedPrompt || undefined;
  const perSlot = effectivePerSlot(serverInfo, contextOverride);
  const inputBudget = computeInputBudget(perSlot);
  const replyBudget = computeReplyBudget(perSlot);

  const preview = useMemo(() => {
    const history = (chat?.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    return previewContext(history, draft, {
      inputBudget,
      systemPrompt: effectiveSystemPrompt,
      seedPrompt: effectiveSeedPrompt,
      summary: chat?.summary,
      summaryBudgetPct,
    });
  }, [
    chat?.messages,
    chat?.summary,
    draft,
    inputBudget,
    effectiveSystemPrompt,
    effectiveSeedPrompt,
    summaryBudgetPct,
  ]);

  const streamingMessageId = useMemo(() => {
    if (!chat || !streaming || streaming.chatId !== chat.id) return null;
    const last = chat.messages[chat.messages.length - 1];
    return last?.role === "assistant" ? last.id : null;
  }, [chat, streaming]);

  const handleStop = useCallback(() => {
    streaming?.abort();
  }, [streaming]);

  const handleSummaryChange = useCallback(
    (next: string) => {
      if (activeChatId) setSummary(activeChatId, next);
    },
    [activeChatId, setSummary],
  );

  const doSend = useCallback(
    async (chatId: string, historyForRequest: ChatMessage[]) => {
      const currentSummary =
        useChatStore.getState().chats[chatId]?.summary || "";

      let buildResult = buildRequestMessages(historyForRequest, {
        inputBudget,
        systemPrompt: effectiveSystemPrompt,
        seedPrompt: effectiveSeedPrompt,
        summary: currentSummary,
        summaryBudgetPct,
      });

      // Auto-summarize: compact dropped messages. Triggers at truncation
      // OR when context usage exceeds 80% (proactive compaction).
      log.info(`doSend: chatId=${chatId} historyLen=${historyForRequest.length} currentSummaryLen=${currentSummary.length}`);

      const shouldCompact =
        autoSummarize &&
        (buildResult.truncated ||
          (buildResult.droppedMessages.length === 0 &&
            historyForRequest.length > 2 &&
            estimateTokens(
              historyForRequest.map((m) => m.content).join(""),
            ) >
              inputBudget * 0.8));

      if (shouldCompact) {
        log.info(`doSend: compaction triggered (truncated=${buildResult.truncated} droppedMsgs=${buildResult.droppedMessages.length})`);
        setCompacting(true);
        // For proactive compaction (no drops yet), compact the oldest
        // 50% of non-seed messages to make room.
        let messagesToCompact = buildResult.droppedMessages;
        if (messagesToCompact.length === 0 && historyForRequest.length > 2) {
          const half = Math.ceil((historyForRequest.length - 1) / 2);
          messagesToCompact = historyForRequest.slice(1, 1 + half);
        }

        log.info(`doSend: compacting ${messagesToCompact.length} messages`);
        if (messagesToCompact.length > 0) {
          const summaryTokenBudget = Math.floor(
            (inputBudget * summaryBudgetPct) / 100,
          );
          const newSummary = await summarizeMessages(messagesToCompact, {
            endpoint,
            existingSummary: currentSummary || undefined,
            maxTokens: summaryTokenBudget,
            tokenBudget: summaryTokenBudget,
          });
          if (newSummary) {
            log.info(`doSend: summary updated (${newSummary.length} chars)`);
            setSummary(chatId, newSummary);
            buildResult = buildRequestMessages(historyForRequest, {
              inputBudget,
              systemPrompt: effectiveSystemPrompt,
              seedPrompt: effectiveSeedPrompt,
              summary: newSummary,
              summaryBudgetPct,
            });
          }
        }
        setCompacting(false);
      }

      const requestMessages = buildResult.messages;
      const controller = new AbortController();
      setStreaming({ chatId, abort: () => controller.abort() });

      const runStream = async (
        msgs: ChatMessage[],
        tempOverride?: number,
      ): Promise<string> => {
        let accumulated = "";
        for await (const delta of streamChat({
          endpoint,
          messages: msgs,
          signal: controller.signal,
          maxTokens: replyBudget,
          temperature: tempOverride ?? temperature,
        })) {
          accumulated += delta;
          appendToLastMessage(chatId, delta);
        }
        return accumulated;
      };

      try {
        const fullResponse = await runStream(requestMessages);

        log.info(`doSend: stream complete, ${fullResponse.length} chars`);

        if (deduplicateRetry && fullResponse) {
          const priorMessages = historyForRequest.map((m) => ({
            role: m.role,
            content: m.content,
          }));
          if (isDuplicateResponse(fullResponse, priorMessages)) {
            log.warn("doSend: duplicate response detected, retrying with higher temp");
            for (let retry = 0; retry < MAX_DEDUP_RETRIES; retry++) {
              useChatStore.setState((s) => {
                const c = s.chats[chatId];
                if (!c) return s;
                const msgs = c.messages.slice();
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: "",
                };
                return {
                  chats: {
                    ...s.chats,
                    [chatId]: { ...c, messages: msgs },
                  },
                };
              });

              const bumpedTemp = temperature + DEDUP_TEMP_BUMP * (retry + 1);
              log.info(`doSend: dedup retry ${retry + 1}/${MAX_DEDUP_RETRIES} at temp=${bumpedTemp.toFixed(2)}`);
              const retryResponse = await runStream(
                requestMessages,
                bumpedTemp,
              );
              if (!isDuplicateResponse(retryResponse, priorMessages)) {
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
          // user stop
        } else {
          const msg =
            err instanceof LlamaClientError
              ? `\n\n⚠️ ${err.message}`
              : `\n\n⚠️ ${(err as Error).message ?? "request failed"}`;
          appendToLastMessage(chatId, msg);
        }
      } finally {
        setStreaming(null);

        // Auto-generate title after first assistant response or at ~10% ctx
        const chatNow = useChatStore.getState().chats[chatId];
        if (chatNow && chatNow.messages.length >= 2) {
          const firstUserContent = chatNow.messages[0]?.content ?? "";
          const currentTitle = chatNow.title;
          const isDefaultTitle =
            currentTitle === "New chat" ||
            currentTitle === firstUserContent.trim().slice(0, 40) ||
            currentTitle ===
              firstUserContent.trim().slice(0, 40) + "…";
          if (isDefaultTitle) {
            log.info("doSend: triggering auto-title generation");
            generateTitle(
              chatNow.messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              endpoint,
            ).then((t) => {
              if (t) {
                useChatStore.getState().renameChat(chatId, t);
              }
            });
          }
        }
      }
    },
    [
      appendToLastMessage,
      autoSummarize,
      deduplicateRetry,
      effectiveSeedPrompt,
      effectiveSystemPrompt,
      endpoint,
      inputBudget,
      setSummary,
      setStreaming,
      summaryBudgetPct,
      temperature,
    ],
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
      }));

      await doSend(chatId, historyForRequest);
    },
    [activeChatId, appendMessage, doSend, newChat],
  );

  const handleRetry = useCallback(() => {
    if (!activeChatId || !chat) return;
    const messages = chat.messages;
    if (messages.length < 2) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;

    // Clear the error response
    useChatStore.setState((s) => {
      const c = s.chats[activeChatId];
      if (!c) return s;
      const msgs = c.messages.slice();
      msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: "" };
      return {
        chats: { ...s.chats, [activeChatId]: { ...c, messages: msgs } },
      };
    });

    const historyForRequest = messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    doSend(activeChatId, historyForRequest);
  }, [activeChatId, chat, doSend]);

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
          recentStartIndex={preview.recentStartIndex}
          droppedCount={preview.droppedCount}
          summary={chat.summary ?? ""}
          onSummaryChange={handleSummaryChange}
          onRetry={handleRetry}
          summaryTokens={preview.summaryTokens}
          inputBudget={preview.inputBudget}
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
        compacting={compacting}
      />
    </section>
  );
}
