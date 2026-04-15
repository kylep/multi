"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  buildRequestMessages,
  type ChatMessage,
  computeInputBudget,
  computeReplyBudget,
  effectiveMaxTokens,
  previewContext,
} from "@/lib/context-manager";
import { estimateTokens } from "@/lib/tokens";
import { streamChat, LlamaClientError } from "@/lib/llama-client";
import { effectivePerSlot } from "@/lib/verify-endpoint";
import { summarizeMessages } from "@/lib/summarize";
import { isDuplicateResponse } from "@/lib/dedup";
import { generateTitle } from "@/lib/generate-title";
import { colorizeResponse } from "@/lib/colorize-pass";
import { generateChoices, type GeneratedChoice } from "@/lib/generate-choices";
import { log } from "@/lib/logger";
import { ChoiceButtons } from "./choice-buttons";
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
  const replyBudgetOverride = useSettingsStore((s) => s.replyBudgetOverride);
  const autoSummarize = useSettingsStore((s) => s.autoSummarize);
  const summaryBudgetPct = useSettingsStore((s) => s.summaryBudgetPct);
  const deduplicateRetry = useSettingsStore((s) => s.deduplicateRetry);
  const temperature = useSettingsStore((s) => s.temperature);
  const colorSupport = useSettingsStore((s) => s.colorSupport);
  const colorColors = useSettingsStore((s) => s.colorColors);
  const minReplyTokens = useSettingsStore((s) => s.minReplyTokens);
  const choiceButtonsEnabled = useSettingsStore((s) => s.choiceButtons);
  const choicePrompt = useSettingsStore((s) => s.choicePrompt);
  const choiceCount = useSettingsStore((s) => s.choiceCount);
  const disableTextInput = useSettingsStore((s) => s.disableTextInput);

  const [draft, setDraft] = useState("");
  const [compacting, setCompacting] = useState(false);
  const [activeChoices, setActiveChoices] = useState<GeneratedChoice[]>([]);
  const [generatingChoices, setGeneratingChoices] = useState(false);
  const [colorizing, setColorizing] = useState(false);
  const [choiceRefreshCount, setChoiceRefreshCount] = useState(0);

  // Abort controller for the cancellable color pass
  const colorAbortRef = useRef<AbortController | null>(null);

  // Cache choices per chat so they survive switching
  const choiceCacheRef = useRef<Record<string, GeneratedChoice[]>>({});
  const prevChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Save current choices before switching away
    if (prevChatIdRef.current && activeChoices.length > 0) {
      choiceCacheRef.current[prevChatIdRef.current] = activeChoices;
    }
    // Restore cached choices for the new chat, or clear
    const cached = activeChatId ? choiceCacheRef.current[activeChatId] : undefined;
    setActiveChoices(cached ?? []);
    setGeneratingChoices(false);
    prevChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const effectiveSystemPrompt =
    systemPromptSource === "none" ? undefined : systemPrompt || undefined;
  const effectiveSeedPrompt =
    seedPromptSource === "none" ? undefined : seedPrompt || undefined;
  const perSlot = effectivePerSlot(serverInfo, contextOverride);
  const inputBudget = computeInputBudget(perSlot, replyBudgetOverride);
  const replyBudget = computeReplyBudget(perSlot, replyBudgetOverride);

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
    async (chatId: string, historyForRequest: ChatMessage[], tempOverride?: number) => {
      // Cancel any in-flight color pass from a previous turn
      colorAbortRef.current?.abort();

      const currentSummary =
        useChatStore.getState().chats[chatId]?.summary || "";

      let buildResult = buildRequestMessages(historyForRequest, {
        inputBudget,
        systemPrompt: effectiveSystemPrompt,
        seedPrompt: effectiveSeedPrompt,
        summary: currentSummary,
        summaryBudgetPct,
      });

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

      log.info(`doSend: shouldCompact=${shouldCompact} truncated=${buildResult.truncated} droppedMsgs=${buildResult.droppedMessages.length}`);
      if (shouldCompact) {
        log.info(`doSend: compaction triggered`);
        setCompacting(true);
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

            const usedAfter = estimateTokens(
              buildResult.messages.map((m) => m.content).join(""),
            );
            const replyRoom = effectiveMaxTokens(replyBudget, perSlot, usedAfter);
            if (replyRoom < minReplyTokens) {
              const trimTarget = Math.floor(newSummary.length * 0.5);
              const trimmed = newSummary.slice(0, trimTarget);
              log.warn(`doSend: reply room only ${replyRoom} tokens after compaction, trimming summary from ${newSummary.length} to ${trimmed.length} chars`);
              setSummary(chatId, trimmed);
              buildResult = buildRequestMessages(historyForRequest, {
                inputBudget,
                systemPrompt: effectiveSystemPrompt,
                seedPrompt: effectiveSeedPrompt,
                summary: trimmed,
                summaryBudgetPct,
              });
            }
          }
        }
        setCompacting(false);
      }

      const requestMessages = buildResult.messages;
      const controller = new AbortController();
      setStreaming({ chatId, abort: () => controller.abort() });

      const baseTemp = tempOverride ?? temperature;
      const runStream = async (
        msgs: ChatMessage[],
        streamTempOverride?: number,
      ): Promise<string> => {
        const usedInput = estimateTokens(
          msgs.map((m) => m.content).join(""),
        );
        const maxTok = effectiveMaxTokens(replyBudget, perSlot, usedInput);
        log.info(`runStream: replyBudget=${replyBudget} usedInput≈${usedInput} effectiveMax=${maxTok}`);
        let accumulated = "";
        for await (const delta of streamChat({
          endpoint,
          messages: msgs,
          signal: controller.signal,
          maxTokens: maxTok,
          temperature: streamTempOverride ?? baseTemp,
        })) {
          accumulated += delta;
          appendToLastMessage(chatId, delta);
        }
        return accumulated;
      };

      try {
        const fullResponse = await runStream(requestMessages);

        log.exchange("exchange:chat", {
          messages: requestMessages,
          response: fullResponse,
          responseLength: fullResponse.length,
          endpoint,
          temperature: baseTemp,
        });
        log.info(`doSend: stream complete, ${fullResponse.length} chars`);
        setStreaming(null);

        // Dedup check
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

              const bumpedTemp = baseTemp + DEDUP_TEMP_BUMP * (retry + 1);
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

        // Generate choice buttons
        if (choiceButtonsEnabled) {
          setActiveChoices([]);
          setGeneratingChoices(true);
          const allMessages = useChatStore
            .getState()
            .chats[chatId]?.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })) ?? [];
          try {
            const choices = await generateChoices(allMessages, {
              endpoint,
              count: choiceCount,
              prompt: choicePrompt,
            });
            log.info(`doSend: generated ${choices.length} choice buttons`);
            setActiveChoices(choices);
            choiceCacheRef.current[chatId] = choices;
          } catch (err) {
            log.warn(`doSend: choice generation failed: ${(err as Error).message}`);
          } finally {
            setGeneratingChoices(false);
          }
        }

        // Auto-generate title
        const chatNowTitle = useChatStore.getState().chats[chatId];
        if (chatNowTitle && chatNowTitle.messages.length >= 2) {
          const firstUserContent = chatNowTitle.messages[0]?.content ?? "";
          const currentTitle = chatNowTitle.title;
          const isDefaultTitle =
            currentTitle === "New chat" ||
            currentTitle === firstUserContent.trim().slice(0, 40) ||
            currentTitle ===
              firstUserContent.trim().slice(0, 40) + "…";
          if (isDefaultTitle) {
            log.info("doSend: triggering auto-title generation");
            const t = await generateTitle(
              chatNowTitle.messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              endpoint,
            );
            if (t) useChatStore.getState().renameChat(chatId, t);
          }
        }

        // Colorize — runs LAST, cancellable via colorAbortRef
        if (colorSupport && fullResponse && !fullResponse.includes("⚠️")) {
          const colorController = new AbortController();
          colorAbortRef.current = colorController;
          setColorizing(true);
          const colorized = await colorizeResponse(
            fullResponse,
            endpoint,
            colorColors,
            colorController.signal,
          );
          setColorizing(false);
          colorAbortRef.current = null;
          if (colorized !== fullResponse && !colorController.signal.aborted) {
            useChatStore.setState((s) => {
              const c = s.chats[chatId];
              if (!c) return s;
              const msgs = c.messages.slice();
              msgs[msgs.length - 1] = {
                ...msgs[msgs.length - 1],
                content: colorized,
              };
              return {
                chats: { ...s.chats, [chatId]: { ...c, messages: msgs } },
              };
            });
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
      }
    },
    [
      appendToLastMessage,
      autoSummarize,
      choiceButtonsEnabled,
      choiceCount,
      choicePrompt,
      colorColors,
      colorSupport,
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
      // Cancel any in-flight color pass
      colorAbortRef.current?.abort();
      setActiveChoices([]);
      setGeneratingChoices(false);
      setChoiceRefreshCount(0);
      // Clear cached choices for this chat — new ones will be generated
      if (activeChatId) delete choiceCacheRef.current[activeChatId];
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

  const handleRegen = useCallback(
    (messageId: string) => {
      if (!activeChatId || !chat) return;
      const idx = chat.messages.findIndex((m) => m.id === messageId);
      if (idx < 0 || chat.messages[idx].role !== "assistant") return;

      log.info(`regen: message ${messageId} at index ${idx}, bumping temp +0.15`);

      useChatStore.setState((s) => {
        const c = s.chats[activeChatId];
        if (!c) return s;
        const msgs = c.messages.slice();
        msgs[idx] = { ...msgs[idx], content: "" };
        return {
          chats: { ...s.chats, [activeChatId]: { ...c, messages: msgs } },
        };
      });

      const historyForRequest = chat.messages.slice(0, idx).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      doSend(activeChatId, historyForRequest, temperature + 0.15);
    },
    [activeChatId, chat, doSend, temperature],
  );

  const handleRefreshChoices = useCallback(async () => {
    if (!activeChatId || !chat || generatingChoices) return;
    const nextRefresh = choiceRefreshCount + 1;
    setChoiceRefreshCount(nextRefresh);
    setActiveChoices([]);
    setGeneratingChoices(true);
    const allMessages = chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    try {
      const choices = await generateChoices(allMessages, {
        endpoint,
        count: choiceCount,
        prompt: choicePrompt,
        tempOffset: nextRefresh * 0.2,
      });
      log.info(`refreshChoices: generated ${choices.length} buttons (tempOffset=${(nextRefresh * 0.2).toFixed(1)})`);
      setActiveChoices(choices);
      if (activeChatId) choiceCacheRef.current[activeChatId] = choices;
    } catch (err) {
      log.warn(`refreshChoices: failed: ${(err as Error).message}`);
    } finally {
      setGeneratingChoices(false);
    }
  }, [activeChatId, chat, choiceCount, choicePrompt, choiceRefreshCount, endpoint, generatingChoices]);

  const isStreaming = Boolean(
    streaming && chat && streaming.chatId === chat.id,
  );

  const hideTextInput = choiceButtonsEnabled && disableTextInput;

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
          onRegen={handleRegen}
          summaryTokens={preview.summaryTokens}
          inputBudget={preview.inputBudget}
          scrollTrigger={activeChoices.length + (generatingChoices ? 1 : 0) + (colorizing ? 1 : 0)}
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
      {choiceButtonsEnabled && (
        <ChoiceButtons
          choices={activeChoices}
          loading={generatingChoices}
          onSelect={handleSend}
          onRefresh={handleRefreshChoices}
          disabled={Boolean(isStreaming)}
        />
      )}
      {colorizing && (
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">Adding colour…</span>
        </div>
      )}
      {!hideTextInput && (
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
      )}
    </section>
  );
}
