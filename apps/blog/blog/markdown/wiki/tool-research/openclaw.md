---
title: "OpenClaw"
summary: "Comprehensive feature and capability inventory for OpenClaw — a self-hosted multi-channel gateway for AI agents. Sourced from the project's own docs and source tree."
keywords:
  - openclaw
  - ai-assistant
  - self-hosted
  - byok
  - skills
  - plugins
  - multi-agent
  - gateway
related:
  - wiki/ai-tools.html
  - wiki/custom-tools/openclaw-linear-skill.html
  - wiki/security.html
scope: "Capability and feature surface of OpenClaw, sourced from /Users/kp/gh/openclaw (docs/ + source tree). Covers channels, agents, memory, tools, media, nodes, automation, providers, and extension surfaces. Out of scope: full config schema reference, code-level mechanics, install/deploy specifics."
last_verified: 2026-05-08
---

## What it is

OpenClaw ([openclaw.ai](https://openclaw.ai/), [github.com/openclaw](https://github.com/openclaw))
is a **self-hosted multi-channel gateway** for AI agents. It runs
one long-lived Gateway process per host. The Gateway owns
messaging connections, hosts an embedded agent runtime, exposes a
typed WebSocket API, and serves a web Control UI on the same port
(default `127.0.0.1:18789`). Bring-your-own-key model; the agent
the project ships by default is called **Pi**.

## Architecture

- **One Gateway daemon** owns every messaging connection
  (WhatsApp via Baileys, Telegram via grammY, Discord, Slack,
  Signal, iMessage, WebChat, etc.).
- **Control-plane clients** (CLI, web UI, macOS app, automations)
  connect over WebSocket and use a request/response + push-event
  protocol.
- **Nodes** (macOS / iOS / Android / headless) connect to the
  same WebSocket as `role: node`, declare capabilities, and
  expose commands like `canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `system.run`.
- **Embedded agent runtime** with tool streaming, multi-agent
  routing, isolated sessions, and chunked long-form responses.
- **Canvas host** at `/__openclaw__/canvas/` (agent-editable
  HTML/CSS/JS) and an A2UI host at `/__openclaw__/a2ui/`.

## Channels

A single Gateway speaks 22+ messaging surfaces simultaneously,
split into three tiers.

| Tier | Channels |
|------|----------|
| Built-in | Discord, Google Chat, iMessage, IRC, Signal, Slack, Telegram, WebChat, WhatsApp |
| Bundled plugins | Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo, Zalo Personal |
| Optional / third-party plugins | Voice Call, WeChat |

Cross-cutting channel features:

- **Per-channel multiple accounts** (e.g. two WhatsApp numbers, a
  separate Discord bot per agent), routed via `bindings`.
- **Group support** with mention-based activation, broadcast
  groups, access groups, and per-thread routing.
- **DM safety** via pairing flow, allowlists, and channel-scoped
  policies.
- **Reactions** (status-react and ack-react patterns) and typing
  indicators per channel.

## Agent surfaces

| Surface | Notes |
|---------|-------|
| CLI (`openclaw …`) | Setup wizard, configuration, status, agent invocation, channel/account/binding management, hooks, devices, nodes, memory, tasks |
| TUI | Terminal interactive session (`openclaw tui`) |
| WebChat | Static browser chat that talks to the Gateway over WS |
| Web Control UI | Browser dashboard for chat, config, sessions, nodes |
| macOS menubar app | Companion app; can also run in node mode against the Gateway |
| iOS node | Pairing, Canvas, camera, screen recording, location, voice, push-to-talk |
| Android node | Pairing, Canvas, camera, voice, device commands, SMS, contacts, calendar, call log, notifications, photos, motion sensors |
| Headless node host | Cross-platform `openclaw node run`; exposes `system.run` / `system.which` for remote exec |

## Multi-agent runtime

The Gateway can host **multiple isolated agents** side by side.

- Each agent has its own **workspace**, **state directory**
  (`~/.openclaw/agents/<id>/`), **auth profiles**, **session
  store**, and **model registry**.
- **Bindings** map a `(channel, accountId, peer)` tuple to one
  agent. Routing is deterministic, most-specific wins.
- Per-agent **persona files** loaded into the system prompt:
  - `AGENTS.md` — operating rules
  - `SOUL.md` — voice, stance, personality
  - `USER.md` — operator profile
- Per-agent **tool allow/deny lists**, **sandbox modes**, and
  **model selection** (e.g. one agent on Sonnet for chat, another
  on Opus for deep work).
- **Sub-agents** (background spawns) and an opt-in **agent-to-agent
  messaging** surface (off by default).
- Direct chats collapse to the per-agent `main` session key;
  groups are isolated.

## Memory

Memory is stored as **plain markdown files** in the agent
workspace. The model only "remembers" what gets saved to disk.

| File | Purpose |
|------|---------|
| `MEMORY.md` | Long-term durable facts, preferences, decisions; auto-loaded at session start |
| `memory/YYYY-MM-DD.md` | Daily notes; today + yesterday auto-loaded |
| `DREAMS.md` | Optional dreaming sweep / promotion review surface |

**Tools the agent uses:** `memory_search` (BM25 + vector hybrid
when an embedding provider is configured), `memory_get`,
`memory_recall`.

**Pluggable backends:**

| Backend | Notes |
|---------|-------|
| Builtin (default) | SQLite, keyword + vector + hybrid, no extras |
| QMD | Local-first sidecar with reranking and query expansion; can index extra dirs and session transcripts |
| Honcho | AI-native cross-session memory with user modeling |
| LanceDB | Bundled plugin, OpenAI-compatible embeddings, supports local Ollama embeddings |
| memory-wiki | Compiles durable memory into a provenance-rich wiki vault with claims, freshness, contradictions |

**Active Memory plugin** — optional blocking sub-agent that runs
*before* the main reply, searches memory, and either returns
`NONE` or injects a hidden summary as untrusted system context.
Tunable: query mode (`message`/`recent`/`full`), prompt style
(`strict`/`balanced`/`contextual`/`recall-heavy`/`precision-heavy`/`preference-only`),
per-chat-type gates, circuit breakers, dedicated fast model.

**Dreaming** — opt-in background consolidation cron. Scores
short-term signals, promotes only thresholded items into
`MEMORY.md`. Reviewable summaries to `DREAMS.md`. Includes a
"grounded backfill" mode that replays historical daily notes
through the same pipeline.

**Inferred commitments** — short-lived follow-ups (e.g. "check in
after the interview"), scoped per agent and channel, delivered
via heartbeat. Distinct from durable facts.

**Memory flush before compaction** — automatic silent housekeeping
turn before context summarisation, configurable to use a cheap
local model.

Embedding providers auto-detected from API keys: OpenAI, Gemini,
Voyage, Mistral.

## Tools & sandboxing

Default agent tool surface (each can be allow-listed or
deny-listed per agent):

- File: `read`, `write`, `edit`, `apply_patch`
- Execution: `exec` (with approval gating), `code-execution`
- Web: `browser`, `web-fetch`
- Memory: `memory_search`, `memory_get`, `memory_recall`
- Sessions: `sessions_list`, `sessions_history`, `sessions_send`,
  `sessions_spawn`, `session_status`
- Scheduling: `cron`, `message`
- Canvas / nodes: `canvas`, node commands via `node.invoke`

**Exec approvals** — three modes (`ask`, `allowlist`, `full`).
Allowlist mode binds approval-backed runs to exact request
context (one concrete local file operand for interpreter calls;
denied if the file changes before execution). Wrapper commands
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) are unwrapped to
their real targets before allowlisting.

**Sandboxing** — Docker-based per-agent isolation. Modes: `off`,
`all`. Scopes: `agent` (one container per agent) or `shared`.
Optional one-time `setupCommand` runs after container creation.

**Loop detection** — runtime detects stuck agent loops and breaks
them.

## Media in/out

**Inbound:** images, audio (transcribed via Whisper or other
configured STT), video, documents (extraction via
`document-extract`).

**Outbound:** text-to-speech via multiple providers (ElevenLabs,
Azure Speech, Inworld, SenseAudio, Deepgram, sherpa-onnx, MLX
local), image generation (FAL, ComfyUI, OpenAI, Gemini /
nano-banana-pro), video generation (Runway, generic
video-generation-providers), music generation.

**Voice surface:** voice notes auto-transcribed inbound and
optionally TTS'd outbound. Voice Call channel for live audio
calls. Voice wake on supported nodes. Push-to-talk commands on
trusted nodes.

## Web

**Search providers** (any can be wired in): Brave, DuckDuckGo,
Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG, Tavily.

**Browser automation** drives a real Chromium instance: navigate,
fill forms, login flows, content extraction.

**Web fetch** for one-shot URL pulls (also `web-readability`
mode).

## Mobile nodes & device control

Mobile nodes expose far more than chat. Each capability is
permission-gated and command-allowlisted at the Gateway:

- **Canvas** (WebView surface): `canvas.present`, `canvas.eval`,
  `canvas.snapshot`, `canvas.navigate`, plus A2UI v0.8 push
- **Camera**: `camera.list`, `camera.snap`, `camera.clip`
- **Screen**: `screen.record`, `screen.snapshot` (clamped to
  60s)
- **Location**: `location.get` with accuracy and max-age
- **System**: `system.run`, `system.which`, `system.notify`,
  `system.execApprovals.get/set`
- **Android-only**: `device.status/info/permissions/health`,
  `notifications.list/actions`, `photos.latest`,
  `contacts.search/add`, `calendar.events/add`, `callLog.search`,
  `sms.send/search`, `motion.activity/pedometer`

Pairing is **device-based** with signed challenges (v3 binds
`platform` + `deviceFamily`); metadata change requires repair
pairing. Bonjour discovery on local networks.

## Automation & scheduling

| Mechanism | What it does |
|-----------|--------------|
| **Scheduled tasks (cron)** | Exact timing, one-shot or recurring; persists jobs; delivers to channel/webhook/silent; isolated execution |
| **Heartbeat** | Periodic main-session turn (default 30 min) with full session context; batches inbox/calendar/notifications checks |
| **Inferred commitments** | Short-lived inferred follow-ups, scoped per agent/channel, delivered via heartbeat |
| **Background tasks** | Ledger of all detached work (ACP runs, subagent spawns, isolated cron); inspectable via `openclaw tasks` |
| **Task Flow** | Durable multi-step flow orchestration with revision tracking |
| **Standing orders** | Persistent operating instructions injected into every session |
| **Hooks (internal)** | Event-driven scripts on `/new`, `/reset`, `/stop`, `agent:bootstrap`, `gateway:startup/shutdown/pre-restart`, `session:compact:before/after`, `session:patch`, `message:received/transcribed/preprocessed/sent` |
| **Plugin hooks** | In-process hooks intercepting tool calls, prompts, messages, lifecycle |
| **Webhooks** | External HTTP endpoints triggering work in OpenClaw |
| **Polling** | Periodic external source pulls |
| **Gmail Pub/Sub** | Native Gmail event subscription |
| **Auth monitoring** | Background auth health checks |

## Workflow runtime (Lobster)

Typed in-process workflow shell for multi-step tool sequences.
Pipelines are data, not code. Runs as one tool call rather than a
back-and-forth chain of calls.

- Explicit **approval checkpoints** — side-effecting steps halt
  until approved.
- **Resume tokens** — halted workflows return a token; approve
  and resume without re-running earlier steps.
- **Determinism + auditability** — pipelines are JSON, easy to
  log, diff, replay.
- **Constrained surface** — small grammar plus JSON piping
  reduces unpredictable code paths.
- **Safety policy baked in** — timeouts, output caps, sandbox
  checks, allowlists enforced by the runtime.

## LLM providers

**35+ providers** as bundled extensions. Bring-your-own-key, no
proxying.

| Category | Providers |
|----------|-----------|
| Frontier | Anthropic, Anthropic Vertex, OpenAI, Google (Gemini), xAI (Grok), Mistral |
| Aggregators / gateways | OpenRouter, Vercel AI Gateway, Cloudflare AI Gateway, LiteLLM, Synthetic |
| Cloud platform | Amazon Bedrock (+ Mantle), Microsoft (+ Foundry), Google Vertex |
| China region | Alibaba, ByteDance (ByteCloud / Volcengine), Tencent, Qianfan, Qwen, Kimi, Moonshot, MiniMax, StepFun, Yuanbao, ZAI |
| Independent labs | DeepSeek, Cerebras, Groq, Together, Fireworks, DeepInfra, Hugging Face, Voyage, Perplexity, Nvidia, Arcee, Chutes, Venice |
| Local / self-hosted | Ollama, vLLM, SGLang, LMStudio, plus any OpenAI-compatible or Anthropic-compatible endpoint |

**Subscription auth via OAuth** is supported for some providers
(e.g. OpenAI Codex). Consumer chat subscriptions (Claude Pro,
ChatGPT Plus, Claude Max, Claude Code) **do not** work as API
credentials.

**Model failover** chains, per-agent model overrides, and a
distinct memory-flush model are all supported.

## Extension surfaces

Three distinct extension layers:

- **Plugins** — TypeScript modules under `extensions/`. Add
  channels (Matrix, Nostr, Twitch, etc.), capabilities (browser,
  voice-call, search providers, model providers, image/audio/video
  generators), or memory backends. **131 bundled plugins** at
  time of writing.
- **Skills** — markdown files (`SKILL.md`) with YAML frontmatter
  declaring `requires.bins` and `requires.env`. Body is
  step-by-step instructions the agent executes (typically `curl`
  or shell). Discovered from bundled, managed (`~/.openclaw/skills`),
  or workspace (`<workspace>/skills/`) locations. **53 bundled
  skills** including Linear-adjacent ones (`gh-issues`,
  `taskflow`, `notion`, `obsidian`, `trello`, `things-mac`,
  `apple-reminders`), home/audio (`spotify-player`, `sonoscli`,
  `openhue`, `openai-whisper`), system (`tmux`, `peekaboo`,
  `nano-pdf`, `summarize`), and meta (`skill-creator`).
- **Hooks** — internal lifecycle hooks plus plugin hooks for
  tool-call interception. Both managed by `openclaw hooks`.

## ClawHub & supply-chain risk

ClawHub is the public skill marketplace. Skills installed from
ClawHub run **inside the agent process** with full access to its
environment, including any injected API keys.

In February 2026 the [ClawHavoc
campaign](https://cybersecuritynews.com/clawhavoc-poisoned-openclaws-clawhub/)
compromised ClawHub. Trend Micro and Antiy documented 1,184+
malicious skills distributing
[Atomic macOS Stealer](https://www.trendmicro.com/en_us/research/26/b/openclaw-skills-used-to-distribute-atomic-macos-stealer.html).
Publishing required only a one-week-old GitHub account; no
signing, sandboxing, or human review.

For agents holding credentials, treat the marketplace as an
unscanned supply chain.

## Security & ops

- **Pairing** — device-based, signed nonce challenges, v3
  metadata binding, repair pairing on metadata change.
- **Allowlists** — DM `allowFrom`, group access policies, mention
  patterns for group activation, agent-to-agent allowlists.
- **Tool gates per agent** — `tools.allow`, `tools.deny`,
  `tools.elevated` (sender-based, not per-agent).
- **Sandboxing** — Docker-per-agent or shared Docker scope.
- **Remote access** — Tailscale (with `gateway.auth.allowTailscale`),
  SSH tunnels, optional TLS + pinning on the WS server.
- **Auth modes** — shared-secret (`token` / `password`),
  Tailscale identity, trusted-proxy headers, or `none` for
  private ingress.
- **Diagnostics** — built-in OpenTelemetry and Prometheus
  exporters via `diagnostics-otel` / `diagnostics-prometheus`.
- **Audit & trajectory** — per-run trajectory logs, command audit
  hook, session transcripts on disk.

## Notable agent UX features

- **Slash commands** — `/new`, `/reset`, `/stop`, `/exit`,
  `/verbose`, `/trace`, `/active-memory`, `/exec`, plus plugin
  slash commands.
- **Streaming + chunking** of long responses on every channel.
- **Steering** — operator can intervene mid-run.
- **Reactions** — status reactions on messages reflect run state.
- **Typing indicators** — channel-native typing presence.
- **Presence** — agent presence and availability events.
- **Progress drafts** — interim text shown while a long run
  works.
- **Channel docking** — surfaces a channel inside another
  surface.
- **Compaction** — automatic conversation summarisation with
  pre-compaction memory flush.
- **Tokenjuice** — token tracking and budget visibility.

## References

- [openclaw.ai](https://openclaw.ai/) — project home
- Local source: `/Users/kp/gh/openclaw` (docs/, src/, extensions/,
  skills/, packages/, apps/)
- Blog posts: [MVP](/openclaw-mvp.html),
  [K8s hardening](/openclaw-k8s.html),
  [Linear skill](/openclaw-linear-skill.html)
- In-house skill:
  [`openclaw-skills/linear/`](https://github.com/kylep/multi-sandbox/tree/main/openclaw-skills/linear)
  ([wiki entry](/wiki/custom-tools/openclaw-linear-skill.html))
- Container image: `ghcr.io/openclaw/openclaw`
