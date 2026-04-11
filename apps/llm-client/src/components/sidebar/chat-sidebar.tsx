"use client";

import { useState } from "react";
import { Plus, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/store/chat-store";
import { useSettingsStore } from "@/store/settings-store";
import { EndpointDialog } from "@/components/settings/endpoint-dialog";
import { ChatRow } from "./chat-row";

export function ChatSidebar() {
  const chatOrder = useChatStore((s) => s.chatOrder);
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const newChat = useChatStore((s) => s.newChat);
  const selectChat = useChatStore((s) => s.selectChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const endpoint = useSettingsStore((s) => s.endpoint);
  const [endpointOpen, setEndpointOpen] = useState(false);

  return (
    <aside className="flex h-dvh w-[280px] flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-primary/30"
          />
          <span className="font-semibold tracking-tight">llm-client</span>
        </div>
      </div>
      <div className="px-3 pb-2">
        <Button
          onClick={() => newChat()}
          className="w-full justify-start gap-2"
          variant="secondary"
          data-testid="new-chat-btn"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2" aria-label="Chat history">
          {chatOrder.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              No chats yet. Click <span className="font-medium">New chat</span>{" "}
              to start.
            </p>
          ) : (
            chatOrder.map((id) => {
              const chat = chats[id];
              if (!chat) return null;
              return (
                <ChatRow
                  key={id}
                  id={id}
                  title={chat.title}
                  updatedAt={chat.updatedAt}
                  active={id === activeChatId}
                  onSelect={() => selectChat(id)}
                  onDelete={() => deleteChat(id)}
                />
              );
            })
          )}
        </nav>
      </ScrollArea>
      <button
        type="button"
        onClick={() => setEndpointOpen(true)}
        data-testid="endpoint-open"
        className="group flex items-center gap-2 border-t border-border px-4 py-3 text-left text-[11px] text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]"
        />
        <Server className="h-3 w-3" />
        <span className="truncate">
          <span className="text-[9px] uppercase tracking-wider opacity-70">
            Connected to
          </span>{" "}
          <span className="font-mono text-foreground/90">
            {endpoint.replace(/^https?:\/\//, "")}
          </span>
        </span>
      </button>
      <EndpointDialog open={endpointOpen} onOpenChange={setEndpointOpen} />
    </aside>
  );
}
