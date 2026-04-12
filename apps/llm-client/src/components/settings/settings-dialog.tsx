"use client";

import { useEffect, useState } from "react";
import { Info, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { perSlotCtx } from "@/lib/verify-endpoint";
import { type PromptSource, useSettingsStore } from "@/store/settings-store";
import { PromptField } from "./prompt-field";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const serverInfo = useSettingsStore((s) => s.serverInfo);
  const storedSp = useSettingsStore((s) => s.systemPrompt);
  const storedSpSrc = useSettingsStore((s) => s.systemPromptSource);
  const storedSpFile = useSettingsStore((s) => s.systemPromptFilename);
  const storedSeed = useSettingsStore((s) => s.seedPrompt);
  const storedSeedSrc = useSettingsStore((s) => s.seedPromptSource);
  const storedSeedFile = useSettingsStore((s) => s.seedPromptFilename);
  const storedCtxOvr = useSettingsStore((s) => s.contextOverride);
  const setSystemPrompt = useSettingsStore((s) => s.setSystemPrompt);
  const setSeedPrompt = useSettingsStore((s) => s.setSeedPrompt);
  const setContextOverride = useSettingsStore((s) => s.setContextOverride);

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSpSrc(storedSpSrc);
      setSpText(storedSp);
      setSpFile(storedSpSrc === "file" ? storedSp : "");
      setSpFilename(storedSpFile);
      setSeedSrc(storedSeedSrc);
      setSeedText(storedSeed);
      setSeedFile(storedSeedSrc === "file" ? storedSeed : "");
      setSeedFilename(storedSeedFile);
      setOverrideStr(storedCtxOvr === null ? "" : String(storedCtxOvr));
      setError(null);
    }
  }, [open, storedSpSrc, storedSp, storedSpFile, storedSeed, storedSeedSrc, storedSeedFile, storedCtxOvr]);

  const serverMax = perSlotCtx(serverInfo);

  const save = () => {
    setError(null);

    // System prompt
    if (spSrc === "text") {
      setSystemPrompt(spText.trim() ? "text" : "none", spText, null);
    } else if (spSrc === "file") {
      if (!spFile) {
        setError("System prompt: pick a file first.");
        return;
      }
      setSystemPrompt("file", spFile, spFilename);
    } else {
      setSystemPrompt("none", "", null);
    }

    // Seed prompt
    if (seedSrc === "text") {
      setSeedPrompt(seedText.trim() ? "text" : "none", seedText, null);
    } else if (seedSrc === "file") {
      if (!seedFile) {
        setError("Seed prompt: pick a file first.");
        return;
      }
      setSeedPrompt("file", seedFile, seedFilename);
    } else {
      setSeedPrompt("none", "", null);
    }

    // Context override
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

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Prompts, context window, and model behavior. Saved to your browser.
          </DialogDescription>
        </DialogHeader>

        {/* System prompt */}
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

        {/* Seed prompt */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Label>Seed prompt</Label>
            <HintIcon text="Prepended to the first user message. Defines WHAT the conversation is about — scenario setup, rules, context. Stays anchored at conversation start and is never re-injected. Always pinned (never truncated)." />
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

        {/* Context override */}
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
                {parseInt(overrideStr, 10).toLocaleString()} exceeds the server
                max; will be clamped to {serverMax.toLocaleString()}.
              </p>
            )}
        </div>

        {error && (
          <p
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground"
            data-testid="settings-error"
          >
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="settings-cancel"
          >
            Cancel
          </Button>
          <Button onClick={save} data-testid="settings-save">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
