"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ENDPOINT,
  normalizeEndpoint,
  useSettingsStore,
} from "@/store/settings-store";
import {
  verifyEndpoint,
  type ServerInfo,
  type VerifyResult,
} from "@/lib/verify-endpoint";
import { ServerInfoCard } from "./server-info-card";

interface EndpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocking?: boolean;
  initialError?: string;
  onVerified?: (result: VerifyResult) => void;
}

type ProbeState =
  | { kind: "idle" }
  | { kind: "cached"; info: ServerInfo }
  | { kind: "checking" }
  | { kind: "ok"; info: ServerInfo }
  | { kind: "error"; error: string };

export function EndpointDialog({
  open,
  onOpenChange,
  blocking = false,
  initialError,
  onVerified,
}: EndpointDialogProps) {
  const endpoint = useSettingsStore((s) => s.endpoint);
  const cachedInfo = useSettingsStore((s) => s.serverInfo);
  const setEndpoint = useSettingsStore((s) => s.setEndpoint);
  const setServerInfo = useSettingsStore((s) => s.setServerInfo);
  const [draft, setDraft] = useState(endpoint || DEFAULT_ENDPOINT);
  const [probe, setProbe] = useState<ProbeState>(
    initialError ? { kind: "error", error: initialError } : { kind: "idle" },
  );

  useEffect(() => {
    if (open) {
      const effective = endpoint || DEFAULT_ENDPOINT;
      setDraft(effective);
      if (initialError) {
        setProbe({ kind: "error", error: initialError });
      } else if (cachedInfo && cachedInfo.endpoint === effective) {
        setProbe({ kind: "cached", info: cachedInfo });
      } else {
        setProbe({ kind: "idle" });
      }
    }
  }, [open, endpoint, cachedInfo, initialError]);

  const runCheck = async () => {
    setProbe({ kind: "checking" });
    const normalized = normalizeEndpoint(draft);
    const result = await verifyEndpoint(normalized);
    if (result.ok && result.info) {
      setProbe({ kind: "ok", info: result.info });
    } else {
      setProbe({ kind: "error", error: result.error ?? "Unknown error" });
    }
  };

  const save = () => {
    if (probe.kind !== "ok") return;
    setEndpoint(probe.info.endpoint);
    setServerInfo(probe.info);
    onVerified?.({ ok: true, endpoint: probe.info.endpoint, info: probe.info });
    onOpenChange(false);
  };

  const handleDraftChange = (next: string) => {
    setDraft(next);
    // If we were showing cached data, invalidate it as soon as the user
    // edits the input — the info no longer corresponds to what's typed.
    if (probe.kind === "cached" || probe.kind === "ok") {
      setProbe({ kind: "idle" });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (blocking && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!blocking}
        onEscapeKeyDown={(e) => {
          if (blocking) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (blocking) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            {blocking ? "Can't reach your llama-server" : "Server endpoint"}
          </DialogTitle>
          <DialogDescription>
            {blocking
              ? "llm-client needs a reachable OpenAI-compatible server before it can start. Enter an address below and verify it."
              : "Point llm-client at any OpenAI-compatible server. The endpoint is verified before it's saved."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label htmlFor="endpoint-url" className="text-xs font-medium text-muted-foreground">
            Base URL
          </label>
          <input
            id="endpoint-url"
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            placeholder={DEFAULT_ENDPOINT}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring"
            data-testid="endpoint-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") runCheck();
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            e.g. <code>http://127.0.0.1:8080</code>,{" "}
            <code>http://localhost:11434</code>
          </p>
        </div>

        <div
          className={cn(
            "flex min-h-[44px] items-start gap-2 rounded-md border px-3 py-2 text-xs",
            (probe.kind === "ok" || probe.kind === "cached") &&
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
            probe.kind === "error" &&
              "border-destructive/40 bg-destructive/10 text-destructive-foreground",
            (probe.kind === "idle" || probe.kind === "checking") &&
              "border-border bg-muted/40 text-muted-foreground",
          )}
          data-testid="probe-status"
        >
          {probe.kind === "idle" && (
            <span>Click <b>Verify</b> to probe the server.</span>
          )}
          {probe.kind === "checking" && (
            <>
              <Loader2 className="mt-0.5 h-3.5 w-3.5 animate-spin" />
              <span>Contacting {normalizeEndpoint(draft)}…</span>
            </>
          )}
          {probe.kind === "ok" && (
            <>
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
              <span>Reachable.</span>
            </>
          )}
          {probe.kind === "cached" && (
            <>
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
              <span>
                Currently connected. Click <b>Verify</b> to re-probe.
              </span>
            </>
          )}
          {probe.kind === "error" && (
            <>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
              <span>{probe.error}</span>
            </>
          )}
        </div>

        {(probe.kind === "ok" || probe.kind === "cached") && (
          <ServerInfoCard info={probe.info} className="mt-1" />
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="secondary"
            onClick={runCheck}
            disabled={probe.kind === "checking" || !draft.trim()}
            data-testid="endpoint-verify"
          >
            {probe.kind === "checking" ? "Verifying…" : "Verify"}
          </Button>
          <Button
            onClick={save}
            disabled={probe.kind !== "ok"}
            data-testid="endpoint-save"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
