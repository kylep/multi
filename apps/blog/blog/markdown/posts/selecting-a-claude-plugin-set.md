---
title: "Selecting a Claude Plugin Set"
summary: A walk through Claude Code plugins and marketplaces, and how to pick a set without dragging in stuff you didn't read first.
slug: selecting-a-claude-plugin-set
category: ai
tags: Claude-Code, AI, plugins
date: 2026-04-28
modified: 2026-04-29
status: published
image: selecting-a-claude-plugin-set.png
thumbnail: selecting-a-claude-plugin-set-thumb.png
imgprompt: A cute upright cartoon hedgehog in a tool belt holding a glowing power cord whose plug throws a few sparks
keywords:
  - claude code plugins
  - claude code marketplace
  - claude code plugin selection
---

Claude Code has plugins and marketplaces now. This post is about picking a
useful set without dragging in a bunch of stuff that runs hooks on your
machine you didn't read first.


# Plugins and the Marketplace

A Claude Code **plugin** is a folder that bundles things you'd otherwise drop
into `~/.claude/` by hand: slash commands, agents, skills, hooks, MCP server
config, and default settings. (If those terms are fuzzy, the
[cheat-sheet](/claude-code-cheat-sheet.html) covers all of them.) Installing
a plugin is how you grab someone else's bundle without copying files around.

A **marketplace** is a catalog of plugins. It's a JSON file at
`.claude-plugin/marketplace.json` living inside a Git repo, a local
directory, or behind a URL. The file lists which plugins exist and where
to fetch each one. Claude Code ships with the official Anthropic
marketplace added by default, and you can add others.

If you want to make a custom marketplace for internal use, the official
docs are [here](https://code.claude.com/docs/en/plugin-marketplaces).

Installed plugins land in
`~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`.


# Plugins vs Stronger Models

Worth saying upfront: Opus 4.7 is sharp enough at instruction
following that most "methodology" plugins are replaceable by a
200-line CLAUDE.md you wrote yourself. "TDD this, verify before
claiming done, surgical changes only" lands the same as a 14-skill
workflow framework when the model has good baseline discipline.

The plugins that survive that lens are the ones solving problems
the model can't solve by being smarter:

- **Stale training data.** No amount of reasoning fixes "the React
  API changed last month."
- **Constraint against the median.** The model defaults to Inter
  and purple gradients because that's the center of training data.
  Better reasoning doesn't escape that gravity well; explicit
  anti-patterns do.
- **Multi-agent orchestration.** Some review and verification
  patterns are easier with parallel agents than with one careful
  pass.
- **Tool integration.** LSP, MCP servers, browser automation —
  capabilities the model can't replicate by thinking harder.
- **Observability and defensive layers.** Statusline UX,
  destructive-command blocking. These don't change the model;
  they protect or surface state around it.

Methodology plugins (brainstorm, plan, TDD, verify, debug) have
value, but they're training wheels that come off once your
CLAUDE.md gets sharp. The picks below sort roughly along that
lens — capabilities the model can't replicate go in the main
table; methodology and situational layers go in Special Mentions.


# Plugin Recommendations

| Plugin | When you want it | Drawbacks |
|---|---|---|
| [Anthropic frontend-design](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design) | Pushes UI generation away from generic AI slop (Inter, purple-on-white gradients, predictable layouts) toward a committed aesthetic direction | Auto-invokes on every UI task and pushes against defaults you might actually want |
| [Upstash context7](https://github.com/upstash/context7) | Looks up current library API docs (React, Next.js, Prisma, etc.) so Claude works against real, version-specific APIs instead of guessing from training data | Depends on Upstash's hosted MCP server at `mcp.context7.com` (or `npx ctx7` CLI); library names and queries leave your machine |
| [Anthropic code-review](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-review) | Uses 5 parallel agents to review current changes and comment them in the GitHub PR | GitHub-only; the `gh` CLI is hardcoded throughout (no GitLab support without forking) |
| [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) | Four behavioral guidelines (think before coding, simplicity first, surgical changes, goal-driven execution) drawn from [Karpathy's observations](https://x.com/karpathy/status/2015883857489522876) on common LLM coding mistakes. Tiny (one 67-line skill, ~600 tokens); worst case it just sits there doing no harm | Auto-invokes on basically any code-writing task and biases toward caution over speed (the skill says so itself) |
| [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) | Out-of-band statusline showing context usage, model, rate limits, tool activity, agents, and todo progress | Requires editing `settings.json` after install and Node 18+ or Bun on the host |

## Special Mentions

Not always recommended, but situationally useful.

| Plugin | When you want it | Drawbacks |
|---|---|---|
| [obra/superpowers](https://github.com/obra/superpowers) | Pre-baked workflow methodology (brainstorm, plan, TDD, debug, review, verify) with rationalization-resistant prompts. Useful for autonomous runs where you can't read every diff | <ul><li>SessionStart hook injects the always-on `using-superpowers` skill (~1.3–1.5k tokens) whose "1% chance a skill applies → must invoke" framing pulls even trivial work through brainstorming</li><li>Mostly replaceable by a sharp CLAUDE.md if you're attentive during the session</li></ul> |
| [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) | Spec/phase-driven development methodology with explicit slash-commands (`/gsd:plan-phase`, `/gsd:execute-phase`, etc.) instead of Superpowers' implicit auto-invoking skills. Notable: ships prompt-injection scanner hooks that nothing else in this list provides | <ul><li>Massive overlap with Superpowers + Anthropic `code-review` if those are already installed</li><li>11 hooks fire across the agent lifecycle (one of them auto-checks for plugin updates on the network)</li><li>README explicitly recommends installing via `claude --dangerously-skip-permissions`</li><li>1,620-line plan-phase workflow is one of 99 workflow files</li></ul> |
| [wshobson/agents](https://github.com/wshobson/agents) | Cherry-pick code-pattern skills (e.g. `python-development`, `javascript-typescript`, `kubernetes-operations`) when you want a stable baseline that doesn't drift with each model release — especially if your CLAUDE.md doesn't yet codify your own preferences | <ul><li>Agent files are bullet-list mission-statement prose; skills are sharper. Strip or override the agents.</li><li>Each agent declares `model: opus` and `Use PROACTIVELY` — auto-fires on every relevant task at the most expensive model.</li><li>Once your CLAUDE.md captures your conventions, mostly redundant.</li></ul> |
| [Piebald-AI/claude-code-lsps](https://github.com/Piebald-AI/claude-code-lsps) | Working LSP configs for Python, TypeScript, Go, Rust, etc. — Anthropic's own LSP plugins are stubs as of 2026-04-29. Gives Claude compiler-backed symbol definitions, references, hover, and call hierarchy instead of grepping source as text | <ul><li>**Requires patching your Claude Code binary in place via `npx tweakcc --apply`** to fix two gaps Anthropic left in their LSP integration (missing `textDocument/didOpen` notification, and "not yet implemented" guards on modern config fields). The patch is regex-based source rewriting that breaks on each Claude Code update.</li><li>LSP-as-a-tool-call is recent enough that Claude likely has thin training coverage for it; the model may default to grep even when LSP would be more accurate.</li><li>You install the LSP server binaries yourself.</li></ul> |
| [kenryu42/claude-code-safety-net](https://github.com/kenryu42/claude-code-safety-net) | Hooks that prevent some destructive deletion patterns, limited to files and git | <ul><li>Spawns a Node process per Bash call (~50–150ms overhead)</li><li>Blocks some destructive git ops you might actually want (`git branch -D`, `git stash drop`, etc.)</li></ul> |

## Evaluated, not using

- [lackeyjb/playwright-skill](https://github.com/lackeyjb/playwright-skill) — Playwright MCP covers virtually everything it does, with less ceremony and no `/tmp` script-generation pattern. Last updated Dec 2025.
- [cexll/myclaude](https://github.com/cexll/myclaude) — Multi-backend orchestrator (Codex/Gemini/OpenCode in addition to Claude) that downloads a precompiled Go binary during install. Hooks fire on every Bash call and every user prompt (including prompt logging). Sprawl: 5 plugins, 14+ skills, 3 agent groups.
- [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin) — Roughly the same shape as Superpowers (35 skills, 51 agents) but with ~10% of the install count and a Rails-flavored bias. Picking both is redundant.
- [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) — The README endorses (and links the mint address of) a community-minted `$CMEM` Solana memecoin with no technical integration in the codebase. The vector-DB-backed memory itself may be useful, but the maintainer's crypto association is a sketchy signal for what should be devtool reliability. Vector-mediated memory is also probably replaceable by a sharper CLAUDE.md anyway.


# Evaluating Plugins: Methodology

Five filters: read the files not the README, weigh token cost
against frequency of use, check stack fit, inspect the trust
surface, and when two plugins do the same job pick the more
specific and composable one. The full methodology and the prompt I
fed Claude, Gemini, and ChatGPT deep research live in the
[research notes](/wiki/research/claude-plugins.html).





A skill-by-skill walkthrough of obra/superpowers lives in its
own post: [Exploring Claude obra/superpowers Plugin](/exploring-superpowers.html).
