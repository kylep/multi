---
title: "Exploring Claude Plugin obra/superpowers"
summary: A look at Jesse Vincent's Superpowers plugin, what it ships,
  the entry skill that decides when to invoke the others, and which
  skills fire automatically versus the ones you reach for on purpose.
slug: exploring-claude-plugin-obra-superpowers
category: ai
tags: Claude-Code, AI, plugins, skills, Superpowers
date: 2026-05-05
modified: 2026-05-05
status: published
image: exploring-claude-plugin-obra-superpowers.png
thumbnail: exploring-claude-plugin-obra-superpowers-thumb.png
imgprompt: A cartoon utility belt laid flat with little tool icons
  (gavel, magnifier, checklist, anvil, microscope, scroll), flat pastel
  illustration, belt arched across the upper third with pastel ground
  extending below
keywords:
  - claude code superpowers plugin
  - obra superpowers skills
  - claude code skill tool
  - jesse vincent superpowers
  - claude plugin marketplace
  - claude code tdd skill
---


## Table of contents

# What it is

[Superpowers](https://github.com/obra/superpowers) is a Claude Code
plugin by [Jesse Vincent](https://blog.fsck.com) that ships a curated
library of "skills" (markdown files Claude loads on demand) plus a
loader skill that pushes the agent to invoke them aggressively. The
plugin's manifest currently sits at version 5.0.7 and describes itself
as a "core skills library for Claude Code: TDD, debugging, collaboration
patterns, and proven techniques."

I installed it from the official marketplace as part of [the Claude
plugin set I'm running](/selecting-a-claude-plugin-set.html) and ran
the post you're reading through it. This is what I found.

# Skills, briefly

A skill in Claude Code is a markdown document with frontmatter that
gets registered with the agent at session start. The frontmatter is
short. The body can be long. The agent decides when to load the body
based on the description.

Superpowers ships fourteen of them, organized roughly by phase of
work:

- `using-superpowers`: the loader/entry skill
- `brainstorming`: Socratic spec refinement
- `writing-plans`: break work into 2-5 minute tasks
- `executing-plans` and `subagent-driven-development`: work the plan
- `test-driven-development`: RED-GREEN-REFACTOR
- `systematic-debugging`: four-phase root-cause workflow
- `verification-before-completion`: run the proof before claiming done
- `dispatching-parallel-agents`: fan out independent work
- `using-git-worktrees`, `finishing-a-development-branch`
- `requesting-code-review`, `receiving-code-review`
- `writing-skills`: meta skill for authoring new ones

Each one is a `SKILL.md` plus optional reference files
(`testing-anti-patterns.md`, `root-cause-tracing.md`, etc.) that the
skill itself decides when to pull in.

# The entry skill

The loader, `using-superpowers`, runs at session start and sets the
rule: if there's any chance another skill applies, invoke it. From
the file:

> If you think there is even a 1% chance a skill might apply to what
> you are doing, you ABSOLUTELY MUST invoke the skill.

There's a Red Flags table inside the skill listing the agent's likely
excuses for skipping ("This is just a simple question", "I know what
that means") with a forced response for each. The phrasing is
deliberate. The file is trying to override Claude's default behavior
of jumping straight to action.

# Skills that fire automatically

These skills don't need you to invoke them. They watch for triggers
and step in when Claude would otherwise cut a corner. You install
Superpowers and they're on.

**test-driven-development** has an "Iron Law": "NO PRODUCTION CODE
WITHOUT A FAILING TEST FIRST." If the agent writes code before the
test, the skill instructs it to delete the code, not adapt it. The
RED-GREEN-REFACTOR diagram is in the skill file. Exceptions
("throwaway prototypes, generated code, configuration files") require
asking the human first.

**systematic-debugging** is a four-phase process gated on root cause:
"NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST." Phase 1 alone has
five numbered steps: read error messages carefully, reproduce
consistently, check recent changes, gather evidence in multi-component
systems, and trace data flow. The skill has two adjacent lists for
when it applies. "Use this ESPECIALLY when" calls out time pressure
and the "just one quick fix" reflex. "Don't skip when" answers the
"manager wants it fixed NOW" pressure with "systematic is faster than
thrashing."

**verification-before-completion** maps work claims to required
evidence. The Iron Law is "NO COMPLETION CLAIMS WITHOUT FRESH
VERIFICATION EVIDENCE."

| Claim | Requires |
|-------|----------|
| Tests pass | Test command output, 0 failures |
| Linter clean | Linter output, 0 errors |
| Build succeeds | Build command, exit 0 |
| Bug fixed | Test original symptom, passes |
| Agent completed | VCS diff shows changes |

Two more activate based on context: `receiving-code-review` fires
when review feedback shows up and pushes back on performative
agreement; `finishing-a-development-branch` fires when work wraps up
and walks through merge, PR, or cleanup options.

# Skills to invoke intentionally

These don't fire on their own. The value depends on you reaching for
them at the right time, and on what you bring to the conversation.

**brainstorming**. Invoke before any new feature or design decision.
Bring a vague idea, not a finished spec. The skill's whole job is
forcing alternatives, so showing up with a decided answer wastes the
round. The `<HARD-GATE>` inside it blocks implementation skills until
a design exists and is approved. That's right for a multi-day
feature, overkill for a fifty-line script. Use it when scope is
genuinely unclear.

**writing-plans**. Invoke once the design is settled. The skill
chunks work into 2-5 minute tasks, which can feel too granular but
makes the executing step reliable. Don't pre-write the plan and ask
the skill to format it. The granularity is the value.

**executing-plans and subagent-driven-development**. Invoke after
writing-plans. These hand each task to a fresh subagent so context
doesn't pollute across tasks. They work best when the plan's tasks
are truly independent and worst when you keep interrupting to
redirect.

**dispatching-parallel-agents**. Invoke when you have two or more
tasks with no shared state and no sequential dependency. If you can't
articulate the independence, the tasks aren't actually parallel. The
skill enforces that gate.

**using-git-worktrees**. Invoke before long-running work you want
isolated from main. Pairs with finishing-a-development-branch at the
end. Skip it for a one-file change.

**requesting-code-review**. Invoke before declaring work done, not
after merging. The structured ask is the value.

**writing-skills**. Only invoke after you've hit the same failure
mode several times. Skills target repeated, real problems. Writing
one against a single bad session is how you end up with skills
nobody uses.
