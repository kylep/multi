"use client";

import { useState } from "react";
import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { ChatPane } from "@/components/chat/chat-pane";
import { SettingsPane } from "@/components/settings/settings-pane";
import { ServerGate } from "@/components/settings/server-gate";

export default function Home() {
  const [view, setView] = useState<"chat" | "settings">("chat");

  return (
    <ServerGate>
      <main className="flex h-dvh w-full">
        <ChatSidebar
          onSettingsOpen={() => setView("settings")}
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
