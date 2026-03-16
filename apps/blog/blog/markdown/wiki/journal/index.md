---
title: "Journal"
summary: "Datestamped log of agent-generated content. Daily AI news digests and other autonomous agent outputs."
keywords:
  - journal
  - daily
  - ai-news
  - digest
  - autonomous
related:
  - wiki/devops/agent-controller
scope: "Index of journal entries organized by date. Does not contain the entries themselves."
last_verified: 2026-03-15
---


Datestamped entries written by autonomous agents running in Kubernetes.
Each entry lives in a `journal/YYYY-MM-DD/` subdirectory.

## Entry Types

| Type | Agent | Schedule |
|------|-------|----------|
| AI News Digest | journalist | Daily at 8am UTC |

## Structure

```
journal/
  2026-03-15/
    ai-news.md
  2026-03-16/
    ai-news.md
  ...
```

Entries use standard wiki frontmatter for RAG retrieval and
programmatic access.
