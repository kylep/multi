---
title: "Design Docs"
summary: "Technical design documents for system architecture decisions."
keywords:
  - design-docs
  - architecture
  - technical-design
related:
  - wiki/prds
  - wiki/devops
scope: "Index of design documents. Each doc captures the technical approach, trade-offs, and rationale for a significant system change."
last_verified: 2026-03-16
---

Technical design documents for significant architecture decisions.

Each design doc covers the problem, proposed solution, alternatives
considered, and trade-offs. Design docs are written before
implementation begins.

## Creating a design doc

Run the Design Doc Writer agent with an approved PRD:

```bash
claude --agent design-doc-writer
```

The agent will interview you about architecture decisions, research the
codebase, and produce a design doc from the
[template](template.html). The output's Task Breakdown
section feeds directly into Claude Code's plan mode for implementation.

## Design Docs
