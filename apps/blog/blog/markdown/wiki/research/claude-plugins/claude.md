---
title: "Claude Deep Research: Five honest picks for a senior Claude Code stack"
summary: "Claude Deep Research report on Claude Code plugins worth installing. Recommends five installs plus a paste-job (Superpowers, Anthropic code-review, Anthropic frontend-design, kenryu42 safety-net, wshobson/agents subset, jarrodwatts/claude-hud) after reading SKILL.md files, agent prompts, hook scripts, and manifests across the official marketplace, top community repos, and trending threads."
keywords:
  - deep-research
  - claude
  - claude-code
  - plugins
  - skills
  - marketplace
  - evaluation
provider: claude
prompt: |-
  You are evaluating Claude Code plugins, skills, and marketplaces to
  recommend a small curated set worth installing.

  Context about me:
  - I will personally try every plugin you recommend. If you pad the
    list, you waste my hours.
  - I won't recommend a plugin to anyone else without using it myself.
  - Don't pad. If only 2 plugins clear the bar, return 2. If 15 do,
    return 15.

  Sources to evaluate:
  1. Anthropic's official marketplace:
     github.com/anthropics/claude-plugins-official
  2. The most-starred GitHub repos shipping Claude Code plugins, skills,
     or subagents. Search GitHub for `claude-code`, `claude-plugin`,
     `SKILL.md`, `.claude/plugins`, sorted by stars and by recent
     activity.
  3. Trending posts in the last 60 days: Hacker News, r/ClaudeAI,
     r/LocalLLaMA, Twitter/X. Surface anything getting real traction.
  4. These candidates I've flagged but haven't evaluated:
     - forrestchang/andrej-karpathy-skills
     - obra/superpowers
     - everything-claude-code

  Evaluation criteria (apply all; reject anything that fails):
  1. Read the actual files, not the README. Open SKILL.md, agent
     definitions, and hook scripts. If the prompt is generic ("you are
     an expert..."), reject.
  2. Token cost. Skills load into context. Always-on skills have to
     justify their token weight against how often someone uses the
     feature.
  3. Stack fit. My stack is Python, TypeScript, Kubernetes, and
     Next.js. Reject anything Rails, PHP, or Java-specific.
  4. Trust surface. Flag (don't auto-reject) anything shipping hooks,
     MCP servers, or settings that pre-approve permissions like
     `Bash(*)`.
  5. When two plugins do the same job, pick the one with sharper
     instructions that's more composable. Reject the bloated "do
     everything" version.

  For each plugin you RECOMMEND, return:
  - Repo URL
  - One sentence on what it does
  - Frequency: how often someone in my position would invoke it
  - What's inside (slash commands, skills, agents, hooks, MCP servers)
    and approximate token weight
  - Why it beats the alternatives, or "no real alternative"
  - Trust surface notes (anything worth knowing before installing)

  For each plugin you DROPPED that's popular or frequently mentioned,
  return one line on why you cut it.

  Hard rules:
  - Star count and trendiness are inputs, not the answer.
  - If something is hyped but the actual files are thin, say so.
  - Don't pad. Be objective. If a category has no good plugin, say so
    and recommend nothing for that category.
date_generated: 2026-04-28
related_posts:
  - selecting-a-claude-plugin-set
related:
  - wiki/research
scope: "Full Claude Deep Research report. Audits the Anthropic official marketplace, top ~25 community repos by stars, and trending HN/Reddit/X threads from March-April 2026. Covers methodology vs prompts pattern, top recommendations with detailed trust-surface notes, notable drops with one-line reasons, ecosystem gaps (Kubernetes, database tooling, persistent memory), verdicts on the three flagged candidates (forrestchang/andrej-karpathy-skills, obra/superpowers, everything-claude-code), and a minimal install profile with sequencing."
last_verified: 2026-04-28
---

The shortlist below is **five installs plus one paste-job**, after reading SKILL.md files, agent prompts, hook scripts, and manifests across the official Anthropic marketplace, the top ~25 community repos by stars, the trending threads on HN/Reddit/X over March–April 2026, and your three flagged candidates. The Claude Code ecosystem is mostly noise right now — generic "you are a senior X" prompts, kitchen-sink toolkits that collapse the 200k context, and "27k stars in 30 days" repos coasting on SEO blogs from competing AI-coding vendors. The signal-to-noise ratio in the file contents themselves is far worse than star counts suggest. The picks below are the ones whose actual files justify their footprint.

A theme worth naming up front: **methodology beats prompts, and small focused beats kitchen-sink**. The two highest-value picks (Superpowers, Anthropic's `code-review`) win because they encode a real workflow with named failure modes — not because they declare expertise. Most of what got cut declared expertise without encoding anything.

## Top recommendations

### 1. obra/superpowers — agentic methodology framework
- **URL:** https://github.com/obra/superpowers
- **What it does:** Enforces a brainstorm → plan → TDD → review → verify loop through ~14 self-invoking skills, the sharpest prompt engineering on the marketplace today.
- **Frequency:** **Daily.** Most sessions touch at least `using-superpowers`, `writing-plans`, `test-driven-development`, or `systematic-debugging`.
- **What's inside:** 14 skills (`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `dispatching-parallel-agents`, `writing-skills`, `using-superpowers`); 1 agent (`code-reviewer`); 1 SessionStart bash hook; 3 deprecated command shims. **Token weight: ~1.5k always-on at SessionStart, rest load on demand.**
- **Why it wins:** Direct quotes betray the difference. From `test-driven-development/SKILL.md`: *"If you didn't watch the test fail, you don't know if it tests the right thing. Violating the letter of the rules is violating the spirit of the rules."* From `using-superpowers/SKILL.md`'s rationalizations table: *"'Let me explore the codebase first' → Skills tell you HOW to explore. Check first."* The prompts have been TDD'd against subagent stress tests. EveryInc's `compound-engineering-plugin` covers similar ground but is heavier (36 skills, 51 agents) and has Rails-flavored pieces; Superpowers is the sharper composable choice.
- **Trust surface:** **One SessionStart bash hook** (`hooks/session-start.sh`) that `cat`s a SKILL.md, JSON-escapes it, emits as `additionalContext`. Auditable and benign. No Bash pre-approvals, no MCP, no network calls. The aggressive "1% chance a skill applies → must invoke it" instruction will resist your "just patch it real quick" muscle memory by design — add a CLAUDE.md override for trivial work or you'll route every typo fix through brainstorming.

### 2. Anthropic `code-review` plugin (from the official marketplace)
- **URL:** https://github.com/anthropics/claude-plugins-official (install via `/plugin marketplace add anthropics/claude-plugins-official` then `code-review`)
- **What it does:** Orchestrates a Haiku eligibility check, a Haiku CLAUDE.md scan, then **5 parallel Sonnet sub-agents** (CLAUDE.md compliance, shallow bug scan, git-blame historical context, prior-PR-comment recurrence, comment-vs-code consistency), then per-issue Haiku confidence scoring with a <80 false-positive filter.
- **Frequency:** **Per PR — multiple times daily** if you review actively.
- **What's inside:** One command (`/code-review`) that fans out to ~10 internal subagents at runtime. **Token weight: medium command (~2k); high runtime cost from the fan-out.**
- **Why it wins:** This is the only review plugin in the survey with real prompt engineering — explicit confidence rubric, two-stage filtering, optional `--comment` to GitHub. Anthropic claims internal substantive-comment rate moved 16% → 54% after rollout, and an independent LogRocket test on a tRPC repo corroborated the quality jump. Beats Anthropic's own `pr-review-toolkit` (sharp but overlaps), VoltAgent's "code-reviewer" subagent (boilerplate persona), and CodeRabbit's MCP (sends your code to a third party).
- **Trust surface:** Read-only by default. Calls `gh` CLI only when you pass `--comment`. No PreToolUse hooks, no MCP, no auto-edits. Pair with Anthropic's `pr-review-toolkit` if you want the `silent-failure-hunter` and `type-design-analyzer` agents specifically — those two are differentiated enough to justify the duplication with `code-reviewer`.

### 3. Anthropic `frontend-design` skill
- **URL:** https://github.com/anthropics/claude-plugins-official (skill: `frontend-design`)
- **What it does:** Auto-invokes on UI tasks and forces Claude to commit to a bold aesthetic (brutalist, maximalist, retro-futuristic, luxury, etc.) before coding, explicitly forbidding the default Inter+purple-gradient AI slop.
- **Frequency:** **Whenever building Next.js UI.** Auto-invokes; you don't trigger it manually.
- **What's inside:** A single `SKILL.md` of ~1.5–2k tokens covering typography pairing, motion + reduced-motion compliance, spatial composition, "match implementation complexity to aesthetic vision." No agents, no hooks, no commands. **Token weight: medium, on-demand.**
- **Why it wins:** Reads like a creative-director brief, not boilerplate — and it's the rare skill that produces visibly better Next.js output without you doing anything. **No real alternative**; everything else in the design space (huashu-design, awesome-claude-design from the April skill cluster) is too new or off-stack.
- **Trust surface:** **Zero.** Pure prompt content. No hooks, no network, no shell.

### 4. kenryu42/claude-code-safety-net — install before anything else
- **URL:** https://github.com/kenryu42/claude-code-safety-net
- **What it does:** A PreToolUse hook that blocks `git reset --hard`, `git checkout -- <files>`, `rm -rf ~/`, and similar history- and data-destroying commands **before** Claude Code's permission system even sees them.
- **Frequency:** **Always-on, fires per Bash call.** Effectively invisible until it saves you.
- **What's inside:** One `hooks/hooks.json`, two slash commands (`/set-custom-rules`, `/verify-custom-rules`). **Token weight: trivial** — JSON rules, no prose loaded into context.
- **Why it wins:** The README correctly explains why this is necessary: *"PreToolUse hooks run before the permission system… Sandboxing sees `git reset --hard` as a safe operation—it only modifies files within the current directory. But you just lost all uncommitted work."* Custom rules are additive only — they cannot weaken built-in protections, which is the right design. **No real alternative**; nothing else in the survey defends against this specific failure mode.
- **Trust surface:** **Inverts trust surface** — adds blocks rather than approvals. Critical contrast: `cexll/myclaude` and similar repos ship `Bash(git:*)` pre-approvals which cover `git push --force` and `git clean -fd`. Safety Net is the antidote to that pattern.

### 5. wshobson/agents — but install only 4–6 plugins, not the marketplace
- **URL:** https://github.com/wshobson/agents
- **What it does:** A modular marketplace of 73+ plugins where you install just the language/domain bundles you need; each ships agents + skills + commands together using Anthropic's progressive-disclosure pattern.
- **Frequency:** **Weekly per plugin** (varies by domain).
- **What's inside (install only these):** `python-development` (agents: python-pro, django-pro, fastapi-pro; skills: async-python-patterns, python-testing-patterns, python-packaging, python-performance-optimization, uv-package-manager), `javascript-typescript` (typescript-pro, javascript-pro + 4 skills incl. nextjs), `kubernetes-operations` (kubernetes-architect agent, k8s-manifest-generator, helm-chart-scaffolding, gitops-workflow, k8s-security-policies), `comprehensive-review`, optionally `conductor` (Context→Spec→Plan→Implement workflow) and `agent-teams`. **Token weight: ~1k per installed plugin** thanks to progressive disclosure; do not install the catalog.
- **Why it wins:** The skills are concrete code, not philosophy. From `async-python-patterns/SKILL.md`: *"Stay fully sync or fully async within a call path. Mixing creates hidden blocking and complexity."* with actual producer/consumer code in `references/`. Beats VoltAgent (generic personas + JSON cargo-cult "Communication Protocols"), 0xfurai/claude-code-subagents (same boilerplate pattern, no skill scaffolding), and lst97/claude-code-sub-agents. The `kubernetes-architect` agent file itself is bullet-heavy mission-statement prose — the **k8s value lives in the skills, not the agent**, so override or trim that prompt if you find it loose.
- **Trust surface:** Per-agent `tools:` allowlists are explicit and reviewer agents are read-only. No global Bash pre-approvals. MCP optional. No auto-installed hooks. README explicitly disclaims security/correctness review of any agent — read each before installing.

### 6. jarrodwatts/claude-hud — zero-context observability
- **URL:** https://github.com/jarrodwatts/claude-hud
- **What it does:** A statusline plugin that renders model+context bar, 5h/7d usage, tool activity, agent status, and todo progress by parsing the native statusline JSON and the transcript JSONL.
- **Frequency:** **Always visible.** You glance at it constantly.
- **What's inside:** Statusline TS code (Node 18+/Bun), 2 commands (`/claude-hud:setup`, `/claude-hud:configure`). No agents, no skills, no hooks. **Token weight: zero in Claude's context** — runs out-of-band; output goes to your terminal, not the model.
- **Why it wins:** Genuinely useful now that Sonnet/Opus 4.6's 1M-token context makes long sessions normal. The CLAUDE.md gets internals right: *"statusLine is NOT a valid plugin.json field. It must be configured in settings.json after plugin installation."* Has tests, dependency injection, ghost-install detection. No real alternative at this quality level.
- **Trust surface:** **Lowest possible.** Read-only; no tool-execution capability; no telemetry.

## Notable drops with one-line reasons

**affaan-m/everything-claude-code** — 167k stars, but ships 12+ always-on hooks that block plan-mode writes (issue #240) and dev servers outside tmux (issue #248), 9 preconfigured MCPs that the README itself warns can collapse 200k → 70k context, plus marketing/fundraising skills (`investor-outreach`, `brand-voice`, `social-graph-ranker`) that have nothing to do with engineering — and *no Kubernetes skill at all* (it's listed under "Ideas for Contributions"). Cherry-pick reference patterns; do not install.

**thedotmack/claude-mem** — Real engineering, but the install ships an Express HTTP worker on port 37777, a SQLite DB, a Chroma vector DB, an MCP server, and 5 lifecycle hooks; trust+complexity exceeds value unless persistent memory is a hard requirement. The author also tied a Solana token (`$CMEM`) to the project, which contaminates the "growth signal."

**JuliusBrussee/caveman** — Real HN traction, but only compresses **output** tokens; agentic coding sessions are dominated by **input** tokens. HN top comment got this right. Install only if you specifically want terse responses.

**VoltAgent/awesome-claude-code-subagents** — Despite ~18k stars, `typescript-pro.md` opens with *"You are a senior TypeScript developer with mastery of TypeScript 5.0+…"* and agents wrap themselves in fake JSON "Communication Protocol" payloads. Generic personas with cargo-cult roleplay; rejected on file contents.

**0xfurai/claude-code-subagents, lst97/claude-code-sub-agents, davepoon/buildwithclaude, ananddtyagi/cc-marketplace, CloudAI-X/claude-workflow-v2, jeremylongshore/claude-code-plugins-plus-skills (claims 270+ plugins/739 skills)** — Same generic-expert-persona pattern, plus quantity-over-quality red flag on the last one.

**cexll/myclaude** — Disqualifying: ships `Bash(git:*), Bash(codex:*)` pre-approvals in skill files. `Bash(git:*)` covers `git push --force` and `git clean -fd`.

**Anthropic LSP plugins (`pyright-lsp`, `typescript-lsp`, `gopls-lsp`, etc., 12 total)** — All currently broken. The plugin folders ship only README.md; the `lspServers` config in `marketplace.json` is never actually copied to Claude Code's cache (issues #379 and claude-code#15235). Use Piebald-AI/claude-code-lsps as the working alternative for Pyright + TypeScript.

**Anthropic `learning-output-style` and `explanatory-output-style`** — Anthropic's own README warns: *"Do not install this plugin unless you are fine with incurring the token cost."* Believe them.

**EveryInc/compound-engineering-plugin** — Genuinely sharp, but overlaps heavily with Superpowers; pick one. Compound is heavier (36 skills, 51 agents) and ships Rails-flavored pieces; Superpowers is the sharper composable choice. Worth a look only if you bounce off Superpowers' aggressive self-invocation style.

**letta-ai/claude-subconscious** — Vendor lead-gen demo for the Letta Code SDK; README explicitly says *"not intended for production."*

**ruvnet/claude-flow, eyaltoledano/claude-task-master, claudemarketplaces.com / claudepluginhub.com** — Marketing-heavy; the first two are vague on actual file quality, the second two are SEO catalog plays with paid sponsor slots, not adoption signals.

## Categories where the ecosystem has nothing good

**Kubernetes-specific plugins.** The strongest you can do is wshobson's `kubernetes-operations` skills (k8s-manifest-generator, helm-chart-scaffolding, gitops-workflow, k8s-security-policies) — and even there, the `kubernetes-architect` agent prompt is bullet-list philosophy, not crisp instructions. There is no equivalent of the `frontend-design` skill for K8s. The `everything-claude-code` README admits this gap. Recommendation: install wshobson's k8s skills, override or strip the agent file, and rely on Superpowers' methodology for the workflow.

**Database tooling.** External plugins exist (`prisma`, `neon`, `planetscale`, `cockroachdb` in the official external_plugins) but they're vendor MCPs that need credentials and most aren't sha-pinned, so install pulls upstream HEAD. Only adopt if you're committed to that vendor; otherwise nothing in the marketplace is generically good.

**Persistent memory.** The category has organic pull (multiple HN copycats in March–April), but every option ships meaningful infrastructure: HTTP worker, vector DB, MCP server, 5+ hooks. No "small and tasteful" pick exists yet. Wait for Anthropic to ship something native, or accept the trust surface of `claude-mem` if memory is a hard requirement.

**Deployment helpers.** Vendor MCPs (Netlify, Railway, AWS Labs, Vercel) exist but each is just an API wrapper. Nothing language-agnostic and tasteful enough to recommend generically.

## Verdicts on your three flagged candidates

**forrestchang/andrej-karpathy-skills** — Surprisingly sharp content despite the absurd hype-to-content ratio (91k stars for one ~600-token markdown file). The 4 principles target real LLM failure modes (silent assumptions, drive-by refactors, overengineering) and ship concrete tests like *"If you write 200 lines and it could be 50, rewrite it. Ask yourself: 'Would a senior engineer say this is overcomplicated?'"* — not boilerplate. **Verdict: paste the 4 principles into your `~/.claude/CLAUDE.md` directly** (Option B in the README). Don't install the plugin — same content, no marketplace dependency, you keep authorship of your own CLAUDE.md.

**obra/superpowers** — The strongest pick on the entire marketplace. Sharp, disciplined, occasionally dogmatic by intent (it's designed to resist Claude's rationalizations under pressure). Promoted to recommendation #1 above. **Verdict: install.**

**everything-claude-code (affaan-m/everything-claude-code, ~167k stars — confirmed the right repo)** — The textbook bloated kitchen-sink Anthropic's own best-practices warn against. It's a startup product (Tkinter dashboard, Rust control-plane, billing portal, GitHub App, npm CLI, security scanner) more than a plugin. The hooks fight the user — issue #240 confirms it blocks Claude Code's own native plan-mode writes; issue #248 confirms it blocks dev servers outside tmux. The README claims drift wildly between versions (28/119/60 → 38/156/72 → 48/183/79). And critically, **no K8s skill exists** — it's still in "Ideas for Contributions." **Verdict: do not install. Cherry-pick reference patterns from `commands/tdd.md`, `commands/plan.md`, the `nextjs-turbopack` skill if curious, and walk away.**

## The minimal install profile

Sequence matters. Install in this order: **(1)** `kenryu42/claude-code-safety-net` first so the next four can't hurt you, **(2)** `obra/superpowers` for methodology, **(3)** Anthropic's `claude-plugins-official` marketplace and from it select `code-review` and `frontend-design`, **(4)** `wshobson/agents` and from it cherry-pick `python-development`, `javascript-typescript`, `kubernetes-operations`, `comprehensive-review`, **(5)** `jarrodwatts/claude-hud` for observability. Then paste Karpathy's 4 principles into `~/.claude/CLAUDE.md`. Total always-on context cost: roughly 2–3k tokens. Total trust surface: one auditable SessionStart hook (Superpowers), one PreToolUse safety hook (Safety Net), and read-only review/design skills. That's the honest five — everything else is something to evaluate later or skip.
