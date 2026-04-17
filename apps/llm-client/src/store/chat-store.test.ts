import { beforeEach, describe, expect, it } from "vitest";
import { partializeChatStore, useChatStore } from "./chat-store";

function resetStore() {
  useChatStore.setState({
    chats: {},
    chatOrder: [],
    activeChatId: null,
    streaming: null,
  });
}

describe("chat store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("newChat creates and selects a new chat and prepends to order", () => {
    const a = useChatStore.getState().newChat();
    const b = useChatStore.getState().newChat();
    const state = useChatStore.getState();
    expect(state.chats[a]).toBeDefined();
    expect(state.chats[b]).toBeDefined();
    expect(state.chatOrder[0]).toBe(b);
    expect(state.chatOrder[1]).toBe(a);
    expect(state.activeChatId).toBe(b);
  });

  it("newChat initializes with empty summary", () => {
    const id = useChatStore.getState().newChat();
    expect(useChatStore.getState().chats[id].summary).toBe("");
  });

  it("appendMessage sets title from first user message", () => {
    const id = useChatStore.getState().newChat();
    useChatStore
      .getState()
      .appendMessage(id, { role: "user", content: "What is life?" });
    expect(useChatStore.getState().chats[id].title).toBe("What is life?");
  });

  it("appendMessage updates updatedAt and returns message id", () => {
    const id = useChatStore.getState().newChat();
    const before = useChatStore.getState().chats[id].updatedAt;
    const msgId = useChatStore
      .getState()
      .appendMessage(id, { role: "user", content: "hi" });
    expect(msgId).toBeTruthy();
    const after = useChatStore.getState().chats[id].updatedAt;
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("appendToLastMessage concatenates instead of creating a new message", () => {
    const id = useChatStore.getState().newChat();
    useChatStore
      .getState()
      .appendMessage(id, { role: "assistant", content: "He" });
    useChatStore.getState().appendToLastMessage(id, "llo");
    useChatStore.getState().appendToLastMessage(id, " world");
    const msgs = useChatStore.getState().chats[id].messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe("Hello world");
  });

  it("deleteChat removes from map + order and clears active if it was active", () => {
    const id = useChatStore.getState().newChat();
    useChatStore.getState().deleteChat(id);
    const state = useChatStore.getState();
    expect(state.chats[id]).toBeUndefined();
    expect(state.chatOrder).not.toContain(id);
    expect(state.activeChatId).toBeNull();
  });

  it("renameChat updates title", () => {
    const id = useChatStore.getState().newChat();
    useChatStore.getState().renameChat(id, "Renamed");
    expect(useChatStore.getState().chats[id].title).toBe("Renamed");
  });

  it("setSummary persists rolling summary", () => {
    const id = useChatStore.getState().newChat();
    useChatStore.getState().setSummary(id, "Player fought wolves.");
    expect(useChatStore.getState().chats[id].summary).toBe(
      "Player fought wolves.",
    );
    useChatStore
      .getState()
      .setSummary(id, "Player fought wolves. Then met Lyra.");
    expect(useChatStore.getState().chats[id].summary).toBe(
      "Player fought wolves. Then met Lyra.",
    );
  });

  it("partialize excludes streaming state from persistence", () => {
    const state = useChatStore.getState();
    state.setStreaming({ chatId: "x", abort: () => {} });
    const snapshot = partializeChatStore(useChatStore.getState());
    expect("streaming" in snapshot).toBe(false);
    expect(snapshot).toHaveProperty("chats");
    expect(snapshot).toHaveProperty("chatOrder");
    expect(snapshot).toHaveProperty("activeChatId");
  });

  it("selectChat is a no-op for unknown ids", () => {
    const a = useChatStore.getState().newChat();
    useChatStore.getState().selectChat("not-a-real-id");
    expect(useChatStore.getState().activeChatId).toBe(a);
  });
});
