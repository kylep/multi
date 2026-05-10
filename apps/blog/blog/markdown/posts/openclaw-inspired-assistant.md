---
title: "Building My Openclaw-Inspired Assistant"
summary: Pai is an executive assistant agent I run in K8s. After surveying the
  openclaw ecosystem, I went looking for which patterns to port over. This is
  the running notes file.
slug: openclaw-inspired-assistant
category: ai
tags: AI, Claude-Code, agents, openclaw, Pai, K8s
date: 2026-05-10
status: draft
keywords:
  - openclaw inspired assistant
  - pai agent
  - openclaw self improvement
  - dreaming agent memory
  - clawhub recurring patterns
---


## Table of contents

# Why this exists

I run Pai. She's an executive assistant agent that lives on Discord, takes
notes, files Linear issues, and runs as a long-lived deployment in my K8s
cluster ([previous post](/openclaw-mvp.html),
[K8s hardening](/openclaw-k8s.html)). Most of what's there I borrowed from
openclaw's gateway architecture, scoped down to one channel and one user.

After [surveying ClawHub's top skills](/wiki/tool-research/openclaw.html), I
went hunting for patterns I hadn't ported yet. This post is the running notes
file for that work. Rough, not polished. I'll come back and cut later.

# The ClawHub scene

ClawHub is openclaw's public skill registry, 65k+ markdown skills last I
checked. Top of the most-downloaded list (May 2026):

| Rank | Skill | Downloads |
|---|---|---:|
| 1 | `@pskoett/self-improving-agent` | 429k |
| 2 | `@spclaudehome/skill-vetter` | 235k |
| 3 | `@ivangdavila/self-improving` | 183k |
| 4 | `@oswalpalash/ontology` | 178k |
| 5 | `@steipete/github` | 174k |
| 6 | `@steipete/gog` | 171k |
| 7 | `@joelchance/polymarket` | 170k |
| 8 | `@tokauthai/skillscan` | 167k |
| 9 | `@halthelobster/proactive-agent` | 156k |

Four of the top nine are some flavor of self-improvement, proactivity, or
skill-vetting. After
[ClawHavoc](https://cybersecuritynews.com/clawhavoc-poisoned-openclaws-clawhub/)
that's not surprising. The community is anxious about supply chain and
loving the idea of agents that learn from their own failures.

# What Pai already had

Pai's memory is closer in shape to openclaw's `MEMORY.md` + daily notes
than to the flat append-logs in the most-downloaded ClawHub skills.
Concretely:

- `MEMORY.md` with `## section` headers, BM25-searched on demand
- `daily/YYYY-MM-DD.md` rolling notes
- `COMMITMENTS.md` — YAML-fenced inferred follow-ups, scheduler delivers
  every 60s
- `pai-recaller` sub-agent runs *before* the main reply, returns NONE or
  injects a hidden digest as untrusted context (the openclaw "Active
  Memory" pattern)
- `memory_promote(daily → long)` for promoting bullets that recur

So the architectural lead is real. Most of the top "self-improver"
ClawHub skills are flat append logs and a few hooks. Pai already has the
MCP layer, atomic writes, and sub-agent recall.

# What was missing

Three gaps after the survey:

1. **No closed loop on Pai's own failures.** When Pai's claude subprocess
   times out or fails, the gateway logs it as JSON and Vector ships it to
   OpenObserve. Nothing reads those logs back. The error data is in the
   warehouse, but it doesn't feed memory.

2. **No recurrence counting.** `memory_save` always appends. If I tell
   Pai "I'm in Toronto, ET" three times, three bullets. The pskoett
   pattern uses a `Pattern-Key` and a counter so the third recurrence
   can promote the rule from soft to hard.

3. **No size management.** `MEMORY.md` grows unbounded. ivangdavila's
   HOT/WARM/COLD tiers (≤100 lines hot, projects/domains warm,
   archive cold) handle this. Pai will eventually need it. Not painful
   today.

# What I'm porting first

The highest-leverage gap is #1. The pskoett ERRORS.md pattern, but
implemented via OpenObserve queries instead of a local hook, since Pai
runs in K8s and Vector already ships everything to O2. Closest openclaw
analogue is **dreaming**: a background consolidation cron that scores
short-term signals, promotes thresholded items into MEMORY.md, leaves a
review trail.

(notes accumulating here as I build)

## Renaming healthcheck

The first thing I cut was the existing `healthcheck` cron. It's a
shell-only kubectl + curl check that posts state changes to Discord.
On paper it's defense-in-depth. In practice I never look at the channel
and the changes it reports are usually expected (cluster restart, etc).
It was delivering no value, so it's getting replaced rather than
extended.

The new cron is `pai-self-improver`. Same shape as `autolearn`: clones
the repo, sets up MCP config, invokes `claude --agent pai-self-improver`
with the OpenObserve and Linear MCPs available, posts to Discord at
start and end.

## Why pai-self-improver isn't pai-the-responder

When Kyle asked me to "bake the right skills into Pai" my first instinct
was to add the OpenObserve MCP to pai-responder's full MCP config. That
would let Pai answer questions like "why did autolearn fail yesterday?"
in conversation.

I didn't do it. The recent gateway commits dropped Pai's mention-to-reply
latency by trimming MCP cold-starts. Adding another MCP server to the
hot path eats some of that back. Pai-self-improver as a cron with its
own short-lived MCP config keeps the hot path fast and the diagnostic
path complete. If I want Pai to answer log questions in chat later, I
can add the MCP then.

The trade is worth naming: the responder agent and the diagnostic agent
are now two surfaces, not one. They share the memory store and the
agent role description, but they're invoked differently and have
different toolbelts. Openclaw treats this as "sub-agents" — same idea.

## Audit log enrichment

The PostToolUse hook already shipped tool calls to OpenObserve via
Vector. I added two fields: `is_error` and `error_excerpt` (400 char
cap). Schema is additive so existing queries don't break.

The reason this matters: the source-of-truth signal for "Pai's tooling
just failed" was previously the gateway's stderr log line ("claude
failed rc=N"). That's coarse — it tells you *something* failed but not
*which tool*. With `is_error` per tool call you can ask O2 "which Bash
commands fail most often" or "which MCP tool errors recur" with a
single SQL query. That's the data feed pai-self-improver clusters on.

(more notes coming)

# Why this isn't a flexible platform

Openclaw is a platform. ClawHub has 65k skills serving the median user.
Pai is one assistant for me. That's a deliberate trade.

- Pai runs in *my* cluster, talks to *my* Discord guild, reads *my*
  Vault. The deployment hardcodes my user IDs, my channel IDs, my
  preferred tone (one mode for me, a softer one for my wife).
- The "skills" surface that makes openclaw a marketplace is not Pai's
  surface. Pai delegates by spawning task-specific Claude Code agents
  (publisher, journalist, autolearn, prd-writer) defined in
  `.claude/agents/`. Those are *my* agents, in *my* repo, version
  controlled.
- ClawHavoc is a recurring reminder that a marketplace surface
  for arbitrary executable skills is a supply chain. I can't write
  vetting tooling that scales. I *can* write code I trust because
  I wrote it.

The pattern I'm copying from openclaw is the *runtime shape*. The
gateway, the memory model, the active-memory sub-agent, the inferred
commitment scheduler. Not the marketplace. The marketplace is an
anti-pattern at my scale.

# What's specific to my scenario

Things that don't generalize, listed for honesty:

- Single-user. Pai answers to one principal (me) plus my wife who gets
  a lighter tone. No multi-tenant routing.
- Single-channel. Discord guild only. No iMessage, WhatsApp, Slack,
  WebChat, voice. Adding any of them would mean reimplementing the
  Discord MCP for that channel, which I won't do because I don't use
  them.
- Single-cluster. K8s on Rancher Desktop on my Mac mini. The whole
  thing is online iff that machine is online.
- Markdown memory under `/data` mounted into the pai-responder pod.
  No vector DB, no Honcho, no LanceDB. BM25 against ~1k bullets is
  fine. If it stops being fine I'll add embeddings, not before.

# Open questions

- How aggressive should the dreamer be? Daily feels right. Weekly might
  cluster better but loses the "I just told Pai this twice yesterday"
  signal.
- Approval flow: post diff to a private Discord channel, file Linear
  issue, or open a PR in the multi repo? Leaning toward Discord +
  Linear for first cut. PR is heavier than the change deserves for
  edits to a markdown file.
- Should pai-recaller also see the dreamer's promotion candidates?
  Probably yes — promoted-but-not-yet-applied items should still be
  loaded into active memory at recall time.

(more as I go)
