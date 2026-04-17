"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSettingsStore } from "@/store/settings-store";
import { verifyEndpoint } from "@/lib/verify-endpoint";
import { log } from "@/lib/logger";
import { setTokenizeEndpoint } from "@/lib/tokens";
import { EndpointDialog } from "./endpoint-dialog";

type GateState =
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "error"; error: string };

export function ServerGate({ children }: { children: React.ReactNode }) {
  const endpoint = useSettingsStore((s) => s.endpoint);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const modelId = useSettingsStore((s) => s.modelId);
  const setServerInfo = useSettingsStore((s) => s.setServerInfo);
  const [gate, setGate] = useState<GateState>({ kind: "checking" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setGate({ kind: "checking" });
    log.info(`serverGate: verifying ${endpoint}`);
    (async () => {
      const result = await verifyEndpoint(endpoint, 5000, apiKey || undefined, modelId || undefined);
      if (cancelled) return;
      if (result.ok && result.info) {
        log.info(`serverGate: connected to ${result.info.endpoint}, model=${result.info.modelId}`);
        setServerInfo(result.info);
        setTokenizeEndpoint(result.info.endpoint);
        setGate({ kind: "ok" });
      } else {
        log.warn(`serverGate: failed to verify ${endpoint}: ${result.error}`);
        setServerInfo(null);
        setGate({
          kind: "error",
          error: result.error ?? "Unreachable",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [endpoint, apiKey, modelId, retryKey, setServerInfo]);

  if (gate.kind === "checking") {
    return (
      <main
        className="flex h-dvh w-full items-center justify-center"
        data-testid="gate-checking"
      >
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting to {endpoint}…
        </div>
      </main>
    );
  }

  if (gate.kind === "error") {
    return (
      <>
        <main
          className="flex h-dvh w-full items-center justify-center bg-background"
          data-testid="gate-blocked"
        >
          <div className="flex max-w-sm flex-col items-center gap-2 text-center">
            <div className="text-lg font-semibold">llm-client</div>
            <p className="text-sm text-muted-foreground">
              Waiting for a reachable server…
            </p>
          </div>
        </main>
        <EndpointDialog
          open
          blocking
          initialError={gate.error}
          onOpenChange={() => {}}
          onVerified={() => setRetryKey((k) => k + 1)}
        />
      </>
    );
  }

  return <>{children}</>;
}
