---
title: "Exploring Claude Plugin obra/superpowers"
summary: A look at Jesse Vincent's Superpowers plugin, what it ships,
  which skills fire automatically, and which ones you reach for on
  purpose.
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
as a "Core skills library for Claude Code: TDD, debugging, collaboration
patterns, and proven techniques."

I installed it from the official marketplace as part of [the Claude
plugin set I'm running](/selecting-a-claude-plugin-set.html) and ran
the post you're reading through it.

# Automatic Skills

Some skills don't have a learning curve. You add the plugin and they start making
things ~better. The `using-superpowers` skill is worded aggressively so Superpowers'
skills get invoked automatically:

> If you think there is even a 1% chance a skill might apply to what
> you are doing, you ABSOLUTELY MUST invoke the skill.

- **test-driven-development** has a rule: "NO PRODUCTION CODE WITHOUT A FAILING TEST
  FIRST." If the agent writes code before the test, the skill instructs it to delete
  the code, not adapt it.
- **systematic-debugging** demands "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"
  then runs a four-phase process to structure investigations.
- **verification-before-completion** requires "NO COMPLETION CLAIMS WITHOUT FRESH
  VERIFICATION EVIDENCE."
- **receiving-code-review** fires when review feedback shows up and pushes back on
  performative agreement.
- **finishing-a-development-branch** fires when work wraps up and walks through merge,
  PR, or cleanup options.

# Skills to invoke intentionally

These don't fire on their own. Describe what you're doing and the loader picks
the right skill. No slash commands required (the three Superpowers ships are
deprecated wrappers that tell you to use natural language instead). The value
depends on what you bring to the conversation.

## brainstorming

Use before any new feature or design decision. Bring a vague idea, not a
finished spec. The skill's job is forcing alternatives, so showing up with
a decided answer wastes the round.

```
I want to add notifications but I haven't picked a channel.
```

## writing-plans

Use once the design is settled. The skill chunks work into 2-5 minute
tasks. Don't pre-write the plan and ask the skill to format it. The
granularity is the value.

```
Plan the migration from session cookies to JWT,
given the design we landed in design-doc.md.
```

## executing-plans and subagent-driven-development

Use after writing-plans. Each task gets handed to a fresh subagent so
context doesn't pollute. Best when plan tasks are truly independent.
Worst when you keep interrupting to redirect.

```
Execute the plan in plan.md. Stop after task 4 for review.
```

## dispatching-parallel-agents

Use when you have two or more tasks with no shared state and no
sequential dependency. If you can't articulate the independence, the
tasks aren't parallel.

```
Add the same OpenTelemetry trace span to the three
microservices in services/.
```

## using-git-worktrees

Use before long-running work you want isolated from main. Pairs with
finishing-a-development-branch at the end. Skip for a one-file change.

```
Set up a worktree for the auth-rewrite branch.
```

## requesting-code-review

Use before declaring work done, not after merging. The structured ask
is the value.

```
Run a code review on the changes in this PR.
Focus on the new verification path.
```

## writing-skills

Only use after you've hit the same failure mode several times. Skills
target repeated, real problems. Writing one against a single bad session
is how you end up with skills nobody uses.

```
I keep having to tell Claude our deploys go through manual
approval. Help me write a skill for that.
```
