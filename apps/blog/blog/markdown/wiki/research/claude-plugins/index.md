---
title: "Claude Code Plugins"
summary: "Three Deep Research reports on which Claude Code plugins, skills, and marketplaces are worth installing, generated from the same prompt across ChatGPT, Gemini, and Claude."
keywords:
  - deep-research
  - claude-code
  - plugins
  - skills
  - marketplace
  - evaluation
related:
  - wiki/research
scope: "Subject index for Claude Code plugin selection research. Links to three provider reports plus a cross-source synthesis."
last_verified: 2026-04-28
---

Three Deep Research reports on which Claude Code plugins, skills, and
marketplaces are worth installing, generated from the same prompt across
three providers. Used as input for the
[Selecting a Claude Plugin Set](/selecting-a-claude-plugin-set.html) blog post.

## Methodology

Trending GitHub plugins aren't a vetted list, they're a popularity
contest. Most solve the median problem for the median user. Five
filters separate the picks worth installing from the rest:

**Read the files, not the README.** Popular plugins often have
polished marketing and a three-line skill that says "you are an
expert reviewer, look for issues." That doesn't add anything Claude
wasn't already doing. Open `SKILL.md`, the agent definitions, and
the hook scripts. If the prompt is generic, the plugin is generic.

**What's the token cost, and is it always-on?** Skills and
instruction packs load into your context. A 4000-token skill that
fires every session is a tax on every prompt for a feature you might
use weekly. Slash commands and on-demand skills cost nothing until
invoked. Hooks add latency to every event they listen on. Always-on
plugins have to earn their context.

**Does it match your stack?** A Rails-flavored plugin is dead weight
in a Go monorepo. A "PR review" plugin assumes GitHub if you push to
GitLab. Median assumptions, median outcomes.

**Trust surface, real version.** Hooks and MCP servers run on your
machine with your permissions. Settings can pre-approve dangerous
permissions like `Bash(*)`, which is worse than most hooks because
it removes the prompts you'd otherwise see. Slash commands and
skills are inert until invoked. Read the manifest before installing
anything that ships hooks, MCP servers, or settings.

**Picking between two that do the same thing.** Specific beats
general: a Python-only test generator with sharp instructions beats
a "test generator for any language" with vague ones. Composable
beats opinionated: a plugin that adds one slash command plays nice,
a plugin that installs five hooks, three agents, and overrides your
settings is trying to own your workflow. Token-cheap beats
token-fat for the same output.

The filter is "does the file content earn the space," not "does the
repo have stars."

## Prompt

> You are evaluating Claude Code plugins, skills, and marketplaces to
> recommend a small curated set worth installing.
>
> Context about me:
> - I will personally try every plugin you recommend. If you pad the
>   list, you waste my hours.
> - I won't recommend a plugin to anyone else without using it myself.
> - Don't pad. If only 2 plugins clear the bar, return 2. If 15 do,
>   return 15.
>
> Sources to evaluate:
> 1. Anthropic's official marketplace:
>    github.com/anthropics/claude-plugins-official
> 2. The most-starred GitHub repos shipping Claude Code plugins, skills,
>    or subagents. Search GitHub for `claude-code`, `claude-plugin`,
>    `SKILL.md`, `.claude/plugins`, sorted by stars and by recent
>    activity.
> 3. Trending posts in the last 60 days: Hacker News, r/ClaudeAI,
>    r/LocalLLaMA, Twitter/X. Surface anything getting real traction.
> 4. These candidates I've flagged but haven't evaluated:
>    - forrestchang/andrej-karpathy-skills
>    - obra/superpowers
>    - everything-claude-code
>
> Evaluation criteria (apply all; reject anything that fails):
> 1. Read the actual files, not the README. Open SKILL.md, agent
>    definitions, and hook scripts. If the prompt is generic ("you are
>    an expert..."), reject.
> 2. Token cost. Skills load into context. Always-on skills have to
>    justify their token weight against how often someone uses the
>    feature.
> 3. Stack fit. My stack is Python, TypeScript, Kubernetes, and
>    Next.js. Reject anything Rails, PHP, or Java-specific.
> 4. Trust surface. Flag (don't auto-reject) anything shipping hooks,
>    MCP servers, or settings that pre-approve permissions like
>    `Bash(*)`.
> 5. When two plugins do the same job, pick the one with sharper
>    instructions that's more composable. Reject the bloated "do
>    everything" version.
>
> For each plugin you RECOMMEND, return: repo URL, one-sentence
> description, frequency, what's inside (slash commands, skills,
> agents, hooks, MCP servers) and approximate token weight, why it
> beats the alternatives, and trust-surface notes.
>
> For each plugin you DROPPED that's popular or frequently mentioned,
> return one line on why you cut it.
>
> Hard rules: star count and trendiness are inputs not the answer; if
> something is hyped but the actual files are thin, say so; don't pad;
> if a category has no good plugin, recommend nothing for that
> category.

## Reports

- [ChatGPT Deep Research: Claude Code plugins worth installing](/wiki/research/claude-plugins/chatgpt.html) —
  Recommends four installs (andrej-karpathy-skills, superpowers,
  frontend-design, playwright-skill). Surveys cuts including
  everything-claude-code, get-shit-done, anthropics/skills bundle,
  daymade/claude-code-skills. Notes uneven signal across HN/Reddit/X
  and install-path reliability concerns.
- [Gemini Deep Research: Technical Audit and Strategic Curation of the Claude Code Plugin Ecosystem](/wiki/research/claude-plugins/gemini.html) —
  Recommends five extensions (Claude-Mem, official TypeScript LSP,
  KubeShark, frontend-design, Superpowers). Includes a session-token
  equation, four-band degradation table, four trust-surface risk
  categories, subagent-strategy table, and incremental implementation
  roadmap.
- [Claude Deep Research: Five honest picks for a senior Claude Code stack](/wiki/research/claude-plugins/claude.html) —
  Recommends five installs plus a paste-job (Superpowers, Anthropic
  code-review, frontend-design, kenryu42 safety-net, wshobson/agents
  subset, jarrodwatts/claude-hud) plus the Karpathy principles pasted
  into CLAUDE.md. Names ecosystem gaps (K8s, database, persistent
  memory) and provides a sequenced minimal install profile.

---

## Cross-Source Synthesis

The section below compares and contrasts the three Deep Research reports (ChatGPT, Gemini, Claude) against each other. It introduces no outside opinions or external knowledge — every point is drawn directly from the three source documents.

### Shared Findings (present in 2+ sources)

- **obra/superpowers is install-worthy** — All three reports recommend it. They agree it encodes a real workflow (brainstorm → plan → TDD → review → verify), that the actual SKILL.md files contain sharp, specific, non-generic instructions, and that it ships a SessionStart hook plus deprecated command shims. (all 3)
- **Anthropic frontend-design is install-worthy** — All three recommend it for the user's Next.js stack as the cleanest way to push Claude away from generic "AI-slop" UI defaults (Inter fonts, purple gradients, card grids) toward intentional, distinctive aesthetics. They agree it has zero trust surface (pure prompt content, no hooks/MCP/network/shell). (all 3)
- **everything-claude-code should be cut** — All three reject it. ChatGPT cites sheer sprawl (38 agents/156 skills/72 commands plus MCP servers, auto-generated repo-specific skills). Gemini cites extreme instructional bloat and monolithic prompt-dump character. Claude cites 12+ always-on hooks that block plan-mode writes and dev servers, 9 preconfigured MCPs that collapse 200k → 70k context, off-topic marketing/fundraising skills, and no Kubernetes skill. (all 3)
- **Star count is not the answer** — All three explicitly state that high star counts (90k+ for Karpathy, 140k–167k for everything-claude-code, 18k for VoltAgent) do not justify recommendation when the underlying files are thin or bloated. File-level inspection beats trendiness. (all 3)
- **Always-on token cost must be justified** — All three frame plugin selection as a context-economy problem. ChatGPT highlights Superpowers' SessionStart injection as non-trivial cost. Gemini provides a session-token equation and a 50/70/85/95% degradation table. Claude tallies a target of "roughly 2–3k tokens" always-on across the full install profile. (all 3)
- **Generic "you are an expert" persona prompts should be rejected** — All three apply this filter. ChatGPT rejects them as "sludge." Gemini calls them "instructional bloat" and "token taxes" providing zero marginal utility. Claude rejects VoltAgent, 0xfurai, and lst97 explicitly because their agent files open with "You are a senior X developer…" boilerplate. (all 3)
- **Trust surface must be inspected before install** — All three flag hooks, MCP servers, and Bash pre-approvals as risk vectors requiring audit. Gemini codifies four risk categories (shell execution, network exfiltration, context poisoning, credential theft). Claude contrasts cexll/myclaude's `Bash(git:*)` pre-approvals against Safety Net's block-only approach. ChatGPT flags Superpowers' hooks and get-shit-done's `--dangerously-skip-permissions` recommendation. (all 3)
- **get-shit-done / similar permission-pre-approval repos should be cut** — ChatGPT cuts gsd-build/get-shit-done explicitly for recommending `claude --dangerously-skip-permissions` or a Bash allowlist. Claude cuts cexll/myclaude for shipping `Bash(git:*), Bash(codex:*)` pre-approvals. (ChatGPT, Claude)
- **Karpathy principles have substantive content** — Both ChatGPT and Claude treat the four principles as genuinely sharp, targeting real LLM failure modes (silent assumptions, drive-by refactors, overengineering) rather than persona boilerplate. (ChatGPT, Claude)
- **Frontend-design improves generation but does not validate it** — ChatGPT explicitly notes this and recommends pairing with browser testing. Claude implicitly handles validation through the `code-review` plugin and Safety Net rather than UI-specific testing. Both agree frontend-design has no real alternative in the design space. (ChatGPT, Claude — framing aligned)
- **Kubernetes ecosystem has weak coverage** — Gemini singles out KubeShark (LukasNiessen/kubernetes-skill) as the one good K8s pick because it is failure-mode-first rather than YAML-template boilerplate. Claude states the ecosystem has "nothing good" specifically for K8s and recommends wshobson's `kubernetes-operations` skills with the agent file stripped. Both agree generic K8s plugins providing YAML templates duplicate base-model knowledge. (Gemini, Claude)
- **Subagent dispatching is a useful pattern but adds cost** — Gemini provides a subagent-strategy table (Explorer/Reviewer/Researcher) and discusses the "Subagent Context Problem" with iterative retrieval mitigation. Claude recommends Anthropic's `code-review` plugin specifically because it fans out to 5 parallel Sonnet sub-agents, and notes Superpowers' `dispatching-parallel-agents` skill increases API costs. (Gemini, Claude)
- **Claude-Mem / persistent-memory category requires meaningful infrastructure** — Gemini recommends thedotmack/claude-mem and documents its 5 lifecycle hooks, 4 MCP search tools, SQLite/Chroma backend, and worker on port 37777, recommending `<private>` tags for sensitive data. Claude lists the same components (Express HTTP worker on port 37777, SQLite, Chroma vector DB, MCP server, 5 lifecycle hooks) but cuts it as trust+complexity exceeding value unless persistent memory is a hard requirement. The two sources agree on the technical facts but draw opposite conclusions (see Contradictions). (Gemini, Claude)
- **Anthropic LSP plugins have install-path / stub problems** — Gemini notes several versions of the TypeScript LSP plugin have been reported as "stubs" containing only README.md and require verifying `.lsp.json` is present in `~/.claude/plugins/cache/` plus setting `ENABLE_LSP_TOOL=1`. Claude states all 12 Anthropic LSP plugins (`pyright-lsp`, `typescript-lsp`, `gopls-lsp`, etc.) are "currently broken," shipping only README.md, with `lspServers` config never copied to cache (issues #379 and claude-code#15235). Both reference issue #379. (Gemini, Claude)
- **Official Anthropic marketplace has reliability issues** — ChatGPT notes recent bug reports about marketplace loading and discoverability, plus open issues with the `anthropics/skills` repo around marketplace loading and duplicate context. Gemini documents the LSP-plugin stub bug (issue #379). Claude cites issue #379 and claude-code#15235. (all 3)

### Unique Findings (from one source only)

#### ChatGPT only

- **lackeyjb/playwright-skill is install-worthy** — Standalone Playwright automation skill for browser testing, screenshots, form flows, responsive checks. One skill, manifest, `run.js` executor, package setup; expects one-time `npm run setup` to install Playwright and Chromium. Concrete operational guidance: detect running dev servers first, write scripts to `/tmp`, parameterise URLs, execute through a wrapper that fixes module resolution. Pairs with frontend-design ("prove the page actually works" vs. "generate the page").
- **Anthropics/skills bundle should be cut as an install unit** — `frontend-design` and `webapp-testing` are individually good, but installing the whole pack is broader than needed and the repo has open marketplace-loading and duplicate-context issues.
- **daymade/claude-code-skills should be cut** — Marketplace is 48 skills deep; flagship `skill-creator` is 1,139 lines / 64.3 KB. Token bloat and catalogue sprawl.
- **JCodesMore/ai-website-cloner-template should be cut despite real traction** — Picked up 11.9k stars and 132.9k X views, but use case is narrow and browser-tool dependent, hard-depends on browser automation plus pre-existing Next.js scaffold.
- **Karpathy install form: prefer plugin over CLAUDE.md paste** — Plugin form is "cleaner to turn on and off while you evaluate" versus pasting the raw CLAUDE.md.
- **Recent traction was concentrated, not broad** — Only superpowers showed repeated credible momentum across r/ClaudeAI and X. Most skill managers, docs wrappers, and generic marketplaces sat at single-digit votes or near-zero engagement. HN plugin-specific traction was weak in the last 60 days.
- **Karpathy skill's actual file size** — 67 lines, ~2.46 KB, well under 1k tokens of real instruction load.

#### Gemini only

- **Claude-Mem (thedotmack/claude-mem) is install-worthy** — Persistent context layer; three-layer workflow (search returns compact index of observation IDs; agent calls `get_observations` for full data) yielding ~10x token savings vs. naive history injection. ~50–100 tokens per search result, ~500 tokens for full details.
- **Official TypeScript LSP plugin is install-worthy** — "No-real-alternative" for the TypeScript stack; gives the agent deterministic diagnostics via the LSP tool. Negligible token weight (LSP processed as needed). Caveat: verify `.lsp.json` and `ENABLE_LSP_TOOL=1`.
- **KubeShark (LukasNiessen/kubernetes-skill) is install-worthy** — 85-line procedural SKILL.md, ~650 tokens on activation; failure-mode-first sequence (capture context → identify failure modes → load references → propose fixes with risk controls); prevents deprecated-API training-data pollution (e.g., pre-1.22 Ingress).
- **Skill metadata field constraints** — `name`: 64 chars, lowercase/hyphens; `description`: 1,024–1,536 character truncation cap; `disable-model-invocation` Boolean; `user-invocable` Boolean.
- **Progressive disclosure economics** — Initial metadata stays compact (~100 tokens per skill), allowing dozens of installed skills without exhausting reasoning capacity; full SKILL.md body of 1,000–5,000 tokens loads only when triggered.
- **Session-token equation** — `T_session = T_sys_prompt + sum(M_i) + sum(A_j) + C_history + P_files`; base system prompt estimated at ~16,000 tokens for Claude Code.
- **Context degradation thresholds** — 0–50% high precision, 50–70% attention waver (consider `/compact`), 70–85% significant precision loss, 85–95%+ erratic behavior with high hallucination probability.
- **Effective context shrinkage from MCP load** — In a scenario with 30 configured MCP servers and dozens of plugins, effective context can shrink from 200,000 to as little as 70,000 tokens before any code is read.
- **Four trust-surface risk categories** — (1) Shell Execution via Bash tool, (2) Network Exfiltration via MCP servers fetching external resources, (3) Context Poisoning via malicious instructions in SKILL.md, (4) Credential Theft via plugins handling external-service auth.
- **Subagent strategy table** — Explorer (read-only Grep/Glob/Read), Reviewer (Read + Lint), Researcher (network-heavy WebSearch). Use git worktrees and forked conversations for monorepo parallelism.
- **Iterative Retrieval Pattern for subagents** — Orchestrator must explicitly evaluate subagent returns and use up to three follow-up cycles to extract necessary detail before subagent session is closed.
- **Composio/Connect-Apps should be cut** — Vast trust surface; requires pre-approving permissions for hundreds of external apps via a central API key.
- **Remotion Skills should be cut** — Stack mismatch (programmatic video).
- **AgentLint should be cut** — Meta-tool useful for skill developers but not for day-to-day agent use.
- **Laravel-Boost / Django-Expert should be cut** — Stack mismatch.
- **Firecrawl should be cut** — Bloat; redundant with built-in WebSearch or Playwright.
- **Shannon (Security) should be cut** — Conducts active penetration testing/automated scanning; dangerous against production without sandboxing.
- **Commit-Commands should be cut** — Redundant; Claude formats git commits natively.
- **Code-Simplifier should be cut** — Generic; redundant with base model's refactoring ability.
- **Sandboxed VM / dev container as the only reliable hardening** — For highly sensitive work, this is the only reliable way to prevent unauthorized system-level changes.
- **Incremental implementation roadmap** — Start with persistent memory (Claude-Mem) and TypeScript LSP; layer in KubeShark for infrastructure risk; add Superpowers and Frontend-Design as project complexity demands.
- **Karpathy verdict: drop entirely** — "The actual files are thin… formatted as high-level style guidelines rather than the procedural, actionable workflows required for effective agentic steering."

#### Claude only

- **kenryu42/claude-code-safety-net is install-worthy** — PreToolUse hook blocks `git reset --hard`, `git checkout -- <files>`, `rm -rf ~/`, etc. before Claude Code's permission system sees them. Inverts trust surface (adds blocks rather than approvals). Custom rules are additive only — they cannot weaken built-in protections. Recommended as install #1, before anything else.
- **Anthropic `code-review` plugin is install-worthy** — Orchestrates Haiku eligibility check, Haiku CLAUDE.md scan, then 5 parallel Sonnet subagents (CLAUDE.md compliance, shallow bug scan, git-blame historical context, prior-PR-comment recurrence, comment-vs-code consistency), then per-issue Haiku confidence scoring with <80 false-positive filter. Anthropic claims internal substantive-comment rate moved 16% → 54%; LogRocket independently corroborated.
- **wshobson/agents (selective install) is install-worthy** — Modular marketplace of 73+ plugins; install only `python-development`, `javascript-typescript`, `kubernetes-operations`, `comprehensive-review`, optionally `conductor` and `agent-teams`. Skills are concrete code (e.g., async-python-patterns producer/consumer code in `references/`). Per-agent `tools:` allowlists are explicit; reviewer agents are read-only.
- **jarrodwatts/claude-hud is install-worthy** — Statusline plugin renders model+context bar, 5h/7d usage, tool activity, agent status, todo progress. Zero tokens in Claude's context (out-of-band). Lowest possible trust surface (read-only, no tool execution, no telemetry). Note: `statusLine` is not a valid `plugin.json` field — must be configured in `settings.json` after plugin install.
- **Karpathy verdict: paste the principles into CLAUDE.md instead of installing the plugin** — Same content, no marketplace dependency, you keep authorship of your own CLAUDE.md.
- **JuliusBrussee/caveman should be cut** — Compresses output tokens only; agentic coding is dominated by input tokens.
- **VoltAgent/awesome-claude-code-subagents should be cut** — `typescript-pro.md` opens with persona boilerplate; agents wrap themselves in fake JSON "Communication Protocol" payloads.
- **0xfurai, lst97, davepoon, ananddtyagi, CloudAI-X, jeremylongshore should be cut** — Generic-expert-persona pattern; jeremylongshore's "270+ plugins/739 skills" claim is a quantity-over-quality red flag.
- **cexll/myclaude should be cut** — Ships `Bash(git:*), Bash(codex:*)` pre-approvals; `Bash(git:*)` covers `git push --force` and `git clean -fd`.
- **Anthropic `learning-output-style` and `explanatory-output-style` should be cut** — Anthropic's own README warns against installing them due to token cost.
- **EveryInc/compound-engineering-plugin should be cut (overlap)** — Sharp content but heavier than Superpowers (36 skills, 51 agents) with Rails-flavored pieces; pick Superpowers unless you bounce off its self-invocation style.
- **letta-ai/claude-subconscious should be cut** — Vendor lead-gen demo; README explicitly says "not intended for production."
- **ruvnet/claude-flow, eyaltoledano/claude-task-master, claudemarketplaces.com, claudepluginhub.com should be cut** — Marketing-heavy; SEO catalog plays with paid sponsor slots, not adoption signals.
- **CodeRabbit MCP should be cut as a code-review alternative** — Sends your code to a third party.
- **Database tooling category has nothing good** — Vendor MCPs (`prisma`, `neon`, `planetscale`, `cockroachdb`) need credentials; most aren't sha-pinned, so install pulls upstream HEAD.
- **Deployment helpers category has nothing good** — Vendor MCPs (Netlify, Railway, AWS Labs, Vercel) are just API wrappers; nothing language-agnostic and tasteful.
- **Persistent memory category has no "small and tasteful" pick** — Wait for Anthropic to ship something native, or accept claude-mem's trust surface.
- **Piebald-AI/claude-code-lsps as the working LSP alternative** — Recommended workaround for Pyright + TypeScript while Anthropic LSPs are broken.
- **wshobson kubernetes-architect agent caveat** — The agent file is "bullet-heavy mission-statement prose"; the K8s value lives in the skills, not the agent — strip or override the agent prompt.
- **Pair `code-review` with `pr-review-toolkit`'s `silent-failure-hunter` and `type-design-analyzer`** — Those two agents are differentiated enough to justify duplication with `code-reviewer`.
- **claude-mem's `$CMEM` Solana token contaminates growth signal** — Author tied a Solana token to the project.
- **Methodology beats prompts, small focused beats kitchen-sink** — Stated as a structural principle: highest-value picks (Superpowers, code-review) win because they encode workflow with named failure modes, not because they declare expertise.
- **Sequenced minimal install profile** — (1) Safety Net first, (2) Superpowers, (3) Anthropic marketplace's code-review and frontend-design, (4) wshobson cherry-picks, (5) claude-hud. Then paste Karpathy principles. Total always-on context: ~2–3k tokens.

### Contradictions (points where sources disagree)

- **Karpathy skill: install or skip** — ChatGPT recommends installing the plugin/skill form (cheap enough to leave on, ~67 lines / under 1k tokens, "the safest always-on install in the set"). Claude says paste the four principles into `~/.claude/CLAUDE.md` directly — same content, no marketplace dependency. Gemini drops it entirely as "thin… high-level style guidelines rather than procedural, actionable workflows."
- **thedotmack/claude-mem: install or skip** — Gemini recommends it as a top-five install, framing the worker on port 37777, SQLite/Chroma DB, MCP server, and 5 lifecycle hooks as justified by a ~10x token saving. Claude documents the same technical components but cuts it because trust+complexity exceeds value unless persistent memory is a hard requirement, and notes the `$CMEM` Solana token contaminates the growth signal. ChatGPT does not address it.
- **Official TypeScript LSP plugin: install or skip** — Gemini recommends it as "no real alternative" for the TypeScript stack with a caveat to verify `.lsp.json` and `ENABLE_LSP_TOOL=1`. Claude states all 12 Anthropic LSP plugins are currently broken (ship only README.md, `lspServers` config never copied to cache) and recommends Piebald-AI/claude-code-lsps as the working alternative. ChatGPT does not address it.
- **Browser testing: dedicated Playwright skill or not** — ChatGPT recommends lackeyjb/playwright-skill as a top install for "prove the page actually works" validation paired with frontend-design. Gemini and Claude do not include any browser-testing plugin in their recommended sets; Claude addresses code review through Anthropic's `code-review` plugin instead, and Gemini lists Firecrawl as redundant with built-in WebSearch or Playwright but does not recommend a dedicated Playwright skill.
- **Frequency of Superpowers usage** — ChatGPT prescribes weekly, not constant — "Use it for multi-file features, refactors, and debugging sessions… Do not use it for trivial fixes." Claude prescribes daily — "Most sessions touch at least using-superpowers, writing-plans, test-driven-development, or systematic-debugging." Gemini lists it as "High; the framework typically bootstraps at every session start."
- **everything-claude-code star count** — Gemini cites 140,000 stars. Claude cites 167,000 stars (and notes README claim drift across versions). ChatGPT does not state a figure but cuts the same repo.
- **Kubernetes coverage verdict** — Gemini recommends KubeShark (LukasNiessen/kubernetes-skill) as a real install with concrete failure-mode workflow at ~650 tokens. Claude states the K8s ecosystem has "nothing good" and recommends wshobson's kubernetes-operations skills with the agent file stripped, making no mention of KubeShark. ChatGPT does not address K8s plugins at all.
- **Code-review plugin: include or omit** — Claude makes Anthropic's `code-review` plugin its #2 install with detailed prompt-engineering analysis. Neither ChatGPT nor Gemini includes any code-review-specific plugin in their recommendations.
- **Safety / PreToolUse hook plugin** — Claude makes kenryu42/claude-code-safety-net its #4 install and frames it as the install-before-anything-else baseline. Neither ChatGPT nor Gemini surfaces it. (ChatGPT's nearest analogue is cutting get-shit-done for the opposite reason — pre-approving permissions; Gemini recommends sandboxed VM/dev container instead.)
- **Statusline / observability tooling** — Claude includes jarrodwatts/claude-hud as a top install with zero in-context tokens. Neither ChatGPT nor Gemini mentions it.
- **Total recommended count** — ChatGPT lands on four installs, Gemini on five extensions, Claude on five installs plus a paste-job. The composition overlap is small: only Superpowers and frontend-design appear on all three lists.
