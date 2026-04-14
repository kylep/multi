"use client";

import { Eye, Info, Mic, Type } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ServerInfo } from "@/lib/verify-endpoint";
import { perSlotCtx } from "@/lib/verify-endpoint";

interface ServerInfoCardProps {
  info: ServerInfo;
  className?: string;
}

function formatParams(nParams?: number): string | null {
  if (!nParams) return null;
  if (nParams >= 1e9) return `${(nParams / 1e9).toFixed(1)}B`;
  if (nParams >= 1e6) return `${(nParams / 1e6).toFixed(1)}M`;
  return nParams.toLocaleString();
}

function formatSize(bytes?: number): string | null {
  if (!bytes) return null;
  const gib = bytes / (1024 ** 3);
  if (gib >= 1) return `${gib.toFixed(1)} GiB`;
  const mib = bytes / (1024 ** 2);
  return `${mib.toFixed(0)} MiB`;
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        <Tooltip>
          <TooltipTrigger
            type="button"
            aria-label={`What is ${label}?`}
            className="text-muted-foreground/60 transition-colors hover:text-foreground focus:text-foreground"
          >
            <Info className="h-3 w-3" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs leading-snug">
            {hint}
          </TooltipContent>
        </Tooltip>
      </span>
      <span className="truncate text-right font-mono text-xs text-foreground/90">
        {children}
      </span>
    </div>
  );
}

export function ServerInfoCard({ info, className }: ServerInfoCardProps) {
  const params = formatParams(info.nParams);
  const size = formatSize(info.sizeBytes);
  const slotBudget =
    info.nCtx && info.totalSlots ? perSlotCtx(info) : undefined;

  const modalityPills: {
    key: string;
    label: string;
    icon: React.ElementType;
  }[] = [{ key: "text", label: "text", icon: Type }];
  if (info.modalities?.vision) {
    modalityPills.push({ key: "vision", label: "vision", icon: Eye });
  }
  if (info.modalities?.audio) {
    modalityPills.push({ key: "audio", label: "audio", icon: Mic });
  }

  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-border/60 rounded-md border border-border bg-muted/30 px-3",
        className,
      )}
      data-testid="server-info-card"
    >
      <Row
        label="Model"
        hint="The model file the server has loaded. This is the actual brain you're talking to."
      >
        <span title={info.modelAlias ?? info.modelId}>
          {info.modelAlias ?? info.modelId}
        </span>
      </Row>
      {params && (
        <Row
          label="Params"
          hint="How many learned numbers (weights) the model has. Bigger usually means smarter but slower and hungrier for memory."
        >
          {params}
        </Row>
      )}
      {info.nCtx && (
        <Row
          label="Context"
          hint="The total number of tokens the server can hold in memory right now, shared across all parallel slots. To the right is the model's training-time maximum — the theoretical upper bound."
        >
          {info.nCtx.toLocaleString()}
          {info.nCtxTrain ? (
            <span className="text-muted-foreground">
              {" "}
              / {info.nCtxTrain.toLocaleString()} trained
            </span>
          ) : null}
        </Row>
      )}
      {!info.nCtx && info.nCtxTrain && (
        <Row
          label="Ctx (train)"
          hint="The maximum number of tokens this model was trained to handle. The runtime server may be configured lower."
        >
          {info.nCtxTrain.toLocaleString()}
        </Row>
      )}
      {info.totalSlots !== undefined && (
        <Row
          label="Slots"
          hint="How many chat sessions the server can process at the same time. The total context is split evenly between them."
        >
          {info.totalSlots}
        </Row>
      )}
      {slotBudget !== undefined && (
        <Row
          label="Per slot"
          hint="Tokens available for one conversation (context ÷ slots). This is the actual budget llm-client gets per request — older messages are dropped to fit."
        >
          {slotBudget.toLocaleString()} tok
        </Row>
      )}
      {size && (
        <Row
          label="Size"
          hint="How much disk space the model file takes. Bigger files usually need more RAM / VRAM to load."
        >
          {size}
        </Row>
      )}
      {modalityPills.length > 0 && (
        <Row
          label="Modalities"
          hint="What kinds of input the model understands. Text is always on; vision and audio appear only if the model supports them."
        >
          <span className="flex flex-wrap justify-end gap-1">
            {modalityPills.map((m) => {
              const Icon = m.icon;
              return (
                <span
                  key={m.key}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  <Icon className="h-2.5 w-2.5" />
                  {m.label}
                </span>
              );
            })}
          </span>
        </Row>
      )}
    </div>
  );
}
