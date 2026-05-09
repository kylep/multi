---
title: "Exploring Claude Plugin obra/superpowers"
summary: A look at Jesse Vincent's Superpowers plugin, what it ships,
  which skills fire automatically, and which ones you reach for on
  purpose.
slug: exploring-claude-plugin-obra-superpowers
category: ai
tags: Claude-Code, AI, plugins, skills, Superpowers
date: 2026-05-09
modified: 2026-05-09
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

# What obra/superpowers is

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

These skills don't really have a learning curve. You add the plugin and they start making
things ~better. The `using-superpowers` skill is worded aggressively so Superpowers'
skills get invoked automatically:

```text
If you think there is even a 1% chance a skill might apply to what you are doing,
you ABSOLUTELY MUST invoke the skill.
```

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

For a few of their skills, it's worth being at least somewhat aware and intentional
about them firing. You still just describe what you're doing and the loader picks the
right skill. No slash commands required (the three Superpowers ships are
deprecated wrappers that tell you to use natural language instead).

## brainstorming

Use before any new feature or design decision. Just kind of state the idea you have and
it should work with you from there.

```
I want to add notifications but I haven't picked a channel.
```

## writing-plans

Ask it to plan things out, it will either drop in here or brainstorming. Here if the
requested plan is execution-ready, else brainstorming for exploratory plans.
The skill chunks work into 2-5 minute tasks.

```
Plan the migration from session cookies to JWT,
given the design we landed in design-doc.md.
```

## executing-plans and subagent-driven-development

Fires when you tell it to execute your plan. Each task gets handed to a fresh subagent
so context doesn't pollute. Best when plan tasks are truly independent.
Worse when you keep interrupting to redirect.

```
Execute the plan in plan.md. Stop after task 4 for review.
```

## dispatching-parallel-agents

Used when you have two or more tasks with no shared state and no sequential dependency.

```
Add the same OpenTelemetry trace span to the three
microservices in services/.
```

## using-git-worktrees

I'm not sure this meaningfully improves things over base claude, but know that it's
firing when you ask it to set up a worktree.

```
Set up a worktree for the auth-rewrite branch.
```

## requesting-code-review

Use before declaring work done, not after merging.

```
Run a code review on the changes in this PR.
Focus on the new verification path.
```

## writing-skills

Generally should just improve how Claude writes your skills. Know that they're coming
out a bit different because it's enabled.

```
I keep having to tell Claude our deploys go through manual
approval. Help me write a skill for that.
```


# Overall, it's pretty plug-and-play

I'd figured this was a big plugin with a steep learning curve, but after this testing
I'm convinced that it's pretty much a straight up improvement over not having it,
without needing users to spend a lot of time figuring out how to make best use of it.
