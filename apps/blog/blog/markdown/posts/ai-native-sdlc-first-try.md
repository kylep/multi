---
title: "AI-Native SDLC: First Try"
summary: Building a product development lifecycle where AI agents handle
  the grunt work of scoping, research, and documentation.
slug: ai-native-sdlc-first-try
category: dev
tags: AI-Agents, SDLC, Product-Management, PRD
date: 2026-03-16
status: published
imgprompt: "a bowerbird carefully arranging colorful objects into a neat
  geometric pattern on the ground, flat minimal vector style, dark
  charcoal background with bright accent colors"
---

I want to go from "vague idea of something neat to build" to
"well-scoped project with definite value, acceptance criteria, and
no remaining uncertainty." The first step is a PRD agent that
interviews me before it writes anything.


# Why a PRD agent

I ran three Deep Research reports on AI-augmented PRDs and
AI-native SDLCs
([notes](/wiki/research/ai-augmented-prds.html)). One finding
kept showing up across all three: AI agents don't ask clarifying
questions. They assume. Hand a coding agent a vague idea and
it'll produce something plausible, polished, and wrong in ways
you won't notice until later.

The traditional PRD solves a different version of this problem.
A human engineer reads a vague spec and asks "what happens
when the user does X?" or "does this need to work offline?" An
AI agent fills those gaps with assumptions. All three research
reports converged on this: the biggest risk isn't bad output,
it's convincingly mediocre output that looks complete enough to
skip the hard thinking.

So the fix is an agent that does the asking. One that
interviews me first, pushes back on vague answers, and refuses
to write until it has real clarity.


# The PRD Writer

The [PRD Writer](/wiki/agent-team/prd-writer.html) is a Claude
Code agent that turns vague ideas into scoped PRDs. It runs on
Opus because it needs to recognize when an answer is too vague,
when goals contradict constraints, and when I'm hand-waving
instead of thinking.

![PRD Writer, the Bowerbird](/images/agent-prd-writer.png)

## Phase 1: Interview

The agent reads the project's
CLAUDE.md, the wiki, existing PRDs, and all agent definitions
for context. Then it asks me questions one at a time, covering
five categories: problem clarity, solution validation, success
criteria, constraints, and strategic fit.

One at a time matters. When questions come in batches, the
first two get real answers and the rest get skimmed. One
question, one answer,
then the agent decides what to ask next based on what I said.
It pushes back on contradictions, flags gaps, and won't accept
"make it better" as a success criterion.

The gate is explicit. When it has enough, it says "I have enough
to write a PRD. Proceeding to research." No ambiguity about
when the interview ends.


## Phase 2: Research

The agent delegates to a researcher subagent to gather facts on
the problem space. It also reads the wiki, codebase, and prior
PRDs to find existing patterns or infrastructure that could be
reused. The point is to ground the PRD in what actually exists,
not what the agent imagines.


## Phase 3: Write

It writes the PRD to the wiki using a standard template. The
template has the sections that all three research reports agreed
on: problem, goal, success metrics, non-goals, user stories with
acceptance criteria, scope, open questions, and risks.

- **Non-goals come before scope.** Kevin Yien's
  ["perimeter of the solution space"](https://docs.google.com/document/d/1mEMDcHmtQ6twzNlpvF-9maNlAcezpWDtCnyIqWkODZs/edit)
  pattern. Draw the boundary first, then fill it in. This
  matters more for a solo dev than a team because there's no
  one else to say "that's out of scope."
- **Acceptance criteria live on each user story, not in a
  separate section.** Keeps them co-located with the context
  that makes them meaningful. 3-5 per story, not 20. Addy
  Osmani's [guide on specs for AI agents](https://addyosmani.com/blog/good-spec/)
  describes the failure mode: pile on too many criteria and
  agents start ignoring or contradicting them.

No implementation details in the PRD. That's the design doc's
job, which is future work.


# Using it

Start the agent directly:

```bash
claude --agent prd-writer
```

Or describe a product idea to vanilla Claude and it'll
auto-delegate based on the agent's description field.

The output is a draft PRD at
`apps/blog/blog/markdown/wiki/prds/<slug>.md`. Review it,
approve it, then hand it off to a design doc phase (when that
exists).


# Design docs are next

This is the first piece of a broader AI-native SDLC. The PRD
answers "what and why." The next step is a design doc agent that
answers "how," taking a PRD as input and producing architecture
decisions, trade-offs, and a plan. After that, the design doc
feeds into implementation tasks that coding agents can pick up.

The PRD Writer exists. We'll see how well interview-first
holds up in practice.
