---
title: "A Modern, Agent-Native Design System for the Blog"
summary: "Deep Research on building a modern, agent-native design system for kyle.pericak.com as a predicate to a blog redesign. Seed input for PER-135."
keywords:
  - deep-research
  - design-system
  - design-tokens
  - tailwind
  - storybook
  - shadcn
  - radix
  - component-library
  - blog-redesign
related:
  - wiki/research
  - wiki/prds/blog-design-system
  - wiki/design-docs/blog-design-system
scope: "Subject index for design-system research. Currently a single-provider (Claude) report. Seed input for the PER-135 blog redesign."
last_verified: 2026-06-13
---

Deep Research on what a modern, agent-native design system looks like
and how to build one for kyle.pericak.com as a predicate to a blog
redesign. Used as the seed input for the PER-135 design-system PRD and
design doc.

Unlike the other research subjects, this is currently a **single-provider**
report (Claude only) rather than a cross-referenced three-provider set.

## Prompt

> Research a modern, agent-native design system for kyle.pericak.com as
> a predicate to a blog redesign: what a design system is, what makes
> one good, the modern building blocks (tokens, styling, primitives,
> component model, MCP, LLM-readable docs), and prescriptive guidance
> for an additive migration off the current Next.js Pages Router + MUI
> stack.

## Reports

- [Claude Deep Research: Agent-Native Design System](/wiki/research/design-system/claude-report.html) —
  6 sections: what a design system is, a 14-criterion quality rubric,
  the modern building-block stack (DTCG tokens + Style Dictionary,
  Tailwind v4, Radix primitives, the shadcn/ui copy-paste model, MCP
  glue, llms.txt/AGENTS.md docs), and a prescriptive 10-phase additive
  migration roadmap off MUI. Generated 2026-05-28.

## How Kyle's steering diverges from the report

The report is a **seed**, not a spec. For PER-135, Kyle's stated
outcomes override several of its recommendations:

- **Storybook is in scope** (the report recommends *against* it for a
  solo blog). Kyle wants hands-on exposure and a demonstrable component
  workshop.
- **Tailwind is in scope** and wanted for exposure.
- **Bias toward stable/mainstream** building blocks suitable for a
  3–5+ year project — explicitly mitigating the report's own caveats
  (young DTCG spec, shadcn self-maintenance, noisy visual regression).
- The end state must be **demoable as a POC to other full-stack
  experts** and **maintainable primarily through AI**.

See [PER-135](https://linear.app/pericak/issue/PER-135/blog-redesign-agent-native-design-system),
the [PRD](/wiki/prds/blog-design-system.html), and the
[design doc](/wiki/design-docs/blog-design-system.html).
