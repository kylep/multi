"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { estimateTokens } from "@/lib/tokens";
import type { PromptSource } from "@/store/settings-store";

interface PromptFieldProps {
  id: string;
  source: PromptSource;
  onSourceChange: (s: PromptSource) => void;
  textValue: string;
  onTextChange: (v: string) => void;
  fileValue: string;
  onFileLoaded: (content: string, name: string) => void;
  filename: string | null;
  placeholder?: string;
}

export function PromptField({
  id,
  source,
  onSourceChange,
  textValue,
  onTextChange,
  fileValue,
  onFileLoaded,
  filename,
  placeholder,
}: PromptFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const activeText = source === "file" ? fileValue : textValue;
  const tokenCount = estimateTokens(activeText);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      onFileLoaded(text, file.name);
      setError(null);
    } catch (err) {
      setError(`Couldn't read file: ${(err as Error).message}`);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Tabs
        value={source === "none" ? "text" : source}
        onValueChange={(v) => onSourceChange(v as PromptSource)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" data-testid={`${id}-tab-text`}>
            <FileText className="mr-1.5 h-3 w-3" />
            Text
          </TabsTrigger>
          <TabsTrigger value="file" data-testid={`${id}-tab-file`}>
            <Upload className="mr-1.5 h-3 w-3" />
            File
          </TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="mt-2 flex flex-col gap-1.5">
          <Textarea
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={placeholder ?? "Enter prompt…"}
            className="min-h-[100px] font-mono text-xs"
            data-testid={`${id}-textarea`}
          />
        </TabsContent>
        <TabsContent value="file" className="mt-2 flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,.prompt,.sysf,text/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid={`${id}-file-input`}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              data-testid={`${id}-file-pick`}
            >
              <Upload className="mr-1.5 h-3 w-3" />
              {filename ? "Change file" : "Pick a file"}
            </Button>
            {filename && (
              <span className="truncate text-xs text-muted-foreground">
                {filename}
              </span>
            )}
          </div>
          {fileValue && (
            <pre className="max-h-[100px] overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted/40 p-2 text-[11px] leading-snug font-mono">
              {fileValue}
            </pre>
          )}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </TabsContent>
      </Tabs>
      <p className="text-right text-[10px] text-muted-foreground">
        ≈ {tokenCount.toLocaleString()} tokens
      </p>
    </div>
  );
}
