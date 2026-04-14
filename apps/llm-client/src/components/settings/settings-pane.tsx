"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { computeReplyBudget } from "@/lib/context-manager";
import { perSlotCtx } from "@/lib/verify-endpoint";
import { type PromptSource, useSettingsStore } from "@/store/settings-store";
import { PromptField } from "./prompt-field";

interface SettingsPaneProps {
  onClose: () => void;
}

function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className="text-muted-foreground/60 transition-colors hover:text-foreground"
        aria-label="What is this?"
      >
        <Info className="h-3 w-3" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function SettingsPane({ onClose }: SettingsPaneProps) {
  const serverInfo = useSettingsStore((s) => s.serverInfo);
  const storedSp = useSettingsStore((s) => s.systemPrompt);
  const storedSpSrc = useSettingsStore((s) => s.systemPromptSource);
  const storedSpFile = useSettingsStore((s) => s.systemPromptFilename);
  const storedSeed = useSettingsStore((s) => s.seedPrompt);
  const storedSeedSrc = useSettingsStore((s) => s.seedPromptSource);
  const storedSeedFile = useSettingsStore((s) => s.seedPromptFilename);
  const storedCtxOvr = useSettingsStore((s) => s.contextOverride);
  const storedReplyBudget = useSettingsStore((s) => s.replyBudgetOverride);
  const storedMinReply = useSettingsStore((s) => s.minReplyTokens);
  const storedAutoSummarize = useSettingsStore((s) => s.autoSummarize);
  const storedSummaryBudget = useSettingsStore((s) => s.summaryBudgetPct);
  const storedDedupRetry = useSettingsStore((s) => s.deduplicateRetry);
  const storedTemperature = useSettingsStore((s) => s.temperature);
  const setSystemPrompt = useSettingsStore((s) => s.setSystemPrompt);
  const setSeedPrompt = useSettingsStore((s) => s.setSeedPrompt);
  const setContextOverride = useSettingsStore((s) => s.setContextOverride);
  const setReplyBudgetOverride = useSettingsStore((s) => s.setReplyBudgetOverride);
  const setMinReplyTokens = useSettingsStore((s) => s.setMinReplyTokens);
  const setAutoSummarize = useSettingsStore((s) => s.setAutoSummarize);
  const setSummaryBudgetPct = useSettingsStore((s) => s.setSummaryBudgetPct);
  const storedExtractChoices = useSettingsStore((s) => s.extractChoices);
  const storedColorSupport = useSettingsStore((s) => s.colorSupport);
  const storedColorPrompt = useSettingsStore((s) => s.colorPrompt);
  const setDeduplicateRetry = useSettingsStore((s) => s.setDeduplicateRetry);
  const setTemperature = useSettingsStore((s) => s.setTemperature);
  const setExtractChoices = useSettingsStore((s) => s.setExtractChoices);
  const setColorSupport = useSettingsStore((s) => s.setColorSupport);
  const setColorPrompt = useSettingsStore((s) => s.setColorPrompt);

  const [spSrc, setSpSrc] = useState<PromptSource>(storedSpSrc);
  const [spText, setSpText] = useState(storedSp);
  const [spFile, setSpFile] = useState(storedSpSrc === "file" ? storedSp : "");
  const [spFilename, setSpFilename] = useState(storedSpFile);
  const [seedSrc, setSeedSrc] = useState<PromptSource>(storedSeedSrc);
  const [seedText, setSeedText] = useState(storedSeed);
  const [seedFile, setSeedFile] = useState(
    storedSeedSrc === "file" ? storedSeed : "",
  );
  const [seedFilename, setSeedFilename] = useState(storedSeedFile);
  const [overrideStr, setOverrideStr] = useState(
    storedCtxOvr === null ? "" : String(storedCtxOvr),
  );
  const [replyBudgetStr, setReplyBudgetStr] = useState(
    storedReplyBudget === null ? "" : String(storedReplyBudget),
  );
  const [localMinReply, setLocalMinReply] = useState(String(storedMinReply));
  const [localAutoSummarize, setLocalAutoSummarize] =
    useState(storedAutoSummarize);
  const [localSummaryBudget, setLocalSummaryBudget] =
    useState(storedSummaryBudget);
  const [localDedupRetry, setLocalDedupRetry] = useState(storedDedupRetry);
  const [localTemp, setLocalTemp] = useState(String(storedTemperature));
  const [localExtractChoices, setLocalExtractChoices] = useState(storedExtractChoices);
  const [localColorSupport, setLocalColorSupport] = useState(storedColorSupport);
  const [localColorPrompt, setLocalColorPrompt] = useState(storedColorPrompt);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync local state from store. Runs on mount and whenever the store
  // rehydrates from localStorage. Uses a ref to avoid overwriting
  // in-progress user edits — only syncs when the store value actually
  // differs from what we last synced.
  const lastSyncRef = useRef("");
  useEffect(() => {
    const key = [storedSp, storedSpSrc, storedSeed, storedSeedSrc, storedCtxOvr, storedReplyBudget, storedMinReply, storedTemperature, storedColorPrompt].join("|");
    if (key === lastSyncRef.current) return;
    lastSyncRef.current = key;
    setSpSrc(storedSpSrc);
    setSpText(storedSp);
    setSpFile(storedSpSrc === "file" ? storedSp : "");
    setSpFilename(storedSpFile);
    setSeedSrc(storedSeedSrc);
    setSeedText(storedSeed);
    setSeedFile(storedSeedSrc === "file" ? storedSeed : "");
    setSeedFilename(storedSeedFile);
    setOverrideStr(storedCtxOvr === null ? "" : String(storedCtxOvr));
    setReplyBudgetStr(storedReplyBudget === null ? "" : String(storedReplyBudget));
    setLocalMinReply(String(storedMinReply));
    setLocalAutoSummarize(storedAutoSummarize);
    setLocalSummaryBudget(storedSummaryBudget);
    setLocalDedupRetry(storedDedupRetry);
    setLocalTemp(String(storedTemperature));
    setLocalExtractChoices(storedExtractChoices);
    setLocalColorSupport(storedColorSupport);
    setLocalColorPrompt(storedColorPrompt);
  }, [storedSp, storedSpSrc, storedSpFile, storedSeed, storedSeedSrc, storedSeedFile, storedCtxOvr, storedReplyBudget, storedMinReply, storedAutoSummarize, storedSummaryBudget, storedDedupRetry, storedTemperature, storedExtractChoices, storedColorSupport, storedColorPrompt]);

  const serverMax = perSlotCtx(serverInfo);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const save = () => {
    setError(null);

    const effectiveSpSrc =
      spSrc === "none" && spText.trim() ? "text" : spSrc;
    if (effectiveSpSrc === "text") {
      setSystemPrompt(spText.trim() ? "text" : "none", spText, null);
    } else if (effectiveSpSrc === "file") {
      if (!spFile) {
        setError("System prompt: pick a file first.");
        return;
      }
      setSystemPrompt("file", spFile, spFilename);
    } else {
      setSystemPrompt("none", "", null);
    }

    const effectiveSeedSrc =
      seedSrc === "none" && seedText.trim() ? "text" : seedSrc;
    if (effectiveSeedSrc === "text") {
      setSeedPrompt(seedText.trim() ? "text" : "none", seedText, null);
    } else if (effectiveSeedSrc === "file") {
      if (!seedFile) {
        setError("Seed prompt: pick a file first.");
        return;
      }
      setSeedPrompt("file", seedFile, seedFilename);
    } else {
      setSeedPrompt("none", "", null);
    }

    if (overrideStr.trim() === "") {
      setContextOverride(null);
    } else {
      const parsed = parseInt(overrideStr, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        setError("Context override must be a positive number.");
        return;
      }
      setContextOverride(parsed);
    }

    if (replyBudgetStr.trim() === "") {
      setReplyBudgetOverride(null);
    } else {
      const parsed = parseInt(replyBudgetStr, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        setError("Reply budget must be a positive number.");
        return;
      }
      setReplyBudgetOverride(parsed);
    }

    const parsedMinReply = parseInt(localMinReply, 10);
    if (!Number.isNaN(parsedMinReply) && parsedMinReply > 0) {
      setMinReplyTokens(parsedMinReply);
    }

    const parsedTemp = parseFloat(localTemp);
    if (Number.isNaN(parsedTemp) || parsedTemp < 0 || parsedTemp > 2) {
      setError("Temperature must be a number between 0 and 2.");
      return;
    }
    setTemperature(parsedTemp);

    setAutoSummarize(localAutoSummarize);
    setSummaryBudgetPct(localSummaryBudget);
    setDeduplicateRetry(localDedupRetry);
    setExtractChoices(localExtractChoices);
    setColorSupport(localColorSupport);
    setColorPrompt(localColorPrompt);

    setSaved(true);
  };

  // Auto-save on change (debounced 1s)
  const mountedRef = useRef(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveRef.current();
    }, 1000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [spSrc, spText, spFile, seedSrc, seedText, seedFile, overrideStr, replyBudgetStr, localMinReply, localAutoSummarize, localSummaryBudget, localDedupRetry, localTemp, localExtractChoices, localColorSupport, localColorPrompt]);

  return (
    <section className="flex h-dvh flex-1 flex-col bg-background">
      <header className="flex h-14 items-center gap-3 border-b border-border px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Back to chat"
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <SettingsIcon className="h-4 w-4 text-muted-foreground" />
        <h1 className="text-sm font-medium">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
          {/* Prompts */}
          <section className="flex flex-col gap-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prompts
            </h2>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label>System prompt</Label>
                <HintIcon text="Sent as role: 'system'. Controls HOW the model behaves — style, tone, formatting rules. Re-applied by the model's chat template on each turn." />
              </div>
              <PromptField
                id="sp"
                source={spSrc}
                onSourceChange={setSpSrc}
                textValue={spText}
                onTextChange={setSpText}
                fileValue={spFile}
                onFileLoaded={(c, n) => {
                  setSpFile(c);
                  setSpFilename(n);
                }}
                filename={spFilename}
                placeholder="You are a helpful assistant…"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Label>Seed prompt</Label>
                <HintIcon text="Prepended to the first user message. Defines WHAT the conversation is about — scenario setup, rules, context. Stays anchored at conversation start and is never re-injected. Always kept in context." />
              </div>
              <PromptField
                id="seed"
                source={seedSrc}
                onSourceChange={setSeedSrc}
                textValue={seedText}
                onTextChange={setSeedText}
                fileValue={seedFile}
                onFileLoaded={(c, n) => {
                  setSeedFile(c);
                  setSeedFilename(n);
                }}
                filename={seedFilename}
                placeholder="# Game Rules&#10;You are an RPG generator…"
              />
            </div>
          </section>

          {/* Model */}
          <section className="flex flex-col gap-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Model
            </h2>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="temperature">Temperature</Label>
                <HintIcon text="Controls randomness. Lower (0.1-0.3) = focused and deterministic, good for code or factual Q&A. Higher (0.7-1.0) = creative and varied, good for stories and brainstorming. Range: 0-2." />
              </div>
              <input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={localTemp}
                onChange={(e) => setLocalTemp(e.target.value)}
                placeholder="0.7"
                className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-ring"
                data-testid="temperature-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="ctx-override">Context override</Label>
                <HintIcon
                  text={`Hard-cap the per-slot context llm-client uses. Leave blank to use the server's per-slot max (${serverMax.toLocaleString()} tokens).`}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="ctx-override"
                  type="number"
                  min="1"
                  value={overrideStr}
                  onChange={(e) => setOverrideStr(e.target.value)}
                  placeholder={`server default (${serverMax.toLocaleString()})`}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-ring"
                  data-testid="ctx-override-input"
                />
                {overrideStr !== "" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOverrideStr("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {overrideStr !== "" &&
                !Number.isNaN(parseInt(overrideStr, 10)) &&
                parseInt(overrideStr, 10) > serverMax && (
                  <p className="text-[11px] text-amber-500">
                    Exceeds server max; will be clamped to{" "}
                    {serverMax.toLocaleString()}.
                  </p>
                )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="reply-budget">Reply budget</Label>
                <HintIcon
                  text={`Max tokens the model can generate per response. Leave blank for default (${computeReplyBudget(serverMax).toLocaleString()} = 50% of per-slot). Automatically capped to available space based on how much context is used.`}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="reply-budget"
                  type="number"
                  min="1"
                  value={replyBudgetStr}
                  onChange={(e) => setReplyBudgetStr(e.target.value)}
                  placeholder={`default (${computeReplyBudget(serverMax).toLocaleString()})`}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-ring"
                  data-testid="reply-budget-input"
                />
                {replyBudgetStr !== "" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyBudgetStr("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="min-reply">Min reply tokens</Label>
                <HintIcon text="After compaction, if the model would have fewer than this many tokens to reply, the summary gets trimmed to make room. Prevents cut-off responses at high context usage." />
              </div>
              <input
                id="min-reply"
                type="number"
                min="1"
                value={localMinReply}
                onChange={(e) => setLocalMinReply(e.target.value)}
                placeholder="500"
                className="h-9 w-full rounded-md border border-border bg-background px-3 font-mono text-sm outline-none focus:border-ring"
                data-testid="min-reply-input"
              />
            </div>
          </section>

          {/* Behavior */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Behavior
            </h2>

            <div className="rounded-md border border-border px-3 py-2.5">
              <label className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Auto-summarize</div>
                  <div className="text-[11px] text-muted-foreground">
                    When old messages are dropped, generate a rolling "Story
                    so far" summary. Editable in the chat transcript.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localAutoSummarize}
                  onChange={(e) => setLocalAutoSummarize(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                  data-testid="toggle-auto-summarize"
                />
              </label>
              {localAutoSummarize && (
                <div className="mt-3 flex items-center gap-3 border-t border-border/50 pt-3">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    Summary budget
                    <HintIcon text="Max % of the context window the 'Story so far' summary can use. Higher = more memory of old conversation but less room for recent messages. Lower = more room for recent turns but the summary gets truncated." />
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={localSummaryBudget}
                    onChange={(e) =>
                      setLocalSummaryBudget(parseInt(e.target.value, 10))
                    }
                    className="flex-1"
                    data-testid="summary-budget-slider"
                  />
                  <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                    {localSummaryBudget}%
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Post-processing */}
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Post-processing
            </h2>

            <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Duplicate retry</div>
                <div className="text-[11px] text-muted-foreground">
                  If the model repeats a previous response, automatically
                  retry with higher temperature (up to 2 times).
                </div>
              </div>
              <input
                type="checkbox"
                checked={localDedupRetry}
                onChange={(e) => setLocalDedupRetry(e.target.checked)}
                className="h-4 w-4 accent-primary"
                data-testid="toggle-dedup-retry"
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">Extract choices</div>
                <div className="text-[11px] text-muted-foreground">
                  Detect numbered option lists at the end of responses and
                  present them as clickable buttons above the composer.
                </div>
              </div>
              <input
                type="checkbox"
                checked={localExtractChoices}
                onChange={(e) => setLocalExtractChoices(e.target.checked)}
                className="h-4 w-4 accent-primary"
                data-testid="toggle-extract-choices"
              />
            </label>

            <div className="rounded-md border border-border px-3 py-2.5">
              <label className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Colour support</div>
                  <div className="text-[11px] text-muted-foreground">
                    After each response, a second pass annotates text with{" "}
                    <code className="text-[10px]">{"{r}"}word{"{/r}"}</code>{" "}
                    colour codes. Rendered inline in the chat.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localColorSupport}
                  onChange={(e) => setLocalColorSupport(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                  data-testid="toggle-color-support"
                />
              </label>
              {localColorSupport && (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-3">
                  <div className="flex items-center gap-1.5">
                    <Label>Colour prompt</Label>
                    <HintIcon text="Instructions sent to the model in a second pass after each response. Tells it how to annotate the text with colour codes. Edit to change which words get coloured and how." />
                  </div>
                  <Textarea
                    value={localColorPrompt}
                    onChange={(e) => setLocalColorPrompt(e.target.value)}
                    className="min-h-[120px] font-mono text-xs"
                    data-testid="color-prompt-textarea"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Error + Save */}
          {error && (
            <p
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
              data-testid="settings-error"
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={save} data-testid="settings-save">
              Save
            </Button>
            {saved && (
              <span className="text-xs text-emerald-500">Saved</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
