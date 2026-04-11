# llm-client

A local, browser-based chat UI for [`llama-server`](https://github.com/ggerganov/llama.cpp/tree/master/tools/server).
Next.js 16 + Tailwind v4 + shadcn/ui + zustand. Everything runs on
`127.0.0.1` — nothing leaves your machine.

## Features (v1)

- ChatGPT-style sidebar with multiple chats
- Streaming assistant replies over SSE
- Stop button to abort an in-flight response (keeps partial text)
- Markdown rendering in bot replies (GFM + syntax-highlighted code)
- Context-window management: oldest messages are dropped to fit the
  server's per-slot budget (tail-truncation, no summarization)
- Chats + history persisted to `localStorage` via zustand `persist`

## Prerequisites

A running `llama-server` on `http://127.0.0.1:8080` that exposes the
OpenAI-compatible `/v1/chat/completions` streaming endpoint.

Verify it's up:

```bash
curl -s http://127.0.0.1:8080/health
# → {"status":"ok"}
```

If your server is on a different host/port, edit `DEFAULT_ENDPOINT` in
`src/lib/llama-client.ts`.

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Tests

Unit tests (Vitest, jsdom):

```bash
pnpm test         # run once
pnpm test:watch   # watch mode
```

End-to-end tests (Playwright, mocks `/v1/chat/completions`):

```bash
pnpm exec playwright install chromium   # first time only
pnpm e2e
```

The E2E tests do **not** require a running llama-server — they mock the
streaming endpoint via `page.route`.

## Project layout

```
src/
├── app/               Next.js App Router entry (single-page chat UI)
├── components/
│   ├── chat/          chat-pane, composer, message list/bubble
│   ├── sidebar/       chat list + row actions
│   └── ui/            shadcn primitives
├── lib/
│   ├── llama-client.ts    SSE streaming fetch client
│   ├── context-manager.ts budgeted truncation
│   └── tokens.ts          rough token estimator
└── store/
    └── chat-store.ts  zustand + persist(localStorage)
```

## Context budget (v1)

The context manager assumes a tight per-slot budget. Defaults in
`src/lib/context-manager.ts`:

- `PER_SLOT_CTX = 2048`
- `REPLY_BUDGET = 512`
- `INPUT_BUDGET = PER_SLOT_CTX − REPLY_BUDGET − 64`

Oldest messages are dropped first; if even the newest single message is
oversized, its leading characters are truncated. No summarization or
compaction is performed in this release.

## Explicitly out of scope (v1)

- Summarization / compaction of old turns
- Settings panel (temperature, system prompt, model picker)
- Auth and multi-user
- Light-mode toggle
- Mobile-first layout
- Message editing / regeneration
- Tool-calling / function-calling
