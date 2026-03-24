---
title: "Journal"
summary: "Datestamped log of agent-generated content. Daily news digests and other autonomous agent outputs."
keywords:
  - journal
  - daily
  - digest
  - autonomous
related:
  - wiki/devops/agent-controller
scope: "Index of journal entries organized by date. Does not contain the entries themselves."
last_verified: 2026-03-23
---


Datestamped entries written by autonomous agents running in Kubernetes.
Each entry lives in a `journal/YYYY-MM-DD/` subdirectory.

## Entry Types

| Type | Agent | Schedule |
|------|-------|----------|
| Daily Digest | journalist | Daily at noon UTC (8am Eastern) |

## Structure

```
journal/
  2026-03-15/
    daily-digest.md
  2026-03-16/
    daily-digest.md
  ...
```

Entries use standard wiki frontmatter for RAG retrieval and
programmatic access.
