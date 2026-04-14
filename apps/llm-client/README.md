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
- LLM-generated chat titles (max 6 words, async after first response)
- Inline rename (pencil icon) and delete (trash icon) on hover
- Streaming assistant replies over SSE with Stop button
- Regenerate button on hover over any bot message (temp +0.15)
- Retry button on error responses
- Markdown rendering in bot replies (GFM + syntax-highlighted code)
- Chat history persisted to `localStorage` (no server-side storage)
- New Chat button reuses empty chats instead of creating duplicates

### Prompts
- **System prompt** — sent as `role: "system"`. Controls *how* the model
  behaves (style, tone, formatting). Re-applied by the model's chat template
  each turn. Supports text or file input.
- **Seed prompt** — prepended to the first user message content. Defines
  *what* the conversation is about (scenario, rules, context). Stays anchored
  at conversation start, never re-injected. Always kept in context. Supports
  text or file input.

The distinction matters for models like Mistral whose chat template
re-injects system messages with the last user turn. Use seed prompt for
context that shouldn't repeat.

### Context management
- **Dynamic budget** — reads `n_ctx / total_slots` from the server's `/props`
  endpoint. Falls back to 2048 tokens/slot. Reply budget scales proportionally
  (`min(1024, 50% of per-slot)`, configurable in Settings).
- **Tail-drop truncation** — oldest messages are dropped first. The
  seed-augmented first message is always kept.
- **Rolling compaction** (on by default) — when context hits 80%, the
  oldest 50% of non-seed messages are summarized into a persistent
  "Story so far" that grows across compaction events. Editable in the
  chat transcript. Summary budget capped at a configurable % (default 25%).
  If the summary overshoots its budget, retries up to 2x with a "shorten"
  prompt. After compaction, if reply room would be below the min reply
  tokens threshold (default 500, configurable), the summary is trimmed
  to guarantee the model has room to respond.
- **Context meter** — bottom-right shows live `X% ctx` usage. Amber at
  80%, red at 100%. "compacting..." indicator during summarization.
- **Context override** — cap per-slot tokens in Settings for testing or
  headroom reservation.
- **Real tokenizer** — uses llama-server's `/tokenize` endpoint for accurate
  counts with LRU cache. Falls back to `chars/4` when unavailable.

### Post-processing

All post-processing runs after streaming completes (Stop button clears
immediately). Configurable in Settings > Post-processing.

- **Duplicate retry** (on by default) — detects when the model repeats a
  previous response (≥70% similarity, checks last 5 assistant messages).
  Retries up to 2x with progressively higher temperature.
- **Choice extraction** (on by default) — detects numbered option lists
  (2-5 items) at the end of responses. Strips them from the message bubble
  and presents them as clickable buttons above the composer. Clicking a
  button sends that choice. User can still type freely.
- **Colour support** (on by default) — a second-pass call asks the model
  to annotate its own response with `{X}word{/X}` colour codes. No tokens
  consumed from the main context. Editable colour prompt in Settings.

### Colour & style codes

18 codes available (15 colours + 3 formats). All render via inline styles.
The second-pass prompt only promotes a subset; the rest render if used.

**Colours (15):**

| Code | Colour | Hex | Code | Colour | Hex |
|------|--------|---------|------|--------|---------|
| `{r}` | Red | `#ef4444` | `{p}` | Purple | `#a855f7` |
| `{g}` | Green | `#22c55e` | `{k}` | Pink | `#f472b6` |
| `{b}` | Blue | `#3b82f6` | `{n}` | Brown | `#a16207` |
| `{y}` | Yellow | `#eab308` | `{l}` | Lime | `#84cc16` |
| `{m}` | Magenta | `#d946ef` | `{t}` | Teal | `#2dd4bf` |
| `{c}` | Cyan | `#06b6d4` | `{s}` | Slate | `#94a3b8` |
| `{o}` | Orange | `#f97316` | `{a}` | Amber | `#f59e0b` |
| `{w}` | Bold white | `#f8fafc` | | | |

**Formats (3):**

| Code | Effect |
|------|--------|
| `{i}` | Italic |
| `{d}` | Dim (50% opacity) |
| `{u}` | Underline |

**Cost:** 5 tokens per use (2 open + 3 close). Zero context cost — the
colour prompt is a separate second-pass call, not injected into the main
conversation. Adding codes: one line in `STYLE_CODES` in
`src/lib/colors.ts`.

### Settings

Full-pane settings (replaces chat area, sidebar stays). Sections:

- **Prompts** — system prompt, seed prompt (text or file picker)
- **Model** — temperature (0-2), context override, reply budget, min reply tokens
- **Behavior** — auto-summarize + summary budget slider
- **Post-processing** — duplicate retry, choice extraction, colour support
  + editable colour prompt

Auto-saves on change (1s debounce). Explicit Save button also available.
Settings survive page reload via localStorage.

### Server
- Any OpenAI-compatible `/v1/chat/completions` endpoint works.
- Endpoint verified via `/v1/models` before use. Optionally probes
  `/props` for llama-server metadata (model, params, context, slots,
  modalities).
- Server info card in the endpoint dialog with ELI5 tooltips on each field.
- Blocking modal on startup if the server is unreachable.

### Logging

Structured logging via `src/lib/logger.ts`. Level set to `"info"` by
default (change to `"debug"` or `"none"` in the source). Output prefixed
with `[llm-client] + timestamp + level`. Logs at: server gate, context
manager, streaming, compaction, summarize, dedup, colorize, title
generation.

## Scripts

| Script | Purpose |
|---|---|
| `bin/install.sh` | `pnpm install` + Playwright browsers |
| `bin/start-dev.sh [port]` | Start dev server (default 3100) |
| `bin/kill-dev.sh` | Stop dev server |
| `bin/test.sh` | Run unit + E2E tests |

## Tests

```bash
# Unit tests (Vitest, jsdom) — 108 tests
pnpm test

# E2E tests (Playwright, mocked endpoints) — 10 specs
pnpm e2e

# Both
bin/test.sh
```

E2E tests mock `/v1/chat/completions`, `/v1/models`, and `/props` via
Playwright route handlers — no running llama-server needed.

## Project layout

```text
src/
├── app/                 Next.js App Router (single page)
├── components/
│   ├── chat/            chat-pane, composer, message list/bubble,
│   │                    choice-buttons, summary-panel
│   ├── settings/        endpoint dialog, settings pane, server info,
│   │                    prompt field
│   ├── sidebar/         chat list, chat row (inline edit/delete)
│   └── ui/              shadcn primitives
├── lib/
│   ├── llama-client.ts      SSE streaming fetch client
│   ├── context-manager.ts   budget + truncation + compaction logic
│   ├── tokens.ts            real tokenizer (via /tokenize) + fallback
│   ├── verify-endpoint.ts   /v1/models + /props probe, perSlotCtx
│   ├── summarize.ts         rolling compaction with retry
│   ├── dedup.ts             duplicate response detection (5-msg lookback)
│   ├── colors.ts            style code definitions + processColors()
│   ├── colorize-pass.ts     second-pass colour annotation
│   ├── extract-choices.ts   numbered option list extraction
│   ├── generate-title.ts    LLM-generated chat titles
│   └── logger.ts            structured logging with levels
└── store/
    ├── chat-store.ts        chats, messages, summary (zustand + persist)
    └── settings-store.ts    endpoint, prompts, toggles (zustand + persist)
```

## Architecture notes

### Seed vs system prompt
The Mistral Instruct chat template re-injects the system message before the
*last* user turn, not the first. This means `role: "system"` content is
re-read by the model every turn — fine for style guidance, bad for scenario
setup (the model re-executes "define a victory condition" each turn).

The fix: seed prompts are prepended to the first `role: "user"` message
content, so the chat template sees them once at conversation start.

### Context layout
```text
[system prompt (role:system)]
→ [seed + story-so-far + first user msg]
→ [recent user/assistant turns that fit]
```

### Context budget
```text
replyBudget = min(1024, perSlotCtx * 0.5)  // or user override
inputBudget = perSlotCtx - replyBudget - SAFETY(64)
effectiveMaxTokens = min(replyBudget, perSlot - usedInput - SAFETY)
```

The seed-augmented first message (with compacted summary embedded) is always
kept. Remaining budget fills newest→oldest messages. When compaction fires,
dropped messages are summarized and the summary is embedded in the first
user message alongside the seed.

Role alternation is enforced: if truncation would create consecutive
same-role messages (breaking Mistral-style templates), the seed message
is merged into the first kept user message instead of being a separate
entry.

### Post-processing pipeline
After streaming completes:
1. Colorize (second-pass annotation call, if enabled)
2. Dedup check + retry (if enabled)
3. Choice extraction (if enabled)
4. Title generation (async, first response only)

### Persistence
Two localStorage keys:
- `llm-client/chat-store/v1` — chats, messages, summary
- `llm-client/settings/v1` — endpoint, server info, prompts, toggles,
  temperature, colour prompt
