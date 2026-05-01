---
title: "Exploring Claude obra/superpowers Plugin"
summary: A walkthrough of obra/superpowers' 14 skills, the code-reviewer agent, and the SessionStart hook. What each piece does and when it fires.
slug: exploring-superpowers
category: ai
tags: Claude-Code, AI, plugins, superpowers
date: 2026-04-29
modified: 2026-04-29
status: draft
image: exploring-superpowers.png
thumbnail: exploring-superpowers-thumb.png
imgprompt: A cute upright cartoon capybara in a superhero costume with a flowing red cape, full body visible from head to toe, standing on its feet in a heroic pose
keywords:
  - claude code superpowers plugin
  - obra superpowers walkthrough
  - claude code skills
---

[obra/superpowers](https://github.com/obra/superpowers) is one of
the picks from my [Selecting a Claude Plugin Set](/selecting-a-claude-plugin-set.html)
shortlist. It ships 14 skills, 1 agent, and a SessionStart hook,
amounting to a pre-baked methodology framework: brainstorm, plan,
TDD, debug, review, verify. This is a walkthrough of each piece.


# Install

The README recommends installing from the official Anthropic
marketplace, which Claude Code already has registered:

```bash
/plugin install superpowers@claude-plugins-official
```

# The SessionStart hook

A bash script (`hooks/session-start.sh`) reads the entire
`using-superpowers/SKILL.md`, JSON-escapes it, and emits it as
`additionalContext`. Fires on `startup|clear|compact`, so the
body lands in every session. This is the main always-on cost:
roughly 3–4k tokens of skill body, plus another ~550 tokens of
metadata across the other 13 skills (Claude Code keeps each
skill's description in context for discovery; bodies load on
demand).


# brainstorming

The entry skill for "let's build X." Opens with a `<HARD-GATE>`
directive: no implementation skill, no code, no scaffolding until
a design exists and the user has approved it. The flow runs project
context → clarifying questions one at a time → 2–3 approaches with
trade-offs → section-by-section design approval → spec committed
to `docs/superpowers/specs/` → hand off to `writing-plans`.

## The 9-step checklist

Rendered as TodoWrite tasks:

1. Explore project context (files, docs, recent commits)
2. Offer the visual companion if visuals are likely (in its own
   message)
3. Ask clarifying questions, one at a time
4. Propose 2–3 approaches with trade-offs and a recommendation
5. Present the design in sections, get approval section-by-section
6. Write the spec to
   `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit
7. Self-review the spec inline (placeholders, contradictions,
   scope, ambiguity)
8. Hand the spec to the user for review
9. Hand off to `writing-plans`

## The browser-based companion

A local Node HTTP server the agent spins up for visual questions:
it writes HTML fragments to a watched directory, the user clicks
options in their browser, and the agent reads the clicks back as
JSONL on its next turn. The agent decides per-question whether to
use it; the rule is "would the user understand this better by
seeing it than reading it?"

## Example

A request like "I want to add user mentions to my comment system"
goes through the checklist instead of straight to code. The agent
reads the comment system, the user model, and recent commits,
then asks something like "should @-mentions resolve to existing
users only, or auto-create profile pages?" One question at a
time. After a few rounds it proposes 2-3 approaches with
trade-offs, presents the design in sections for approval, writes
the spec to `docs/superpowers/specs/2026-04-29-user-mentions-design.md`,
self-reviews it, and asks the user to read the file. The handoff
to `writing-plans` only happens after that approval. No code gets
written in the whole loop.


# using-superpowers

The meta-skill that makes the rest of the plugin actually fire.
Always-on via the SessionStart hook. Forces a "skill check before
action" rule: even a 1% chance a skill applies means invoke it
first. Includes a 12-row Red Flags table that names common
rationalizations agents reach for when skipping methodology
("this is just a simple question," "let me explore the codebase
first") and rebuts each one. Establishes precedence: user
instructions in CLAUDE.md > superpowers skills > default system
prompt.


# writing-plans

Turns an approved spec into a granular implementation plan saved
to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`. The
plan assumes the engineer who will execute it has zero context
for the codebase: which files to touch per task, what to test,
which docs to read. Bite-sized tasks with explicit verification
steps. Principles: DRY, YAGNI, TDD, frequent commits.


# executing-plans

Loads a written plan, reviews it critically (raises concerns
before starting), then executes tasks one at a time with TodoWrite
tracking. The skill explicitly recommends switching to
`subagent-driven-development` if subagents are available, since
that one preserves the orchestrator's context.


# subagent-driven-development

For executing a plan in the current session via fan-out: dispatch
a fresh subagent per task with precisely crafted context (never
the orchestrator's session history), then run a two-stage review
after each task: spec compliance review first, code quality
review second. Preserves the orchestrator's context for
coordination.


# dispatching-parallel-agents

For 2+ truly independent tasks with no shared state or sequential
dependencies. Distinct from `subagent-driven-development`: this
one is parallel fan-out for unrelated work, not sequential plan
execution.


# test-driven-development

The strictest skill in the plugin. Iron law:

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Red-green-refactor in that order. If you wrote implementation
first, the skill says delete and start over. *"Don't keep it as
reference, don't adapt it while writing tests, don't look at it.
Delete means delete."* Required for new features, bug fixes,
refactoring, behavior changes. Throwaway prototypes and config
files are the only stated exceptions.


# systematic-debugging

Iron law:

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Random fixes waste time and create new bugs. The skill enforces
hypothesis-driven investigation: form a theory about the cause,
write a test that would confirm or refute it, only then propose
a fix. Symptom fixes are explicitly called failure.


# verification-before-completion

Iron law:

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you didn't run the verification command in this message, you
can't claim it passes. The skill exists because LLMs default to
"I implemented X and the tests should pass" without actually
running the tests. This one demands evidence before any "done"
claim, before commits, before PRs.


# requesting-code-review

Dispatches the `code-reviewer` subagent with precisely crafted
context (not the session's history). Mandatory after each task in
subagent-driven development, after major features, before merge.
Optional but valuable when stuck, before refactoring, after
fixing complex bugs. Keeps the reviewer focused on the work
product, not the agent's thought process.


# receiving-code-review

The pair to `requesting-code-review`. Forces technical rigor over
performative agreement: when feedback arrives, especially feedback
that seems unclear or technically questionable, verify before
implementing. Don't blindly apply suggestions or do
agreement-theater.


# using-git-worktrees

Creates isolated workspaces for feature work without switching
branches in the main checkout. Smart directory selection in
priority order: `.worktrees/` > `worktrees/` > a CLAUDE.md
preference > `$HOME/repos/<repo>.worktree/`. Recommended before
executing implementation plans.


# finishing-a-development-branch

Closes out finished work. Verify tests actually pass, then present
structured integration options (merge, PR, cleanup), then execute
the chosen path. Won't proceed if tests are failing.


# writing-skills

Meta-skill for authoring new skills. Strict rules about the
description format ("Use when..." with concrete triggering
conditions, no workflow summary in the description, third person
since it's injected into the system prompt). Largest file in the
plugin at 655 lines, but only relevant if you're building skills
yourself.


# code-reviewer (agent)

The plugin's only agent. A senior code-reviewer persona that
compares implementation against the original plan and coding
standards. Model is `inherit`, so it runs on whatever model
dispatched it. Invoked indirectly via `requesting-code-review`,
not typically by hand. The reviewer gets a curated context payload
(plan + diff + standards) rather than the dispatching agent's
session history, which is the design point: review the work
product, not the path taken to get there.
