---
title: "Tool Evaluations"
summary: "Automated evaluations of open source tools tested against the current stack."
keywords:
  - evaluations
  - autolearn
  - tool-assessment
  - poc
related:
  - wiki/stack-contract
  - wiki/research/autolearn-v1
scope: "Index of tool evaluations produced by the autolearn pipeline. Each evaluation includes real tested setup instructions, test results, and a stack fit assessment."
last_verified: 2026-04-01
---

Automated evaluations of open source tools tested against the current
stack. Each evaluation is produced by the autolearn agent pipeline:
the tool is installed, tested, scored against the
[stack contract](/wiki/stack-contract.html), and documented with real
terminal output.

## Verdicts

- **adopt** — Integrate into the stack. Worth the operational cost.
- **watch** — Promising but not ready or not needed yet. Re-evaluate later.
- **skip** — Doesn't fit the stack or isn't worth the complexity.

## Evaluations

| Tool | Verdict | Score | Date | Summary |
|------|---------|-------|------|---------|
| [Microsoft VibeVoice](/wiki/evaluations/vibevoice.html) | skip | 2.4 / 5.0 | 2026-04-03 | Excellent voice AI but requires GPU hardware not in our stack |
