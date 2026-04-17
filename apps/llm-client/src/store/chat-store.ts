import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ChatRole } from "@/lib/context-manager";

export interface Message {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  summary: string;
  createdAt: number;
  updatedAt: number;
}

export interface StreamingState {
  chatId: string;
  abort: () => void;
}

export interface ChatStore {
  chats: Record<string, Chat>;
  chatOrder: string[];
  activeChatId: string | null;
  streaming: StreamingState | null;

  newChat(): string;
  selectChat(id: string): void;
  deleteChat(id: string): void;
  renameChat(id: string, title: string): void;
  appendMessage(
    chatId: string,
    msg: Omit<Message, "id" | "createdAt">,
  ): string;
  appendToLastMessage(chatId: string, delta: string): void;
  setSummary(chatId: string, summary: string): void;
  setStreaming(streaming: StreamingState | null): void;
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function deriveTitle(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 40) return trimmed || "New chat";
  return trimmed.slice(0, 40) + "…";
}

export const partializeChatStore = (state: ChatStore) => ({
  chats: state.chats,
  chatOrder: state.chatOrder,
  activeChatId: state.activeChatId,
});

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: {},
      chatOrder: [],
      activeChatId: null,
      streaming: null,

      newChat() {
        const id = uid();
        const now = Date.now();
        const chat: Chat = {
          id,
          title: "New chat",
          messages: [],
          summary: "",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          chats: { ...s.chats, [id]: chat },
          chatOrder: [id, ...s.chatOrder.filter((x) => x !== id)],
          activeChatId: id,
        }));
        return id;
      },

      selectChat(id) {
        if (!get().chats[id]) return;
        set({ activeChatId: id });
      },

      deleteChat(id) {
        set((s) => {
          const next = { ...s.chats };
          delete next[id];
          return {
            chats: next,
            chatOrder: s.chatOrder.filter((x) => x !== id),
            activeChatId: s.activeChatId === id ? null : s.activeChatId,
          };
        });
      },

      renameChat(id, title) {
        set((s) => {
          const chat = s.chats[id];
          if (!chat) return s;
          return {
            chats: {
              ...s.chats,
              [id]: { ...chat, title, updatedAt: Date.now() },
            },
          };
        });
      },

      appendMessage(chatId, msg) {
        const id = uid();
        const createdAt = Date.now();
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          const messages = [...chat.messages, { ...msg, id, createdAt }];
          const title =
            chat.messages.length === 0 && msg.role === "user"
              ? deriveTitle(msg.content)
              : chat.title;
          const newChat: Chat = {
            ...chat,
            title,
            messages,
            updatedAt: createdAt,
          };
          return {
            chats: { ...s.chats, [chatId]: newChat },
            chatOrder: [chatId, ...s.chatOrder.filter((x) => x !== chatId)],
          };
        });
        return id;
      },

      appendToLastMessage(chatId, delta) {
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat || chat.messages.length === 0) return s;
          const messages = chat.messages.slice();
          const last = messages[messages.length - 1];
          messages[messages.length - 1] = {
            ...last,
            content: last.content + delta,
          };
          return {
            chats: {
              ...s.chats,
              [chatId]: { ...chat, messages, updatedAt: Date.now() },
            },
          };
        });
      },

      setSummary(chatId, summary) {
        set((s) => {
          const chat = s.chats[chatId];
          if (!chat) return s;
          return {
            chats: {
              ...s.chats,
              [chatId]: { ...chat, summary, updatedAt: Date.now() },
            },
          };
        });
      },

      setStreaming(streaming) {
        set({ streaming });
      },
    }),
    {
      name: "llm-client/chat-store/v1",
      storage: createJSONStorage(() => localStorage),
      partialize: partializeChatStore,
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> | null;
        if (p?.chats) {
          // Strip stale {X}...{/X} color tags from persisted messages
          // so the model doesn't mimic them in new responses.
          const TAG_RE = /\{[a-z]\}|\{\/[a-z]\}/g;
          const chats = p.chats as Record<string, Chat>;
          for (const chat of Object.values(chats)) {
            for (const msg of chat.messages) {
              if (TAG_RE.test(msg.content)) {
                msg.content = msg.content.replace(TAG_RE, "");
              }
            }
          }
        }
        return { ...current, ...(p as Partial<ChatStore>) };
      },
    },
  ),
);
