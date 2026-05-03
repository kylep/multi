---
title: "Selecting a Claude Plugin Set"
summary: A walk through Claude Code plugins and marketplaces, and how to pick a set without dragging in stuff you didn't read first.
slug: selecting-a-claude-plugin-set
category: ai
tags: Claude-Code, AI, plugins
date: 2026-04-28
modified: 2026-05-01
status: published
image: selecting-a-claude-plugin-set.png
thumbnail: selecting-a-claude-plugin-set-thumb.png
imgprompt: A cute upright cartoon hedgehog in a tool belt holding a glowing power cord whose plug throws a few sparks
keywords:
  - claude code plugins
  - claude code marketplace
  - claude code plugin selection
---

Claude Code has plugins and marketplace features. Once you've got the basics figured
out, setting up some plugins is the obvious next step to level up your Claude use.


## Table of contents


# Plugin Recommendations

## Install Commands

Unsuprisingly, after looking at a lot of plugins, most of the ones I adopted and would
recommend for general use are already in the default `claude-plugins-official` marketplace:

```bash
/plugin install frontend-design@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install code-review@claude-plugins-official
/plugin install skill-creator@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install claude-md-management@claude-plugins-official
/plugin install ralph-loop@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
/plugin install pyright-lsp@claude-plugins-official
/plugin install security-guidance@claude-plugins-official
```

Community plugins need their marketplace added first:

```bash
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills

/plugin marketplace add jarrodwatts/claude-hud
/plugin install claude-hud@claude-hud
```

Two of the LSP plugins need their language server binary installed
out of band:

```bash
npm install -g typescript-language-server typescript  # for typescript-lsp
pipx install pyright                                  # for pyright-lsp
```

`claude-hud` also needs a one-line edit to `settings.json` after install
to wire up the statusline; just ask Claude to deal with it after reloading the plugin.


## Recommendations

| Plugin | When you want it | Drawbacks |
|---|---|---|
| [Anthropic frontend-design](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design) | Pushes UI generation away from generic AI slop (Inter font, purple-on-white gradients, predictable layouts) toward a committed aesthetic direction | Auto-invokes on every UI task and pushes against defaults you might actually want |
| [Upstash context7](https://github.com/upstash/context7) | Looks up current library API docs (React, Next.js, Prisma, etc.) so Claude works against real, version-specific APIs instead of guessing from training data | Minor security & availability risk: Depends on Upstash's hosted MCP server at `mcp.context7.com` (or `npx ctx7` CLI); library names and queries leave your machine |
| [Anthropic code-review](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-review) | Uses 5 parallel agents to review current changes and comment them in the GitHub PR | GitHub-only; the `gh` CLI is hardcoded throughout (no GitLab support without forking) |
| [Anthropic skill-creator](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator) | Authoring + eval framework for writing your own skills: interview-driven drafting, blind A/B comparison via internal subagents, automated description-iteration loop that tunes triggering reliability against a test set. Python eval scripts.| Idle cost is small (~95 tok metadata; body loads on invoke). The plugin is for *authoring* skills; if you're not writing them, it sits unused. The 485-line SKILL.md body is heavy when active |
| [Anthropic feature-dev](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/feature-dev) | See Plugin Tips. One slash command (`/feature-dev`) that orchestrates a 7-phase build workflow: discovery, parallel codebase exploration via 2-3 read-only Sonnet agents, clarifying questions, architecture, implementation, review with confidence scoring against your CLAUDE.md, and wrap-up. On-demand only, no always-on cost. See tips below | Each invocation runs multiple parallel Sonnet agents, so cost scales per feature. Designed for whole-feature builds, not small tweaks |
| [Anthropic claude-md-management](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management) | See Plugin Tips. `claude-md-improver` skill that finds every CLAUDE.md and proposes targeted diffs after you approve. `/revise-claude-md` to capture session learnings on demand. | The rubric is opinionated about what a CLAUDE.md should contain, so it may flag your existing customizations as gaps. Skill metadata is always-on (~80 tokens); body loads only when triggered. `/revise-claude-md` overlaps with the built-in `#` shortcut |
| [Anthropic ralph-loop](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop) | Stop-hook-driven iterate-until-done loop. Re-fires the same prompt every time Claude tries to exit, until the agent emits a completion sentinel. Useful for self-contained "build this feature, iterate until tests pass" runs you want to leave going. See tips below | Designed for explicit task framing, not exploratory work; the same-prompt re-feed doesn't fit "I'm not sure what I want yet." Always set a `--max-iterations` cap |
| [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) | Four behavioral guidelines (think before coding, simplicity first, surgical changes, goal-driven execution) drawn from [Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on common LLM coding mistakes. Tiny (one 67-line [SKILL.md](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md), ~600 tokens); worst case it sits there doing no harm | Auto-invokes on basically any code-writing task and biases toward caution over speed (the skill says so itself) |
| [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) | Out-of-band statusline showing context usage, model, rate limits, tool activity, agents, and todo progress | Requires editing `settings.json` after install and Node 18+ or Bun on the host |
| [Anthropic typescript-lsp](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/typescript-lsp) | Wires `typescript-language-server` into Claude Code's LSP tool so it gets compiler-backed symbol queries on TS/JS files instead of grepping source as text. Works on Claude Code 2.1.x with no binary patching | Install the LSP server binary yourself. Claude may still default to grep instead of reaching for the LSP tool (I haven't benchmarked this) |
| [Anthropic pyright-lsp](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/pyright-lsp) | Same idea for Python: wires Microsoft's Pyright as the LSP server for `.py` / `.pyi` | Install Pyright yourself. Same "Claude may not reach for LSP" caveat as typescript-lsp |
| [Anthropic security-guidance](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance) | Pre-edit hook that blocks Edit/Write/MultiEdit on 9 conservative danger patterns (GitHub Actions injection, JS code-eval / shell-exec sinks, React/DOM XSS, Python deserialization, shell-out helpers). Fills the pre-edit slot, earlier than commit-time gitleaks or PR-time review. See the [hook source](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/security-guidance/hooks/security_reminder_hook.py) for the pattern set | Substring-only matching, so it false-positives on the same tokens in comments, docstrings, or prose. It blocked an earlier draft of this very row. 9 hardcoded patterns, can't extend without forking. Doesn't run on Bash. Disable per-shell with `ENABLE_SECURITY_REMINDER=0` |


# About Plugins and the Marketplace

A Claude Code **plugin** is a folder that bundles slash commands, agents, skills, hooks,
MCP server config, and default settings. If those terms are fuzzy, this
[cheat-sheet](/claude-code-cheat-sheet.html) covers all of them.

A **marketplace** is a catalog of plugins. It's a JSON file at
`.claude-plugin/marketplace.json` living inside a Git repo, a local
directory, or behind a URL. The file lists which plugins exist and where
to fetch each one. Claude Code ships with the official Anthropic
marketplace added by default, and you can add others.

If you want to make a custom marketplace for internal use, the official
docs are [here](https://code.claude.com/docs/en/plugin-marketplaces).

Installed plugins land in
`~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.


## Plugins vs Stronger Models

While looking into plugins, a lot of them seemed like they were meant to paper over
problems that older models had with coding tasks. Some bundle a lot of skills that are
just markdown guidance for Claude about how to do its thing.

Opus 4.7 is already good enough that "methodology" plugins are replaceable by a short
CLAUDE.md you wrote yourself. "TDD this, verify before claiming done, surgical
changes only" are often good enough to still get great results. I think for myself, and
for any large company, you're better off defining your own standards that align with
historic brownfield preferences when they're present.

I do think there's value
in picking one or two of these if you really agree with approaches it outlines, and I
suspect that at scale it'll result in more consistancy then what you'll get from changing
models over time. Despite that, I'm not recommending any "methodology" ones directly,
and instead categorizing them as "Special Mentions". Transparently, for each of those,
I took a peak at what they do, think "this is probably great for someone", but I didn't
try and use them in any meaningful way.


The plugins that I do recommend, and do have installed, are ones that solve other
problems. A few examples of what I mean by "other problems":

- **Stale training data.** No amount of reasoning fixes "the React API changed last month."
- **Constraint against the median.** The model defaults to boring/uninspired approaches, fixes that
- **UX Improvements**: They make Claude look/feel better and easier to work with
- **Tool-enabled plugins**: Provide skills that have non-markdown capabilities
- **High Singal Methodology**: Short, low-token guidance that goes beyond coding advice


## How I Evaluated These

- I started with my usual Deep Research sythesis approach, see [research notes](/wiki/research/claude-plugins.html).
  - It was ~ok, but honestly if I went back in time I think I'd just go through the official marketplace plugins by popularity first instead.
- Any plugins that seem like they have a notable learning curve get at most 'Special Mentions' status
- If Opus 4.7 is already doing what they claim to do well I don't really want it
- Some have sketchy associations like being related to some crypto noise, those are outright avoided
- Anything that has a high upfront token cost is avoided

I intend to come back to the Special Mentions when I feel the "Not Invented Here" itch
and have claude find common themes then lift what I like from them, like I did with
OpenClaw.


# Plugin Tips

Specific notes on getting useful behavior out of plugins from the
recommendations above.

## Context7

Two tricks worth knowing:

- Write `use context7` in a prompt to force a docs lookup even when
  Claude thinks it already knows the API.
- Pin a version when training data is stale: `use context7 for react 19.0`.


## Code-review

Invoke with `/code-review:code-review` (or the unscoped `/review` if
nothing else collides). Reads the current PR's diff via `gh pr diff`,
fans out parallel sub-reviews, consolidates the findings, and posts
inline comments on the PR.

Pairs with `feature-dev`: feature-dev for the build, code-review for
the post-PR critique.


## Skill-creator

The under-explained Anthropic plugin. The auto-invoking skill triggers
on phrases like "create a skill" / "improve this skill" / "optimize the
description". When triggered, it interviews you, drafts a `SKILL.md`,
then offers to run the eval loop: blind A/B comparison of skill
variants via internal subagents, and an automated description-tuning
pass that iterates the YAML description against a test set you provide
until triggering reliability is high. The eval is real Python, not just
markdown asking nicely.

You'll only get the value if you actually feed it a test set of
trigger and non-trigger prompts. Skip that and it's just an interview
helper.


## Feature-dev

Install with:

```bash
/plugin install feature-dev@claude-plugins-official
```

Invoke with a feature description, with or without arguments:

```bash
/feature-dev "Add a /export endpoint that streams CSV of recent orders"
```

The slash command runs a 7-phase workflow. Phase 2 fans out 2-3
read-only `code-explorer` Sonnet agents in parallel to map the
relevant code, then a `code-architect` agent proposes an approach,
the orchestrator implements, and a final `code-reviewer` pass
scores its work against your CLAUDE.md before wrap-up. All three
agents are read-only Sonnet; only the orchestrator writes files.

Two practical notes:

1. The exploration fan-out is the actual differentiator. Skip it
   for small tweaks where one Read+grep would do; the parallel
   agent cost only pays off on whole-feature work.
2. It composes well with `code-review`: feature-dev for the
   build, code-review for the post-PR critique.


## Claude-md-management

Two complementary tools, used at different times:

- The `claude-md-improver` skill auto-invokes on phrases like
  "audit my CLAUDE.md" or "check if my CLAUDE.md is up to date".
  Use it as a periodic outside-in review when you suspect drift
  between your CLAUDE.md and the actual codebase.
- `/revise-claude-md` is for capture-from-this-session: run it
  at the end when you noticed Claude lacked context that would
  have helped. Same job as the built-in `#` shortcut, with an
  explicit "show me the diff first" flow.

Three things to keep in mind:

1. The discovery `find` only catches `CLAUDE.md`, `.claude.md`,
   and `.claude.local.md`. It misses nested-package CLAUDE.md
   files in unusual layouts and the auto-memory layer at
   `~/.claude/projects/<repo>/memory/`. Treat it as a
   shared-CLAUDE.md auditor, not a full project-memory auditor.
2. The quality rubric expects commands, architecture, and gotchas
   in a specific shape. If your CLAUDE.md is heavily customized
   with feedback rules, agent ecosystem notes, or repo conventions,
   the rubric may flag intentional choices as gaps. Skim the
   report, don't apply blindly.
3. Read every proposed diff. The skill is conservative but can
   suggest restating things already obvious from the code, which
   adds noise rather than reducing token cost.


## Ralph-loop

Frame the task with explicit success criteria, then call:

For example, here's the call I'd use to keep tightening this very post
against my style guide and reviewer agent until both pass clean:

```bash
/ralph-loop "Review apps/blog/blog/markdown/posts/selecting-a-claude-plugin-set.md
against the style guide at apps/blog/blog/markdown/posts/.ruler/style.md.
Fix every violation you find: em-dashes, hedging stacks, AI-tells,
walls of text, tables where prose works, internal links missing .html.
Then dispatch the reviewer agent for a substance pass. When the reviewer
returns zero blocking issues, emit <promise>REVIEW-CLEAN</promise>." \
  --completion-promise "REVIEW-CLEAN" \
  --max-iterations 20
```

The Stop hook blocks Claude's exit and re-feeds the same prompt
until either the completion-promise sentinel appears or the
iteration cap hits. File state and git history persist between
iterations, so previous work informs the next pass. Use it for
build-and-test or refinement-against-a-fixed-spec loops, not for
exploratory work where the goal isn't crisp yet.

`/ralph-loop:cancel-ralph` stops it early.


# Special Mentions

Not always recommended, but situationally useful. I think these are neat, but didn't
test them much.

| Plugin | When you want it | Drawbacks |
|---|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | Pre-baked workflow methodology (brainstorm, plan, TDD, debug, review, verify) with rationalization-resistant prompts. Useful for autonomous runs where you can't read every diff | <ul><li>SessionStart hook injects the always-on [`using-superpowers` SKILL.md](https://github.com/obra/superpowers/blob/main/skills/using-superpowers/SKILL.md) (5,421 chars / ~1.3–1.5k tokens) whose "1% chance a skill applies → must invoke" framing pulls even trivial work through brainstorming</li><li>Mostly replaceable by a sharp CLAUDE.md if you're attentive during the session</li></ul> |
| [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) | Spec/phase-driven development methodology with explicit slash-commands (`/gsd:plan-phase`, `/gsd:execute-phase`, etc.) instead of Superpowers' implicit auto-invoking skills. Notable: ships prompt-injection scanner hooks that nothing else in this list provides | <ul><li>Massive overlap with Superpowers + Anthropic `code-review` if those are already installed</li><li>[11 hooks](https://github.com/gsd-build/get-shit-done/tree/main/hooks) fire across the agent lifecycle (one auto-checks for plugin updates on the network)</li><li>README explicitly recommends installing via `claude --dangerously-skip-permissions`</li><li>1,620-line [`plan-phase.md`](https://github.com/gsd-build/get-shit-done/blob/main/get-shit-done/workflows/plan-phase.md) is one of [99 workflow files](https://github.com/gsd-build/get-shit-done/tree/main/get-shit-done/workflows)</li></ul> |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | Full agile-lifecycle framework (Analysis → Plan → Solutioning → Implementation) with 42 skills including role-persona helpers (`bmad-agent-pm`, `bmad-agent-ux-designer`, `bmad-agent-architect`, `bmad-agent-dev`) and "party mode" multi-persona collab. Differentiated from Superpowers by explicit PRD/architecture skills and agile-ceremony coverage | <ul><li>Same methodology bucket as Superpowers and gsd; redundant if either is already installed</li><li>~3x bigger than Superpowers (42 skills vs 14)</li><li>Some skills (`bmad-retrospective`, `bmad-sprint-planning`) are team-process oriented and don't apply to solo work</li><li>Installs via `npx bmad-method install` rather than `/plugin install`; requires Node 20+ and Python 3.10+ with `uv`</li></ul> |
| [wshobson/agents](https://github.com/wshobson/agents) | Cherry-pick code-pattern skills (e.g. `python-development`, `javascript-typescript`, `kubernetes-operations`) when you want a stable baseline that doesn't drift with each model release, especially if your CLAUDE.md doesn't yet codify your own preferences | <ul><li>Agent files are bullet-list mission-statement prose; skills are sharper. Strip or override the agents.</li><li>Each agent declares `model: opus` and `Use PROACTIVELY`, so it auto-fires on every relevant task at the most expensive model.</li><li>Once your CLAUDE.md captures your conventions, mostly redundant.</li></ul> |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 7-command lifecycle framework (`/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`) with 21 skills covering each phase. Author has Google Chrome eng credibility | <ul><li>Methodology framework, same bucket as Superpowers and gsd. Redundant if you have either installed.</li><li>Ships hooks (session-start, sdd-cache, simplify-ignore) and 4 agents (code-reviewer, security-auditor, test-engineer, plus README).</li><li>Same "replaceable by a sharp CLAUDE.md" caveat applies.</li></ul> |
| [kenryu42/claude-code-safety-net](https://github.com/kenryu42/claude-code-safety-net) | Hooks that prevent some destructive deletion patterns, limited to files and git | <ul><li>Spawns a Node process per Bash call (estimated 50–150ms overhead based on cold Node startup; I haven't benchmarked it)</li><li>Blocks some destructive git ops you might actually want (`git branch -D`, `git stash drop`, etc.)</li></ul> |
| [mattpocock/skills](https://github.com/mattpocock/skills) | Matt Pocock's personal `.claude` directory, made public. Sharp, composable engineering skills (`diagnose`, `tdd`, `triage`, `to-prd`, etc.) explicitly positioned against heavy frameworks like GSD, BMAD, and Spec-Kit. I'd lift the ones you like into your own setup rather than installing the whole thing | <ul><li>It's *his* `.claude` directory: there's personal stuff in there (Obsidian vault management, article editing) that won't apply to you</li><li>Some skills overlap with picks already on this page (`git-guardrails-claude-code` overlaps with safety-net)</li><li>The full walkthrough is below if you want to cherry-pick</li></ul> |
| [zilliztech/claude-context](https://github.com/zilliztech/claude-context) | MCP server that semantically indexes your own codebase. Useful for vague cross-cutting queries on large monorepos where Claude would otherwise burn turns grepping around | <ul><li>**Costs money in the default setup.** Vector DB (Zilliz Cloud free tier or self-hosted Milvus) plus embedding provider (OpenAI / VoyageAI / Gemini / Ollama). Solo-dev monthly spend is typically pennies to a few dollars; fully-local Milvus + Ollama is free but you run two extra services.</li><li>Slower per-query than ripgrep and worse on exact-symbol queries. Pays off on vague semantic queries, not precise ones.</li></ul> |
| [Anthropic code-simplifier](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier) | **Mostly useful if you're coding with Sonnet or cheaper models.** Auto-invoking agent that refactors recently-modified code: reduce nesting, kill redundant code, drop nested ternaries, normalize naming. The auto-invoke pattern is the genuine non-replaceable value (a CLAUDE.md alone can't fire after every edit). The underlying rules become mostly redundant on Opus 4.7 with a sharp CLAUDE.md | <ul><li>Bakes in Anthropic-internal style preferences (ES modules, `function` keyword over arrows, explicit return types, specific React patterns) that may not match your project conventions</li><li>Proactive auto-invocation can fire on recently-modified code where you don't want a refactor pass</li></ul> |


# Evaluated, Not Using

I looked at these and would not recommend them

- [lackeyjb/playwright-skill](https://github.com/lackeyjb/playwright-skill). Playwright MCP covers virtually everything it does, with less ceremony and no `/tmp` script-generation pattern. Last updated Dec 2025.
- [cexll/myclaude](https://github.com/cexll/myclaude). Multi-backend orchestrator (Codex/Gemini/OpenCode in addition to Claude) that downloads a precompiled Go binary during install. Hooks fire on every Bash call and every user prompt (including prompt logging). Sprawl: 5 plugins, 14+ skills, 3 agent groups.
- [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin). Roughly the same shape as Superpowers (35 skills, 51 agents) but at 15.8k stars vs Superpowers' 171k as of 2026-04-29, and with a Rails-flavored bias. Picking both is redundant.
- [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem). The [README](https://github.com/thedotmack/claude-mem/blob/main/README.md) endorses (and links the mint address of) a community-minted `$CMEM` Solana memecoin with no technical integration in the codebase. Vector-DB-backed memory might be useful, but the maintainer's crypto association is a sketchy signal for what should be devtool reliability.
- [github/spec-kit](https://github.com/github/spec-kit). 92k stars, GitHub-published, but it's a Python CLI that templates spec-driven-development workflows into your project rather than a Claude Code plugin. The methodology layer is replaceable by a sharp CLAUDE.md, and the unique value (agent-agnostic orchestration across Claude Code, Cursor, Copilot, Codex, etc.) doesn't apply to a solo Claude Code setup.
- [Anthropic github](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/github). Hosted GitHub MCP server. Requires a Personal Access Token in `$GITHUB_PERSONAL_ACCESS_TOKEN` and routes queries through `api.githubcopilot.com` — extra trust surface I don't need given that the `gh` CLI already covers my GitHub operations.
- [Anthropic playwright](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/playwright). The plugin is a thin wrapper that runs `npx @playwright/mcp@latest` — the exact same Microsoft package the [Playwright MCP](https://github.com/microsoft/playwright-mcp) server uses. If you want browser automation, register the MCP server directly (`@playwright/mcp@latest` via your `~/.claude.json` or `.mcp.json`); the plugin layer adds nothing.
- [Anthropic claude-code-setup](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-code-setup). One auto-invoking, read-only skill (`claude-automation-recommender`) that scans a codebase and outputs a structured "top 1-2 per category" recommendation report across MCP servers, skills, hooks, subagents, and plugins. Genuinely useful for *greenfield* projects where you're starting from zero. Redundant for an established setup like mine: the lookup tables can't see that I've already considered and decided on context7, Playwright MCP, Linear MCP, etc., and they don't know about my custom agent ecosystem. Recommendations also tend to surface other plugins from the official marketplace, some of which I've already moved to this section. This whole post is the output of doing the same analysis manually with a sharper filter (the "Plugins vs Stronger Models" framework above).
- [Anthropic commit-commands](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/commit-commands). Three slash commands: `/commit`, `/commit-push-pr`, `/clean_gone`. The first two conflict with my repo conventions: my CLAUDE.md requires Linear-format branch names (`kyle/<ISSUE-ID>-short-description`), `gh pr create --assignee kylep`, and a specific Co-Authored-By line, none of which the plugin knows about. `/commit` is also already covered by Claude Code's built-in system prompt instructions for git commits. `/clean_gone` is the genuine win: it bundles a small bash pipeline that finds local branches whose remote is gone, removes any associated worktrees, and deletes the branches. I'd rather lift that into a `bin/` script than install three commands to get one.
- [Piebald-AI/claude-code-lsps](https://github.com/Piebald-AI/claude-code-lsps). Working LSP configs for ~25 languages including fringe ones (Ada, BSL, OCaml, Solidity, Vue, Svelte, Scala, Julia, LaTeX, etc.) that Anthropic doesn't ship plugins for. For my languages of concern (TypeScript, Python), Anthropic's first-party `typescript-lsp` and `pyright-lsp` cover the same ground. The Piebald README still pitches `npx tweakcc --apply` as required, but on Claude Code 2.1.x the underlying gaps are mostly resolved natively: `textDocument/didOpen` and `startupTimeout` are wired up; only `restartOnCrash` is still gated, and Piebald's default `marketplace.json` doesn't set it. I'd revisit if I started writing one of the languages Anthropic doesn't cover.
