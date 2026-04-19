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
  planCompaction,
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
import { SummaryPanel } from "./summary-panel";

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
  const showTokenCount = useSettingsStore((s) => s.showTokenCount);
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
    });
  }, [
    chat?.messages,
    chat?.summary,
    draft,
    inputBudget,
    effectiveSystemPrompt,
    effectiveSeedPrompt,
  ]);

  const lastUsage = useMemo(() => {
    const msgs = chat?.messages ?? [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (
        m.role === "assistant" &&
        typeof m.promptTokens === "number" &&
        typeof m.completionTokens === "number"
      ) {
        return {
          promptTokens: m.promptTokens,
          completionTokens: m.completionTokens,
        };
      }
    }
    return null;
  }, [chat?.messages]);

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

  // Core compaction routine: plan → summarize → (optionally) trim to protect
  // minReplyTokens. Returns the summary that was written (or null on no-op).
  const runCompaction = useCallback(
    async (chatId: string, historyForRequest: ChatMessage[]): Promise<string | null> => {
      const currentSummary =
        useChatStore.getState().chats[chatId]?.summary || "";

      const plan = planCompaction(historyForRequest, {
        inputBudget,
        systemPrompt: effectiveSystemPrompt,
        seedPrompt: effectiveSeedPrompt,
        existingSummary: currentSummary,
      });

      if (plan.messagesToCompact.length === 0) {
        log.info("runCompaction: nothing to compact (already at/under target)");
        return null;
      }

      log.info(
        `runCompaction: compacting ${plan.messagesToCompact.length} messages, budget=${plan.summaryTokenBudget}, target=${plan.targetTokens}`,
      );
      const newSummary = await summarizeMessages(plan.messagesToCompact, {
        endpoint,
        existingSummary: currentSummary || undefined,
        maxTokens: plan.summaryTokenBudget,
        tokenBudget: plan.summaryTokenBudget,
      });
      if (!newSummary) {
        log.warn("runCompaction: summarizer returned null");
        return null;
      }

      setSummary(chatId, newSummary);

      // Remove the compacted messages from the chat — they've been folded
      // into the summary, so keeping them in history would double-count.
      if (plan.compactThroughIndex >= 1) {
        useChatStore
          .getState()
          .dropMessagesInRange(chatId, 1, plan.compactThroughIndex);
        log.info(
          `runCompaction: removed history[1..${plan.compactThroughIndex}] from chat`,
        );
      }

      // Safety: if the post-compaction build leaves less than minReplyTokens
      // of reply room, trim the summary so the model can still answer.
      const latestMessages =
        useChatStore.getState().chats[chatId]?.messages ?? [];
      const build = buildRequestMessages(
        latestMessages.map((m) => ({ role: m.role, content: m.content })),
        {
          inputBudget,
          systemPrompt: effectiveSystemPrompt,
          seedPrompt: effectiveSeedPrompt,
          summary: newSummary,
        },
      );
      const usedAfter = estimateTokens(
        build.messages.map((m) => m.content).join(""),
      );
      const replyRoom = effectiveMaxTokens(replyBudget, perSlot, usedAfter);
      if (replyRoom < minReplyTokens) {
        const trimmed = newSummary.slice(
          0,
          Math.floor(newSummary.length * 0.5),
        );
        log.warn(
          `runCompaction: reply room ${replyRoom} < ${minReplyTokens}, trimming summary to ${trimmed.length} chars`,
        );
        setSummary(chatId, trimmed);
        return trimmed;
      }

      return newSummary;
    },
    [
      effectiveSeedPrompt,
      effectiveSystemPrompt,
      endpoint,
      inputBudget,
      minReplyTokens,
      perSlot,
      replyBudget,
      setSummary,
    ],
  );

  const handleCompact = useCallback(async () => {
    if (!activeChatId || compacting || streaming) return;
    const messages = useChatStore.getState().chats[activeChatId]?.messages;
    if (!messages || messages.length === 0) return;
    const historyForRequest = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setCompacting(true);
    try {
      await runCompaction(activeChatId, historyForRequest);
    } finally {
      setCompacting(false);
    }
  }, [activeChatId, compacting, runCompaction, streaming]);

  const doSend = useCallback(
    async (chatId: string, historyForRequest: ChatMessage[], tempOverride?: number) => {
      // Cancel any in-flight color pass from a previous turn
      colorAbortRef.current?.abort();

      const currentSummary =
        useChatStore.getState().chats[chatId]?.summary || "";

      let activeHistory = historyForRequest;
      let buildResult = buildRequestMessages(activeHistory, {
        inputBudget,
        systemPrompt: effectiveSystemPrompt,
        seedPrompt: effectiveSeedPrompt,
        summary: currentSummary,
      });

      log.info(`doSend: chatId=${chatId} historyLen=${activeHistory.length} currentSummaryLen=${currentSummary.length}`);

      const rawTotalTokens = estimateTokens(
        activeHistory.map((m) => m.content).join(""),
      );
      const shouldCompact =
        autoSummarize &&
        (buildResult.truncated ||
          (activeHistory.length > 2 &&
            rawTotalTokens > inputBudget * 0.8));

      log.info(`doSend: shouldCompact=${shouldCompact} truncated=${buildResult.truncated} droppedMsgs=${buildResult.droppedMessages.length}`);
      if (shouldCompact) {
        log.info(`doSend: compaction triggered`);
        setCompacting(true);
        const updated = await runCompaction(chatId, activeHistory);
        setCompacting(false);
        if (updated !== null) {
          // runCompaction removed the compacted messages from the store and
          // wrote a new summary. Refresh our working history from the store
          // (skipping the trailing empty assistant placeholder appended by
          // handleSend so we don't send it as an input message).
          const storeMsgs =
            useChatStore.getState().chats[chatId]?.messages ?? [];
          const trailing = storeMsgs[storeMsgs.length - 1];
          const usable =
            trailing?.role === "assistant" && trailing.content === ""
              ? storeMsgs.slice(0, -1)
              : storeMsgs;
          activeHistory = usable.map((m) => ({
            role: m.role,
            content: m.content,
          }));
          const latest = useChatStore.getState().chats[chatId]?.summary ?? "";
          buildResult = buildRequestMessages(activeHistory, {
            inputBudget,
            systemPrompt: effectiveSystemPrompt,
            seedPrompt: effectiveSeedPrompt,
            summary: latest,
          });
        }
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
        for await (const event of streamChat({
          endpoint,
          messages: msgs,
          signal: controller.signal,
          maxTokens: maxTok,
          temperature: streamTempOverride ?? baseTemp,
        })) {
          if (event.type === "delta") {
            accumulated += event.content;
            appendToLastMessage(chatId, event.content);
          } else if (event.type === "usage") {
            log.info(
              `runStream: real usage prompt=${event.usage.promptTokens} completion=${event.usage.completionTokens} (estInput=${usedInput})`,
            );
            const chat = useChatStore.getState().chats[chatId];
            const last = chat?.messages[chat.messages.length - 1];
            if (last && last.role === "assistant") {
              useChatStore
                .getState()
                .setMessageUsage(
                  chatId,
                  last.id,
                  event.usage.promptTokens,
                  event.usage.completionTokens,
                );
            }
          }
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
          const priorMessages = activeHistory.map((m) => ({
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
          const TAG_RE = /\{[a-z]\}|\{\/[a-z]\}/g;
          const allMessages = useChatStore
            .getState()
            .chats[chatId]?.messages.map((m) => ({
              role: m.role,
              content: m.content.replace(TAG_RE, ""),
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
      perSlot,
      replyBudget,
      runCompaction,
      setStreaming,
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
    const TAG_RE = /\{[a-z]\}|\{\/[a-z]\}/g;
    const allMessages = chat.messages.map((m) => ({
      role: m.role,
      content: m.content.replace(TAG_RE, ""),
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
      <header className="shrink-0 border-b border-border">
        <div className="flex h-14 items-center px-6">
          <h1 className="truncate text-sm font-medium text-muted-foreground">
            {chat ? chat.title : "llm-client"}
          </h1>
        </div>
        {chat && (chat.summary || preview.droppedCount > 0) && (
          <SummaryPanel
            summary={chat.summary ?? ""}
            onSummaryChange={handleSummaryChange}
            droppedCount={preview.droppedCount}
            summaryTokens={preview.summaryTokens}
            inputBudget={preview.inputBudget}
          />
        )}
      </header>
      {chat && chat.messages.length > 0 ? (
        <MessageList
          messages={chat.messages}
          streamingMessageId={streamingMessageId}
          recentStartIndex={preview.recentStartIndex}
          droppedCount={preview.droppedCount}
          onRetry={handleRetry}
          onRegen={handleRegen}
          scrollTrigger={activeChoices.length + (generatingChoices ? 1 : 0) + (colorizing ? 1 : 0)}
          showTokenCount={showTokenCount}
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
          onCompact={handleCompact}
          compactDisabled={
            !chat ||
            chat.messages.length < 2 ||
            Boolean(isStreaming) ||
            compacting
          }
          lastRealPromptTokens={lastUsage?.promptTokens}
          lastRealCompletionTokens={lastUsage?.completionTokens}
        />
      )}
    </section>
  );
}
