---
title: "Journalist"
summary: "Daily AI news digest agent — gathers and writes structured wiki journal entries."
keywords:
  - journalist
  - agent
  - news-digest
  - journal
related:
  - wiki/agent-team/index.html
  - wiki/journal/index.html
scope: "Journalist agent: role, schedule, output format, and Discord identity."
last_verified: 2026-03-15
---

## Role

The Journalist writes daily AI news digests to the wiki journal.
It gathers news from the web, structures it by category, and writes
a wiki page per day.

## Identity

![Journalist avatar](/images/agent-journalist.png)

- **Model**: Haiku
- **Animal totem**: Owl (observation, wisdom)
- **Discord**: Journalist bot in "Kyle's Bot Space"

## Schedule

Daily at 08:00 UTC via cron schedule `0 8 * * *`.

## Output

Each digest lands at `wiki/journal/YYYY-MM-DD/ai-news.md` with
standard wiki frontmatter.

### Categories

- Model Releases
- Research
- Industry
- Tools & Infrastructure

### Rules

- Every item needs a source URL
- Zero opinion or editorializing
- One sentence per item
- Prefer primary sources
- Skip rumors and speculation
- Aim for 5-15 items per digest

## Invocation

```bash
claude --agent journalist
```

## Agent definition

Source: `.claude/agents/journalist.md`
