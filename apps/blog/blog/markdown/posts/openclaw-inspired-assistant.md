---
title: "Building My Openclaw-Inspired Assistant"
summary: I've been quietly stripping openclaw for parts. Pai now runs on a
  markdown memory model, active-recall sub-agent, commitment scheduler, and
  a daily dreaming cron — all ported from openclaw concepts but pinned to
  Claude Max OAuth and a single Discord channel.
slug: openclaw-inspired-assistant
category: ai
tags: AI, Claude-Code, agents, openclaw, Pai, Kubernetes
date: 2026-05-10
status: published
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

# Why this exists

I run Pai. She's a personal Discord assistant for me and my wife, a
long-lived bot in K8s. She remembers things, files Linear issues,
delivers reminders, and reads pages I share with her.

Most of what makes Pai work I've borrowed from
[openclaw](/wiki/tool-research/openclaw.html). Openclaw is a
self-hosted multi-channel agent gateway with its own runtime,
memory model, scheduling, and skill registry. I'm not running it.
What I'm doing is reading its source and porting the parts that fit
my one-user, one-channel, K8s, no-API-billing setup.

This post is a tour of what got ported, why, and which good ideas I
intentionally skipped.

# Why not just run openclaw

Two reasons.

Openclaw supports OAuth subscription auth for OpenAI Codex but **not**
for Anthropic. To run Claude through openclaw I'd need an
`ANTHROPIC_API_KEY`, which means metered billing on top of the Max
plan I'm already paying for. The whole point of running my own
assistant is that I'm not buying API tokens twice.

Beyond that: openclaw is a platform. ClawHub is a 65k-skill
marketplace. The architecture is multi-tenant, multi-channel,
multi-provider, multi-everything. I have one user (and my wife on a
softer tone), one channel (Discord), one model (Sonnet via Claude
Code), one cluster (Rancher Desktop on a Mac mini in my office). The
flexibility costs me complexity I'd never use.

So I'm running [pai-responder](/wiki/agent-team/pai.html), a long-
lived `claude --agent pai` Deployment that talks to one Discord guild
and reuses the openclaw *patterns* without the openclaw *runtime*.

# The Pai before this branch

Pai existed before any of this. She had:

- A Python `gateway.py` listening on the Discord WS
- A flat-JSON memory MCP keyed by category
- Periodic review of unmentioned messages every 15 minutes
- Basic mention detection
- The `.claude/agents/pai.md` definition

What she didn't have:

- Active recall before each reply
- Markdown memory with daily notes or commitments
- A commitment scheduler
- Browser automation
- Reliable thread tracking
- Reconnect-time recovery for missed mentions

Pretty much every gap in that second list is something openclaw
already solves cleanly. So this branch is a port pass.

# What ported, in one table

| Openclaw concept | Pai equivalent | Where it lives |
|---|---|---|
| `MEMORY.md` long-term store | `/data/MEMORY.md` w/ `##` section headers | `infra/ai-agents/pai-responder/helm/files/memory_mcp.py` |
| Daily notes (`memory/YYYY-MM-DD.md`) | `/data/daily/YYYY-MM-DD.md` | same |
| Inferred commitments | `/data/COMMITMENTS.md` (YAML-fenced blocks) | same |
| BM25 + section-aware indexing | builtin Python BM25, sections folded into searchable docs | same |
| Active Memory plugin | `pai-recaller` sub-agent | `.claude/agents/pai-recaller.md` |
| Heartbeat (periodic main-session turn) | `_commitment_tick` every 60s | `gateway.py` |
| Standing orders | `pai.md` agent definition | `.claude/agents/pai.md` |
| Slash command surface | `--disable-slash-commands` (intentional skip) | `gateway.py` |
| Browser automation | Playwright MCP added to Pai's toolbelt | `gateway.py` MCP config |
| Per-purpose MCP configs | three configs (full/recall/deliver) for cold-start cuts | `gateway.py` |
| Channel auto-binding (group routing) | thread auto-bind on Pai's posts + on mentions | `gateway.py` |
| Catchup / session resume | `_catchup` on reconnect: seal old, replay recent | `gateway.py` |
| Dreaming (consolidation cron) | `pai-self-improver` daily 09:00 UTC | `infra/ai-agents/cronjobs/helm/templates/pai-self-improver.yaml` |
| `is_error` per tool call (for dreaming signal) | enriched audit-log hook | `.claude/hooks/audit-log.sh` |

Things I intentionally didn't port:

| Openclaw concept | Why skipped |
|---|---|
| ClawHub skill marketplace | Supply chain (ClawHavoc was 1184+ malicious skills). I write my own agents in `.claude/agents/` |
| `SOUL.md` / `AGENTS.md` / `USER.md` persona split | Claude Code doesn't auto-inject sub-files; reading them every turn costs tokens. Personality stays inline in `pai.md` |
| Multi-channel (iMessage, Slack, voice, etc.) | I only use Discord |
| Pluggable embedding backends (Honcho, LanceDB, QMD) | Need API keys → metered billing. BM25 is plenty for hundreds of bullets |
| Lobster typed-workflow runtime | Genuine power, but I don't have a workflow that's earned the abstraction |
| Image / video / music generation | Not a use case |
| Sandboxing per-agent Docker containers | Pai is one process, one user; sandbox-per-tool isn't useful |

A few are deferred, not skipped:

- **Sub-agent orchestration**. Letting Pai dispatch other agents
  (publisher, prd-writer, etc.) the way openclaw does multi-agent
  routing. Tier 2.
- **Memory-wiki layer**. Openclaw can compile durable memory into a
  provenance-rich vault with claims and freshness. Worth it once
  `MEMORY.md` outgrows manual curation.
- **HOT/WARM/COLD tiered memory**. Not painful at ~1k bullets.

# Markdown memory MCP

Pai's memory used to be flat JSON keyed by category, searched with
substring matching. Worked OK for "what's Kyle's GitHub username" but
fell over on anything fuzzier. The replacement is three markdown
files exposed via a typed MCP:

```
/data/MEMORY.md             ## Sectioned long-term facts
/data/daily/YYYY-MM-DD.md   Rolling daily notes
/data/COMMITMENTS.md        YAML-fenced follow-ups
```

A `COMMITMENTS.md` block looks like this:

```markdown
---
id: c-2026-05-08-001
status: pending
precision: precise
due: 2026-05-08T19:00:00Z
scope: channel:1482815120000000000
created: 2026-05-08T14:00:00Z
source: turn-2026-05-08T13:55Z
---
Remind Kyle about the dentist appointment at 3 PM.
```

The MCP exposes `memory_save / memory_search / memory_recall /
memory_get / memory_list / memory_commitment_due /
memory_commitment_done / memory_promote`. Implementation is one
~550-line Python file with atomic writes and a tiny YAML reader for
commitment blocks.

## Why wrap markdown in an MCP rather than have Pai use Read/Glob/Grep

Two reasons.

The typed contract reduces prompt fragility. Pai writes
`memory_save(scope='commitment', content='...', due='...')` instead
of having to remember the YAML format and the file path. Less
malformed entries, less reasoning load.

And the commitment lifecycle needs `memory_commitment_due` /
`memory_commitment_done` semantics anyway. Encoding those as MCP
calls keeps the file format an implementation detail. The user-
visible files stay plain markdown, auditable and inspectable without
the MCP running.

## Section-aware indexing

A bullet under `## Kyle` saying *"prefers TypeScript over
JavaScript"* is invisible to a query like *"what language does Kyle
prefer?"* because no token in the bullet overlaps the query. So the
indexer folds the section header into the searchable doc. The
indexed text becomes `"Kyle: prefers TypeScript over JavaScript"`,
which both BM25-hits the query and reads as a self-contained fact
when the recaller surfaces it.

Caught this during the M1 production smoke test on 2026-05-09.
Without section folding, half of Pai's recalls came back NONE on
queries that any human reading `MEMORY.md` would have answered
correctly.

# Active Memory → pai-recaller

Openclaw's "Active Memory" plugin is a blocking sub-agent that runs
*before* the main reply, queries memory, and returns either `NONE` or
a focused digest injected as untrusted context. The pattern translates
cleanly to Claude Code as a separate `claude --agent` invocation.

```
Discord mention
   ↓
gateway.py spawns: claude --agent pai-recaller
   ↓
recaller calls memory_recall, returns "NONE" or 2-3 line digest
   ↓
gateway.py spawns: claude --agent pai
  with <active_memory>...</active_memory> prepended to the prompt
   ↓
Pai replies in Discord
```

The recaller's tool list is intentionally tight: only
`mcp__pai-memory__memory_recall`, `memory_search`, `memory_get`. No
Discord, no Linear, no web. Its job is to decide if memory is
relevant and write a 2-3 line digest if so.

## Why a separate `claude` invocation rather than Pai's `Agent` tool

Adding the `Agent` tool to Pai gives it general agent-spawning. That
opens the door to multi-agent orchestration (the
[org-chart vision](/agent-org-chart.html)) which is its own scope and
deliberately deferred.

A separate `claude` invocation orchestrated by `gateway.py` keeps
Pai's tool surface tight. It also makes recall reusable in other
contexts (cron jobs, periodic reviews) without having to funnel them
through Pai.

## Why Sonnet, not Haiku, for the recaller

Haiku is cheaper, but the recaller's job (decide if memory is
relevant, write a 2-3 line digest) needs decent judgment. Sonnet is
fast enough (~5-10s in steady state), and Max plan doesn't bill per
token. If the recaller becomes rate-limit pressure later I'll
revisit.

## The cold-start fight

Every `claude --agent` subprocess on the lima VM was eating 5-30s of
cold-start before producing tokens. For the recaller specifically,
this was painful: a memory query that should be a few seconds was
spending most of its time loading Playwright + Linear + Discord MCPs
just to ignore them.

Three changes landed:

1. **Per-purpose MCP configs.** `gateway.py` writes three files at
   startup:
   - `mcp-recall.json` — memory only
   - `mcp-deliver.json` — memory + Discord (commitment delivery)
   - `mcp-full.json` — all four (main Pai)
   Each invocation passes the smallest config it needs, with
   `--strict-mcp-config` so the CLI doesn't union it with whatever
   it auto-discovers from `~/.claude.json`.
2. **`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`.** Single official
   knob that disables autoupdate checks, telemetry, error reporting,
   and feedback surveys.
3. **`--disable-slash-commands`** on every claude invocation. The
   project has skills the bot will never use; skipping the
   description-load is a freebie.

Recaller cold-start dropped the most. Adding `mcp__playwright` and
`mcp__linear` to the recaller config when the recaller never calls
either is the kind of thing that's invisible until you measure.

## Token economics under Max

Per Discord turn:

- Recaller: ~2k input + ~50 output ≈ 2.05k tokens
- Main Pai: ~3-5k input + 200-2000 output ≈ ~5k tokens average
- **Total**: ~7k tokens/turn

Compare to a hypothetical "read all memory at the top of every
prompt" approach: 6-9k tokens/turn at small memory sizes, growing
linearly as `MEMORY.md` grows. The recaller is break-even today and
gets cheaper as memory grows.

# Commitment scheduler

A new asyncio task in `gateway.py`: `_commitment_tick`. Every 60
seconds, read `COMMITMENTS.md`, find entries where `status: pending
AND due <= now`, spawn Pai to deliver each.

```python
async def _commitment_tick(self):
    while not self.is_closed():
        await asyncio.sleep(60)
        for cmt in store.commitments_due():
            await self._deliver_commitment(cmt)
```

For each due commitment, Pai gets spawned with a tight tool list
(`send_message`, `create_thread`, `memory_commitment_done`) and
posts the reminder, then marks the commitment delivered.

## Why 1-minute resolution

A min-heap is more efficient asymptotically. Pai will never have
more than a few dozen pending commitments. A 60-second loop is
trivially correct, zero-cost when the queue is empty, and adds zero
new failure modes. The heap would add bug surface for no real win.

## Why this lives in pai-responder, not a CronJob

A K8s CronJob with a 1-minute schedule is a pod startup tax every
minute (image pull, vault inject, Claude OAuth handshake). The
existing pai-responder pod is already running and authenticated;
adding an asyncio task to it costs nothing per tick when no
commitments are due.

For zero-or-one-times-per-day work (morning greeting, weekly
review), CronJobs are still the right shape. They're separate
patterns serving different cadences.

## Precise vs. soft commitments

Each commitment has a `precision` field: `precise` or `soft`.
*Precise* is for explicit "remind me at..." requests. *Soft* is for
inferred follow-ups ("you have an interview tomorrow at 2 → check in
after").

Same delivery loop handles both. The field is metadata for Pai —
she uses it to format the message ("20-minute reminder:" vs. "How
did the interview go?"). Branching on precision in `gateway.py`
would mean two delivery paths to maintain.

# The reliability work

Half the gateway commits in this branch are bug fixes I caught
during the M1 production rollout. Boring but worth flagging because
they're the kind of thing openclaw already solves and that you only
discover in production.

## Catchup on reconnect

`_catchup` runs once per `on_ready`. Two jobs:

1. **Seal old messages.** For each text channel, the most recent 20
   messages older than 60 seconds get marked as already-processed.
   Without this, Discord gateway resume events could replay and Pai
   would double-reply.
2. **Replay recent missed messages.** Anything *newer* than the
   cutoff is left unmarked and dispatched through `on_message` in
   chronological order. So a mention sent during a pod rollout
   lands in `channel.history()`, gets picked up on connect, and
   gets a reply.

Discovered this the hard way during the 2026-05-09 deploy. The old
"mark last 20, period" logic silently dropped mentions during the
rollout window. The idempotent `processed_ids` check protects
against the live gateway also redelivering the same message.

## Auto-bind threads where Pai posts

Threads previously got bound only when Pai was @-mentioned *inside*
the thread. But Pai often *creates* a thread itself (via the Discord
MCP) to reply to a mention in the parent channel. That fresh thread
never sees a mention and never gets bound, leaving follow-ups in it
silently ignored.

`on_message` now also binds any thread where Pai herself posts
(detected via `msg.author.id == self.bot_user_id` and
`isinstance(msg.channel, discord.Thread)`). Caught when a follow-up
question in a Pai-created thread sat unanswered for an hour.

## Mention detection: user *and* role

Discord supports two distinct mention forms: user mentions (`<@id>`)
and role mentions (`<@&id>`). When a server has *both* a user named
X and a role named X (Pai's case — the bot user "Pai" plus a "Pai"
role granted to the bot), Discord's `@Pai` autocomplete picks the
**role**. discord.py exposes user mentions in `msg.mentions` but
role mentions in `msg.role_mentions` — separate lists.

`_is_mention` returns true if any of:

1. The bot user is in `msg.mentions` (direct user mention)
2. The literal `<@bot_user_id>` substring is in `msg.content`
3. Any role in `msg.role_mentions` is one the bot itself holds in
   that guild

Without rule 3, `@Pai`-via-role-autocomplete fell through to
periodic-review buffering — no ack, no reply. Caught during the M1
deploy when @-completing "Pai" stopped triggering the bot.

## Typing indicator covers the full pipeline

`async with channel.typing():` lives in `_process_session`,
wrapping both `recall_for` and `invoke_claude`. Earlier the typing
context was only inside `invoke_claude`, which meant users saw
nothing for the duration of the recaller call (default 60s
timeout). On a small VM the recaller cold-start is slow enough that
this looked like the bot wasn't seeing the message.

Outer-pipeline typing gives users a visible "..." within ~1s of
mentioning, regardless of recaller speed.

# Dreaming → pai-self-improver

The most recent piece. Openclaw's "dreaming" feature is a background
consolidation cron that scores short-term signals, promotes
thresholded items into `MEMORY.md`, leaves a review trail in
`DREAMS.md`. Same idea, K8s flavor.

The data was already in OpenObserve. Vector ships every container's
stdout to the `k8s_logs` stream. Pai's gateway logs JSON; cron
agents (autolearn, journalist, seo-bot) emit structured tool-call
records via the audit hook. So the missing piece was something that
reads those logs back, clusters, proposes.

```mermaid
graph LR
  A[pai-responder<br/>+ cron agents] -->|stdout| B[Vector<br/>DaemonSet]
  B -->|HTTP| C[(OpenObserve<br/>k8s_logs)]
  C -->|SQL query| D[pai-self-improver<br/>cron @ 09:00 UTC]
  D -->|file issue| E[Linear<br/>label: pai-self-improver]
  D -->|summary| F[Discord<br/>#status-updates]
  E -->|approve| G[Pai responder]
  G -->|memory_save| H[(MEMORY.md)]
```

`pai-self-improver` is a daily CronJob modeled on `autolearn`.
Anonymous git clone, an MCP config with OpenObserve + Discord +
Linear servers, runs `claude --agent pai-self-improver`, posts to
Discord at start and end. Cap is five proposals per run. Threshold
is three or more recurrences in 24 hours. Anything under is noise.

It's read-only against `MEMORY.md` — proposals go to Linear with
the `pai-self-improver` label. Kyle approves a proposal by replying
`apply` (or `apply 1,3` for a subset), and Pai's responder applies
the bullet via `memory_save`.

The application-side comment-watcher in pai-responder is **not yet
wired** in this branch. Today the loop is: cron files Linear issue
→ Kyle reads → Kyle either applies manually or asks Pai in chat.
That's deliberate first-cut scope.

## Audit hook enrichment

For pai-self-improver to cluster on per-tool failures, the audit log
needs to actually carry that signal. The PostToolUse hook already
shipped tool calls to OpenObserve via Vector. I added two fields:

- `is_error` (bool, from `tool_response.is_error`)
- `error_excerpt` (up to 400 chars of `stderr` / `output` / `error`)

Schema is additive so existing queries don't break.

## The honest hook-stdout finding

`gateway.py` spawns claude with `stdout=PIPE`. The PostToolUse hook
writes JSON to stdout. So in the pai-responder pod, hook output
gets captured into the gateway's stdout buffer rather than streaming
to container stdout that Vector watches.

Translation: the per-tool audit data from *pai-responder* doesn't
reach OpenObserve the way I'd assumed. What does reach O2 from
pai-responder is `gateway.py`'s own Python logger output — useful,
but coarser-grained.

The audit-log enrichment still helps the **cron agents**
(autolearn, journalist, seo-bot) where the shell entry-point
doesn't pipe-capture stdout, and the hook does stream through. The
fix for pai-responder is to have `gateway.py` extract audit-log JSON
out of claude's captured stdout and re-emit as a Python log line.
Future iteration.

## Why pai-self-improver isn't pai-the-responder

When I started I wanted to add the OpenObserve MCP to
pai-responder's full MCP config. That would let Pai answer "why did
autolearn fail yesterday?" in chat.

I didn't do it. The cold-start fight just trimmed Pai's mention-to-
reply latency. Adding another MCP server to the hot path eats some
of that back. The cron has its own short-lived MCP config that goes
away after the run.

If a conversational diagnostic surface ever feels needed, a slim
`pai-diagnostics` sub-agent (modeled on pai-recaller) is the right
shape — load O2 MCP only when invoked, exit fast. Tier 2.

# What's still open

A few unverifieds that need a real run on pai-m1:

- The `is_error` field comes from `tool_response.is_error` —
  schema is my best guess and may differ slightly per Claude
  version. First real cron run will tell us.
- The application loop is half-wired: cron files proposals; Pai
  doesn't yet auto-apply on `apply` reply. Next iteration.
- Section-aware indexing was caught in production, but the BM25
  scorer hasn't been measured against a realistic memory corpus.
  At ~1k bullets it's cheap; at 10k it might want tuning.

A few open design questions:

- Should `pai-recaller` see pending self-improver proposals so
  promoted-but-not-yet-applied items still influence active memory?
  Probably yes.
- Should pai-self-improver write a `DREAMS.md` to `/data` so Pai
  can recall *why* a rule exists? Requires either PVC sharing or
  having Pai write the entry herself when applying. Symmetric with
  openclaw, but Linear is doing the job today.
- How aggressive should the dreamer be? Daily fits the rhythm I
  notice things ("I just told Pai this twice yesterday"). Weekly
  might cluster better.

# What's not changing

Two things I keep getting tempted to add and keep deciding against.

**No `SOUL.md` / `AGENTS.md` / `USER.md` persona split.** Openclaw
auto-injects these because its agent runtime owns the prompt. Claude
Code doesn't, so reading them every turn costs tokens. Slow-changing
curated content fits in `pai.md`; per-user factual content lives in
`MEMORY.md` and surfaces via recall. That's actually closer to what
`USER.md` is supposed to do.

**No skill marketplace.** [ClawHavoc](https://cybersecuritynews.com/clawhavoc-poisoned-openclaws-clawhub/)
in February 2026 distributed [Atomic macOS Stealer](https://www.trendmicro.com/en_us/research/26/b/openclaw-skills-used-to-distribute-atomic-macos-stealer.html)
through 1,184+ malicious skills published with no signing, sandboxing,
or human review. ClawHub publishing requires a one-week-old GitHub
account, which is the supply chain. I can't write vetting tooling that
scales. I *can* write code I trust because I wrote it. Pai delegates
to task-specific Claude Code agents (publisher, journalist,
prd-writer, autolearn) that live in `.claude/agents/`, version-
controlled, reviewed by me.

# Where the code lives

For anyone reading along:

- Agent definitions: `.claude/agents/{pai,pai-recaller,pai-self-improver}.md`
- Memory MCP: `infra/ai-agents/pai-responder/helm/files/memory_mcp.py`
- Migration script (flat-JSON → markdown): `infra/ai-agents/pai-responder/helm/files/migrate.py`
- Memory tests: `infra/ai-agents/pai-responder/tests/`
- Gateway: `infra/ai-agents/pai-responder/helm/files/gateway.py`
- Audit hook: `.claude/hooks/audit-log.sh`
- Self-improver cron: `infra/ai-agents/cronjobs/helm/templates/pai-self-improver.yaml`
- Design doc with full rationale: [wiki/design-docs/pai-improvements](/wiki/design-docs/pai-improvements.html)
- Openclaw inventory I cribbed from: [wiki/tool-research/openclaw](/wiki/tool-research/openclaw.html)
- Pai readme: [apps/pai/README.md](https://github.com/kylep/multi/blob/main/apps/pai/README.md)
