"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { ChatPane } from "@/components/chat/chat-pane";
import { SettingsPane } from "@/components/settings/settings-pane";
import { ServerGate } from "@/components/settings/server-gate";
import { useChatStore } from "@/store/chat-store";
import { VERSION } from "@/lib/version";

export default function Home() {
  useEffect(() => {
    console.log(`[llm-client] v${VERSION}`);
  }, []);
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
        <div className={view === "settings" ? "hidden" : "flex min-w-0 flex-1"}>
          <ChatPane />
        </div>
        <div className={view === "chat" ? "hidden" : "flex min-w-0 flex-1"}>
          <SettingsPane onClose={() => setView("chat")} />
        </div>
      </main>
    </ServerGate>
  );
}
