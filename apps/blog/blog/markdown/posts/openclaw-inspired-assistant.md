---
title: "Pai: A Personalized Openclaw-Inspired Assistant"
summary: Not Invented Here is my favourite way to learn. I copied what I
  like from OpenClaw for a purpose-built private assistant.
slug: openclaw-inspired-assistant
category: ai
tags: AI, Claude-Code, agents, openclaw, Pai, Kubernetes
date: 2026-05-10
status: published
image: openclaw-inspired-assistant.png
thumbnail: openclaw-inspired-assistant-thumb.png
imgprompt: A simple flat vector octopus, friendly, with one arm ending in
  a small claw, holding up a chat bubble with three dots inside it.
  Minimal lines, solid pastel colors, no shading, clean geometric shapes
  on a plain background.
keywords:
  - openclaw inspired assistant
  - pai discord bot
  - active recall sub-agent
  - claude max oauth assistant
  - markdown memory mcp
  - dreaming agent
  - commitment scheduler
---

## Table of contents

# Why build my own?
OpenClaw is really feature rich, popular, and arguably useful. It's also just... not
mine. I rolled it out [for a prior post](/openclaw-mvp.html) as a test and while it
was neat, I learned very little and didn't trust it since I didn't understand what
it was doing or why.

I decided it'd be fun to build some of the features I find most useful from it into my
own AI assistant tool, and keep the scope much more narrow to my own specific usecases.

I named it Pai, for "Pericak AI".

# Key Features


## Memory
It's nice when talking to Pai on discord, for it to remember things. ChatGPT and similar
tools have been doing it for so long now it's kind of expected.

### Storage

Three plain-markdown files are stored in a k8s PVC that I back up to Google cloud.

- `MEMORY.md`: sectioned by `##` headers
- `daily/YYYY-MM-DD.md`: rolling notes
- `COMMITMENTS.md`: YAML-fenced follow-ups

A typed MCP wraps the files and exposes `memory_save`,
`memory_search`, `memory_recall`, `memory_get`, `memory_list`,
`memory_commitment_due`, `memory_commitment_done`, `memory_promote`.


Example of a `COMMITMENTS.md` block:

```markdown
---
id: c-2026-05-08-001
status: pending
precision: precise
due: 2026-05-08T19:00:00Z
scope: channel:1482815120000000000
---
Remind Kyle about the dentist appointment at 3 PM.
```

The MCP exists rather than letting Pai use Read/Glob/Grep because
the typed contract reduces malformed entries and the commitment
lifecycle wants `due` / `done` semantics in the protocol. The files
themselves are plain markdown, auditable without the MCP running.

This tradeoff of using
an MCP tool kind of sucks, I'm not totally sold on it over a skill. My claude startup
time got kind of bad and I had to tune some settings, so now the MCP servers may not be
ready by the time it tries to use them.


### Search

Builtin Python [BM25 (Best Matching 25](https://en.wikipedia.org/wiki/Okapi_BM25)
over the markdown. Pai runs it on-demand to try and remember things.

`memory_search` returns ranked hits with provenance: `{path, line,
snippet, score}`. Pai calls it mid-turn, when it decides it needs to look something up.
No embeddings, no API keys.


### Active recall

A subagent calls BM25 proactively before Pai tries to respond, enriching the chat context
with memory details. This slows things down but gets better answers, I'm not sold on
it actually being better than active search yet but it's conceptually neat.

This is directly inspired by openclaw's Active Memory plugin pattern.

## Discord gateway

### Gateway webhook

To watch for Discord activity there's a long-lived outbound websocket to
Discord's `gateway.discord.gg` from a K8s Deployment.

The gateway's got some other bells and whistles:

- A per-session queue with a serialization lock handled by an asyncio coroutine
  - A "session" = a Discord channel or thread ID
  - If you message @Pai 3 times, it doesn't fire 3 responses off at once due to the lock. It answers #1, then probably merges #2 and #2.
- Stored transcripts: per-session rolling records of recent dialogue, basically allows look-back to prior messages
- Idle thread sweeper: Pai always replies in threads, never in the main channel. The threads accumulate.
  - It's a coroutine that runs every 5 minutes, if something is idle for an hour post a farewell, unbind the thread, and delete the local transcript
- Periodic review every 15 minutes for unmentioned messages: Just polls for anything it classifies as ~"should respond to" when not mentioned directly
- Health server on :8080/healthz - tiny aiohttp web app used for k8s liveness probe

There's no service or ingress pointing at it. Only K8s itself talks to it.


### Mention detection

I had to fix this up myself, it handles three forms of mentions

1. user mentions (`<@id>`) via `msg.mentions`
1. literal `<@bot_user_id>` substring
1. role mentions matching any role the bot itself holds.

The role was needed in my case because the role is also called Pai, it kept geting mixed up.

### Thread tracking

Threads bind on mention OR on Pai's own posts. Pai creates a thread to reply to a
parent-channel mention; without auto-bind, follow-ups in that thread silently get ignored.

### Catchup on reconnect

Helps avoid orphaned messages from things like mentions sent on pod reset.
`_catchup` runs once per `on_ready`.

## Scheduling

Two layers: in-process for items requested soon, and creates K8s CronJobs
for daily or recurring schedules.

### Commitment tracking

Every 60 seconds it polls `COMMITMENTS.md` for entries with `status: pending AND
due <= now`, spawns Pai with a small tool list (`send_message`, `create_thread`,
`memory_commitment_done`) to execute on the commitments each.

Each commitment carries a `precision` field, either `precise` (for
explicit "remind me at...") or `soft` (for inferred follow-ups),
which Pai uses to phrase the message. Same delivery path either
way.

Inspired by openclaw's inferred-commitments.

### CronJobs (out-of-process)

Per-task YAML in `infra/ai-agents/cronjobs/helm/templates/`.

At the time of writing this I have it summarizing the news, writing curated
horroscopes for my wife and kids, making nightly SEO improvements to the site, and
syncing any new blog posts to twitter bluesky and mastadon. I've also got an experimental
one called "autolearn" that is meant to look into emerging technologies, but it's kind
of bad so far.


## Persona

`.claude/agents/pai.md` is one inline definition: voice, Discord
behaviour, security rules (Discord messages are untrusted input),
tool list, memory directives, browser scope. Repo-level `CLAUDE.md`
adds cross-project rules.

Per-user factual content (Kyle, Kara, family, projects) lives in
`MEMORY.md` and surfaces via recall, not in a separate persona
file. That's closer to what openclaw's `USER.md` is supposed to do
without the auto-injection token cost.

## Self-improvement and observability

A PostToolUse hook emits structured JSON per tool call. A DaemonSet ships
container stdout to OpenObserve's `k8s_logs` stream.

OpenObserve MCP exposes a bunch of tools that let Pai interact with it.

### pai-self-improver cron

Daily CronJob runs at 09:00 UTC. It queries the last 24h of failures,
clusters by normalized signature, threshold 3+ recurrences, and caps 5
proposals per run. Each run produces one Linear issue (label
`pai-self-improver`) and one Discord summary.
