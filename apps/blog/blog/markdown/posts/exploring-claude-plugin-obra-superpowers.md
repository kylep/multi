---
title: "Exploring Claude Plugin obra/superpowers"
summary: A look at Jesse Vincent's Superpowers plugin, the skills it
  ships, the aggressive loader that decides when to invoke them, and an
  honest take after running it in a real session.
slug: exploring-claude-plugin-obra-superpowers
category: ai
tags: Claude-Code, AI, plugins, skills, Superpowers
date: 2026-05-05
modified: 2026-05-05
status: published
imgprompt: A cute cartoon otter wearing a red cape and standing on top
  of a stack of three open books, flat pastel illustration, plenty of
  white space, clean geometric shapes
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

I installed it from the official marketplace and ran the post you're
reading through it. This is what I found.

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

# The loader is intense

The entry skill, `using-superpowers`, sets the tone. From the actual
skill file in this session:

> If you think there is even a 1% chance a skill might apply to what
> you are doing, you ABSOLUTELY MUST invoke the skill.
>
> IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST
> USE IT.

The skill includes a "Red Flags" table of rationalizations the agent
might use to skip a skill ("This is just a simple question", "Let me
explore the codebase first", "I know what that means") with a forced
response for each. There's a Graphviz flowchart embedded in the
markdown that walks through the decision: user message in, check for
applicable skills, invoke skill, announce invocation, follow checklist,
respond.

The intent is to override the model's default behavior of jumping
straight to action. The phrasing is deliberate.

# What's actually inside the strong ones

Three skills earn the aggression. The rest are useful but lighter.

**test-driven-development** has an "Iron Law": "NO PRODUCTION CODE
WITHOUT A FAILING TEST FIRST." If the agent wrote code before the
test, the skill instructs it to delete the code, not adapt it. The
RED-GREEN-REFACTOR diagram is in the skill file itself. The skill
also enumerates exceptions ("throwaway prototypes, generated code,
configuration files") that require asking the human first.

**systematic-debugging** is a four-phase process gated on root cause:
"NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST." Phase 1 alone has
five numbered steps: read error messages carefully, reproduce
consistently, check recent changes, gather evidence in multi-component
systems, and trace data flow. The skill has two adjacent lists for
when it applies: "Use this ESPECIALLY when" calls out time pressure
and the "just one quick fix" reflex; "Don't skip when" answers the
"manager wants it fixed NOW" pressure with "systematic is faster than
thrashing." Both lists target the moments where an agent would
otherwise guess.

**verification-before-completion** is the one I'd hand to anyone
shipping AI-written code. The Iron Law is "NO COMPLETION CLAIMS
WITHOUT FRESH VERIFICATION EVIDENCE." It maps claims to required
proof:

| Claim | Requires |
|-------|----------|
| Tests pass | Test command output, 0 failures |
| Linter clean | Linter output, 0 errors |
| Build succeeds | Build command, exit 0 |
| Bug fixed | Test original symptom, passes |
| Agent completed | VCS diff shows changes |

It's a short list. It catches a lot.

# What's lighter

The collaboration skills (`brainstorming`, `writing-plans`,
`requesting-code-review`, `receiving-code-review`,
`finishing-a-development-branch`) are sensible playbooks but they're
mostly process I'd already follow. `brainstorming` has a `<HARD-GATE>`
that blocks any implementation skill from running until a design is
written and approved. That's a strong opinion. It's the right one for
a multi-day feature. It's overkill for a fifty-line script.

`using-git-worktrees` and `dispatching-parallel-agents` assume a
specific workflow (isolated worktree per feature, fresh subagent per
task) that's worth reading even if you don't adopt it wholesale.

`writing-skills` is the meta skill, and it's interesting on its own
terms: skills are "test-driven", written against "pressure scenarios"
where a baseline agent fails, then refined until the agent complies.
The release notes for v5.0.6 mention regression testing across 5
versions with 5 trials each before removing the old subagent review
loop. There's actual evaluation behind these files.

# What it feels like in a session

I had Claude write this post under Superpowers. The honest report:

The loader fired. The session reminder loaded `using-superpowers`
content and listed thirteen other available skills. The agent
announced when it was checking for applicable skills, which is part
of the prescribed flow.

For a writing task, most skills don't apply. `brainstorming` could
have, but the user's request already specified angle, structure, and
constraints, so there was nothing to refine. `verification-before-
completion` is the one I'd reach for at the end of a writing pipeline
(did the post render? do the links resolve?), since the rule of
"evidence before claims" is the same whether the artifact is code or
a markdown file.

The aggression cuts both ways. The loader's "1% rule" means the agent
spends more tokens checking for applicable skills before responding.
On a one-off question, that's overhead. On a multi-step coding task,
that's the point.

# Where I'd actually use it

Three concrete places, in order of value:

1. **Coding tasks where verification matters.** `verification-before-
   completion` alone justifies the install. It turns "the tests should
   pass now" into "I ran the tests, here's the output."
2. **Debugging sessions.** `systematic-debugging` slows the agent down
   in a useful way. Random one-line fixes are the failure mode it's
   built to prevent.
3. **Multi-task plans.** `writing-plans` and
   `subagent-driven-development` are a coherent loop for breaking a
   feature into small reviewable chunks. The plan format itself is
   worth stealing even if you skip the skills.

Where the value is thinner:

- One-shot questions and quick edits. The loader overhead doesn't pay
  off.
- Projects where you already have detailed `CLAUDE.md` rules. The
  skill instructions defer to user instructions ("user instructions
  always take precedence"), but you'll have overlap.
- Non-code work like writing or research. Most skills assume you're
  shipping software.

# Notes

The plugin defers to your project rules. From the loader skill: "If
CLAUDE.md, GEMINI.md, or AGENTS.md says 'don't use TDD' and a skill
says 'always use TDD,' follow the user's instructions." That priority
order matters in a monorepo with [Ruler-managed cross-tool
rules](/ruler-cross-tool-ai-rules.html).

Superpowers ships across Claude Code, Codex CLI, Codex App, Cursor,
OpenCode, GitHub Copilot CLI, and Gemini CLI. The skill files are the
same; the loader adapts to each platform's tool naming. The repo's
[contributor guidelines](https://github.com/obra/superpowers/blob/main/CLAUDE.md)
call out a 94% PR rejection rate with explicit pushback against AI-
generated PRs that don't solve a real problem. Worth reading before
you submit anything.

Install command for Claude Code, from the README:

```bash
/plugin install superpowers@claude-plugins-official
```

The release announcement is on Jesse's blog at
[blog.fsck.com](https://blog.fsck.com/2025/10/09/superpowers/) if you
want the origin story.
