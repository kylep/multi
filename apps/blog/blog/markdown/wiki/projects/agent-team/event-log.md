---
title: "Agent Event Log"
summary: "Real-time event log for watching agent orchestration progress via tail -f."
keywords:
  - event-log
  - observability
  - tail
  - orchestration
  - agent-events
related:
  - wiki/projects/agent-team
  - wiki/projects/agent-team/pai
  - wiki/projects/agent-team/publisher
scope: "How the agent event log works: file location, event types, format, and how to watch."
last_verified: 2026-03-11
---

## What it is

A shared append-only log file that agents write to during orchestration.
Kyle can `tail -f agent-events.log` in a second terminal to watch
progress in real time.

## How to watch

```bash
tail -f agent-events.log
```

## Log file

`agent-events.log` in the repo root. Gitignored. Ephemeral — safe to
delete between runs.

The `AGENT_LOG` env var overrides the path if set.

## Event types

| Type | When | Format |
|------|------|--------|
| auto-start | `invoke-agent.sh` launches an agent | `[HH:MM:SS] ▶ <agent>` |
| processing | Agent begins a task | `[HH:MM:SS] <agent>: <what>` |
| delegating | Agent passes work to another | `[HH:MM:SS] <agent> → <target>: <why>` |
| done | Agent finished | `[HH:MM:SS] <agent> ✔ <conclusion>` |
| auto-finish | `invoke-agent.sh` after agent exits | `[HH:MM:SS] ■ <agent> (exit N)` |

Auto-start and auto-finish come from `bin/invoke-agent.sh` — no agent
cooperation needed. The other three are logged by agents themselves
via `bin/log-event.sh`.

## How agents log

Every agent definition includes an "Event log" section instructing it
to call:

```bash
bin/log-event.sh "<agent>: <message>"
```

One sentence max per entry. Agents log at least one processing event
when they start and a done event with a brief conclusion before
returning.

## Example output

```
[14:32:01] ▶ pai
[14:32:03] pai: reading wiki for orchestration context
[14:32:05] pai → ar: assess whether QA role overlaps existing agents
[14:32:06] ▶ ar
[14:32:07] ar: reading all agent definitions
[14:32:15] ar: drafting qa.md agent definition
[14:32:18] ar ✔ hired QA agent, created 4 files
[14:32:18] ■ ar (exit 0)
[14:32:19] pai ✔ QA agent hired and added to publisher pipeline
[14:32:19] ■ pai (exit 0)
```

## Scripts

- **`bin/log-event.sh`** — appends a timestamped line to the log
- **`bin/invoke-agent.sh`** — wraps agent invocation with auto
  start/finish logging
