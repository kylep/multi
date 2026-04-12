# llm-client

A local, browser-based chat UI for [`llama-server`](https://github.com/ggerganov/llama.cpp/tree/master/tools/server)
or any OpenAI-compatible endpoint. Next.js 16 + Tailwind v4 + shadcn/ui +
zustand. Everything runs on `127.0.0.1` — nothing leaves your machine.

## Quick start

```bash
# First time
bin/install.sh

# Start the dev server (default port 3100)
bin/start-dev.sh

# Or with a custom port
bin/start-dev.sh 3200

# Stop
bin/kill-dev.sh
```

Requires a running llama-server (or compatible) at `http://127.0.0.1:8080`.
The endpoint is configurable in the UI — click the "Connected to" pill in the
sidebar footer.

## Features

### Chat
- ChatGPT-style sidebar with multiple chats
- Streaming assistant replies over SSE with Stop button
- Markdown rendering in bot replies (GFM + syntax-highlighted code)
- Chat history persisted to `localStorage` (no server-side storage)

### Prompts
- **System prompt** — sent as `role: "system"`. Controls *how* the model
  behaves (style, tone, formatting). Re-applied by the model's chat template
  each turn. Supports text or file input.
- **Seed prompt** — prepended to the first user message content. Defines
  *what* the conversation is about (scenario, rules, context). Stays anchored
  at conversation start, never re-injected. Always pinned. Supports text or
  file input.

The distinction matters for models like Mistral whose chat template
re-injects system messages with the last user turn. Use seed prompt for
context that shouldn't repeat.

### Context management
- **Dynamic budget** — reads `n_ctx / total_slots` from the server's `/props`
  endpoint. Falls back to 2048 tokens/slot.
- **Tail-drop truncation** — oldest unpinned messages are dropped first.
  Pinned messages and the seed-augmented first message survive truncation.
- **Auto-summarize** (on by default) — when messages are about to be dropped,
  generates a 2-3 sentence summary via the model and injects it as context.
  Preserves narrative memory across the truncation boundary.
- **Pin messages** — click the pin icon on any message to protect it from
  truncation.
- **Context meter** — bottom-right shows live `X% ctx` usage. Red at 100%
  with a "CONTEXT CUTOFF" rule in the transcript.
- **Context override** — cap per-slot tokens in Settings for testing or
  headroom reservation.
- **Real tokenizer** — uses llama-server's `/tokenize` endpoint for accurate
  counts. Falls back to `chars/4` when unavailable.

### Response quality
- **Duplicate retry** (on by default) — detects when the model repeats a
  previous response (≥85% similarity). Retries up to 2x with progressively
  higher temperature.

### Server
- Any OpenAI-compatible `/v1/chat/completions` endpoint works.
- Endpoint verified via `/v1/models` before use. Optionally probes
  `/props` for llama-server metadata (model, params, context, slots,
  modalities).
- Server info card in the endpoint dialog with ELI5 tooltips on each field.
- Blocking modal on startup if the server is unreachable.

## Scripts

| Script | Purpose |
|---|---|
| `bin/install.sh` | `pnpm install` + Playwright browsers |
| `bin/start-dev.sh [port]` | Start dev server (default 3100) |
| `bin/kill-dev.sh` | Stop dev server |
| `bin/test.sh` | Run unit + E2E tests |

## Tests

```bash
# Unit tests (Vitest, jsdom) — 75 tests
pnpm test

# E2E tests (Playwright, mocked endpoints) — 7 specs
pnpm e2e

# Both
bin/test.sh
```

E2E tests mock `/v1/chat/completions`, `/v1/models`, and `/props` via
Playwright route handlers — no running llama-server needed.

## Project layout

```
src/
├── app/                 Next.js App Router (single page)
├── components/
│   ├── chat/            chat-pane, composer, message list/bubble
│   ├── settings/        endpoint dialog, settings dialog, server info
│   ├── sidebar/         chat list, row actions
│   └── ui/              shadcn primitives
├── lib/
│   ├── llama-client.ts  SSE streaming fetch client
│   ├── context-manager.ts  budget + truncation + seed logic
│   ├── tokens.ts        real tokenizer (via /tokenize) + chars/4 fallback
│   ├── verify-endpoint.ts  /v1/models + /props probe, perSlotCtx math
│   ├── summarize.ts     auto-summary of dropped messages
│   └── dedup.ts         duplicate response detection
└── store/
    ├── chat-store.ts    chats, messages, pins (zustand + persist)
    └── settings-store.ts  endpoint, prompts, toggles (zustand + persist)
```

## Architecture notes

### Seed vs system prompt
The Mistral Instruct chat template re-injects the system message before the
*last* user turn, not the first. This means `role: "system"` content is
re-read by the model every turn — fine for style guidance, bad for scenario
setup (the model re-executes "define a victory condition" each turn).

The fix: seed prompts are prepended to the first `role: "user"` message
content, so the chat template sees them once at conversation start.

### Context budget
```
perSlotCtx = floor(server.n_ctx / server.total_slots)  // e.g. 2048
inputBudget = perSlotCtx - REPLY_BUDGET(512) - SAFETY(64)  // e.g. 1472
```

Pinned messages (including the seed-augmented first message) are always
included. Remaining budget fills newest→oldest unpinned messages. When
auto-summarize is on, dropped messages are summarized and injected as a
system message.

### Persistence
Two localStorage keys:
- `llm-client/chat-store/v1` — chats, messages, pins
- `llm-client/settings/v1` — endpoint, server info, prompts, toggles
