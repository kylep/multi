"use client";

import { useCallback, useState } from "react";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { ChatPane } from "@/components/chat/chat-pane";
import { SettingsPane } from "@/components/settings/settings-pane";
import { ServerGate } from "@/components/settings/server-gate";
import { useChatStore } from "@/store/chat-store";

export default function Home() {
  const [view, setView] = useState<"chat" | "settings">("chat");
  const selectChat = useChatStore((s) => s.selectChat);

  const handleChatSelect = useCallback(
    (id: string) => {
      selectChat(id);
      setView("chat");
    },
    [selectChat],
  );

  return (
    <ServerGate>
      <main className="flex h-dvh w-full">
        <ChatSidebar
          onSettingsOpen={() => setView("settings")}
          onChatSelect={handleChatSelect}
          settingsActive={view === "settings"}
        />
        {view === "settings" ? (
          <SettingsPane onClose={() => setView("chat")} />
        ) : (
          <ChatPane />
        )}
      </main>
    </ServerGate>
  );
}
