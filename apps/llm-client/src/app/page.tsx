"use client";

import { ChatSidebar } from "@/components/sidebar/chat-sidebar";
import { ChatPane } from "@/components/chat/chat-pane";
import { ServerGate } from "@/components/settings/server-gate";

export default function Home() {
  return (
    <ServerGate>
      <main className="flex h-dvh w-full">
        <ChatSidebar />
        <ChatPane />
      </main>
    </ServerGate>
  );
}
