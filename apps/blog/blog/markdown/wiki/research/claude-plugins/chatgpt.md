---
title: "ChatGPT Deep Research: Claude Code plugins worth installing"
summary: "ChatGPT Deep Research report on Claude Code plugins worth installing. Recommends four installs (forrestchang/andrej-karpathy-skills, obra/superpowers, Anthropic frontend-design, lackeyjb/playwright-skill) after auditing SKILL.md files, plugin manifests, command stubs, hook scripts, and MCP configs across the official marketplace and high-star community repos."
keywords:
  - deep-research
  - chatgpt
  - claude-code
  - plugins
  - skills
  - marketplace
  - evaluation
provider: chatgpt
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
scope: "Full ChatGPT Deep Research report. Recommends four installs (andrej-karpathy-skills, superpowers, frontend-design, playwright-skill) and surveys cuts (everything-claude-code, get-shit-done, anthropics/skills, daymade/claude-code-skills, ai-website-cloner-template). Notes signal strength from Reddit, X, and HN, plus install-path reliability concerns with the official marketplace and Anthropic's separate skills repo."
last_verified: 2026-04-28
---

## Verdict

I would install **four** things and stop there: **forrestchang/andrej-karpathy-skills**, **obra/superpowers**, **Anthropic's frontend-design plugin**, and **lackeyjb/playwright-skill**. Everything else I looked at either failed on token discipline, bundled too much unrelated surface area, or increased the trust surface faster than it increased output quality. For the finalists and the major cuts, I based this on the actual `SKILL.md` files, plugin manifests, command stubs, hook scripts, and MCP configs rather than README copy. citeturn21view0turn21view1turn30view0turn28view0turn28view2turn22view0turn22view2turn32view0turn32view1turn38view0turn38view1turn38view2

The broad pattern was clear. The strongest **first-party** material from entity["organization","Anthropic","ai company"] was narrow and well-written, especially `frontend-design`; the strongest general workflow repo on entity["company","GitHub","software platform"] was still `obra/superpowers`; the best lightweight always-on behaviour layer was the Karpathy-inspired skill; and many of the big "systems" repos were simply too sprawling to justify the context they demand. citeturn32view0turn32view1turn17view1turn21view0turn22view0turn17view0turn33search0

## Signal from marketplaces and social chatter

Recent traction was highly concentrated rather than broad. On the social platforms you named, the only plugin-like project that showed repeated, credible momentum was `superpowers`: it was repeatedly discussed on `r/ClaudeAI` and elsewhere on entity["company","Reddit","social news forum"], and it also drew meaningful attention on entity["company","X","social network"]. By contrast, recent posts about skill managers, docs wrappers, and generic marketplaces mostly sat at single-digit votes or near-zero engagement. citeturn12reddit43turn12reddit42turn13search0turn13search1turn11reddit42turn11reddit45turn11reddit46turn11reddit47

The other item with obvious breakout attention was the website-cloner template: it picked up 11.9k stars quickly and an X post about it drew 132.9k views. I still cut it because the use case is narrow and browser-tool dependent, not because the files were weak. On entity["organization","Hacker News","tech news site"], plugin-specific traction looked weak in the last 60 days; the best I found was an incidental mention of `webapp-testing` inside a project thread, not a strong independent recommendation wave. citeturn14search0turn13search10turn13search9

Marketplace-wise, the official `claude-plugins-official` directory is large and active, but there are also recent bug reports about marketplace loading and discoverability. Anthropic's separate `skills` repo has excellent skill content, but as an install unit it still shows open issues around marketplace loading and duplicate context from overlapping plugin packs. That mattered in the final cuts. citeturn4search6turn3search2turn4search2turn4search3turn7search1turn18search0turn18search3

## Recommended installs

### andrej-karpathy-skills

**Repo URL:** `https://github.com/forrestchang/andrej-karpathy-skills`. citeturn20search3turn16view0

**What it does:** A single lightweight skill built from entity["people","Andrej Karpathy","ai researcher"]'s observations about LLM coding failure modes; it pushes Claude toward explicit assumptions, simpler code, surgical diffs, and verifiable success criteria. citeturn21view0turn20search1

**Frequency:** **Daily / near-always.** This is the one I would try first because it is cheap enough to leave on all the time. citeturn21view0turn21view1

**What's inside and token weight:** One plugin manifest and one real skill, plus a `CLAUDE.md` variant of the same guidance. The skill is only 67 lines and about 2.46 KB, so the context cost is tiny by comparison with workflow frameworks. Expect well under 1k tokens of real instruction load. citeturn21view0turn21view1turn20search2

**Why it beats the alternatives:** It is sharper than the generic "you are an expert engineer" sludge you asked me to reject, and much lighter than the heavyweight workflow systems. The actual content is four concrete operating rules, not vague persona-setting. It also avoids the "do everything" failure mode entirely. citeturn21view0turn16view0turn22view0turn33search0

**Trust surface notes:** Clean. No hooks, no MCP servers, no permission pre-approvals, no setup scripts. That makes it the safest always-on install in the set. citeturn21view1

### superpowers

**Repo URL:** `https://github.com/obra/superpowers`. citeturn17view1

**What it does:** A full development workflow framework by entity["people","Jesse Vincent","software developer"] that forces brainstorming, plan-writing, TDD, review loops, and verification before completion for larger coding tasks. citeturn17view1turn20search0turn25search1turn29search0turn29search2

**Frequency:** **Weekly, not constant.** Use it for multi-file features, refactors, and debugging sessions that would otherwise sprawl. Do **not** use it for trivial fixes. Its own files explicitly insist on design-first and TDD-first discipline even for "simple" work, which is exactly why I would keep it conditional rather than always-on. citeturn20search0turn25search1

**What's inside and token weight:** A plugin plus 11 substantive skills, plus command shims and hooks. The always-on cost is non-trivial because the `SessionStart` hook injects the full `using-superpowers` skill into the session context. After that, larger skills like `brainstorming` weigh in at 164 lines / 10.4 KB and the workflow fans out into plan, worktree, TDD, debugging, review, and verification skills as needed. In practice this is the heaviest recommendation here by a wide margin. citeturn23view0turn30view0turn20search0turn29search1turn29search2turn29search0

**Why it beats the alternatives:** Because the actual instructions are strong, specific, and composable inside a coherent workflow. `brainstorming` hands off only to `writing-plans`; `subagent-driven-development` clearly separates implementation from spec review and code-quality review; `test-driven-development` and `verification-before-completion` are concrete and enforceable, not motivational wallpaper. Compared with `get-shit-done` and `everything-claude-code`, it is still a big system, but it is materially more coherent and less dependent on extra infra or dangerous permission posture. It is also the only heavy framework that showed real repeated community traction rather than just star inflation. citeturn20search0turn23view1turn25search0turn25search1turn29search0turn33search0turn22view0turn12reddit43turn13search0

**Trust surface notes:** This is the one to inspect before installing. It ships hooks, including a `SessionStart` hook that injects context automatically, and a cross-platform wrapper for hook execution on Windows. It also still installs deprecated slash commands like `/brainstorm` and `/write-plan`, and there are recent issues about command confusion and command interception. I would install it, but only with eyes open and only because the underlying skill files are actually good. citeturn28view0turn28view1turn28view2turn28view3turn26search4turn26search5turn27search4

### frontend-design

**Repo URL:** `https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design`. citeturn32view0turn19search0

**What it does:** A first-party frontend design skill that pushes Claude to produce distinctive, production-grade UI rather than generic Tailwind mush. For your Next.js stack, this is the cleanest way I found to improve frontend output quality without dragging in a giant framework. citeturn32view0turn32view1

**Frequency:** **As needed, probably weekly if you ship UI often.** Best for landing pages, dashboards, polished internal tools, and any "make this look deliberate" task. citeturn32view1

**What's inside and token weight:** One small plugin and one skill. The skill is 42 lines and about 4.34 KB, so the token cost is low-to-moderate relative to the value. It is also easier to reason about than marketplace bundles like `example-skills`. citeturn32view0turn7search0

**Why it beats the alternatives:** The file is focused on concrete art direction decisions: typography, palette dominance, motion choices, spatial composition, and anti-patterns to avoid. That is much better than the many community UI skills that amount to "make it beautiful" plus a long pile of screenshots or examples. It also beats the giant kitchen-sink repos because it does one thing and does it sharply. citeturn32view1turn35search0turn36search0

**Trust surface notes:** Clean. No hooks, no MCP, no permission pre-approvals. The only real downside is scope: this improves generation quality, but it does not validate the result. Pair it with a browser-testing tool when the page matters. citeturn32view0turn32view1

### playwright-skill

**Repo URL:** `https://github.com/lackeyjb/playwright-skill`. citeturn37search0turn38view1

**What it does:** A standalone Playwright automation skill for browser testing, screenshots, form flows, and responsive checks. In your stack, this is the most directly useful browser-validation install I found that does not force you into a broader marketplace bundle. citeturn38view0turn37search0

**Frequency:** **Weekly** if you are actively shipping Next.js UI or internal tools; less often otherwise. It is especially good for "prove the page actually works" rather than "generate the page". citeturn38view0

**What's inside and token weight:** One standalone skill, a manifest, a `run.js` executor, and a package setup. The skill itself is moderate-to-heavy because it inlines a lot of operational examples and patterns, and it expects a one-time `npm run setup` to install Playwright and Chromium. Roughly: a few thousand tokens, not tiny, but still much smaller than the heavyweight workflow systems. citeturn38view0turn38view1turn38view2

**Why it beats the alternatives:** I cut Anthropic's `example-skills` bundle even though its `webapp-testing` skill is good, because I do not think it is worth installing a broader pack just to get one testing capability from a repo that still has open marketplace-loading and duplicate-context issues. Among standalone options, `playwright-skill` has concrete file-level guidance: detect running dev servers first, write scripts to `/tmp`, parameterise URLs, and execute through a wrapper that fixes module resolution. That is real operational specificity, not fluff. citeturn32view2turn18search0turn18search3turn38view0turn38view2

**Trust surface notes:** No hooks and no MCP, which I like. But it does execute Node and Playwright locally and performs an initial package/browser install, so it has more machine-side activity than the pure-prompt skills. That is a reasonable trade for what it does. citeturn38view0turn38view2

## Popular cuts

- **affaan-m/everything-claude-code** — Cut for sheer sprawl: the manifest advertises **38 agents, 156 skills, 72 command shims**, and the repo also wires in multiple MCP servers; the surfaced convention skill is auto-generated and repository-specific, which is not the signal of a sharp reusable install. citeturn22view0turn22view1turn22view2turn17view0turn35search0
- **gsd-build/get-shit-done** — Cut because the trust surface is too large for a first trial: it explicitly recommends `claude --dangerously-skip-permissions` or a Bash allowlist, and its plan-phase workflow file alone is 1,294 lines / 52.4 KB. Popular, yes; install-worthy for your stated bar, no. citeturn33search0turn34search2turn34search1
- **anthropics/skills example-skills** — Cut **as an install unit**, not because the skills are bad. `frontend-design` and `webapp-testing` are both good, but the pack is broader than you need, and the repo still has open marketplace-loading and duplicate-context issues. citeturn32view2turn32view3turn18search0turn18search3
- **daymade/claude-code-skills** — Cut for token bloat and catalogue sprawl. The marketplace is 48 skills deep, and its flagship `skill-creator` is 1,139 lines / 64.3 KB. That is too much context weight for something I would ask you to trial manually. citeturn15search1turn36search3turn36search4
- **JCodesMore/ai-website-cloner-template** — Cut despite real traction because it is a niche specialist: excellent if you routinely rebuild or migrate existing websites, overkill otherwise, and it hard-depends on browser automation plus a pre-existing Next.js scaffold. citeturn14search0turn31view0turn13search10
- **forrestchang/andrej-karpathy-skills as raw `CLAUDE.md` only** — I kept the repo, but I would install the plugin/skill form rather than just pasting the `CLAUDE.md`, because the plugin form is cleaner to turn on and off while you evaluate. citeturn21view0turn21view1turn20search1

## Open questions and limitations

The biggest unresolved variable is install-path reliability, not file quality. Marketplace behaviour for official and third-party installs has shown some recent bugs, so a repo can have good files and still be annoying to enable in a specific Claude Code version. I therefore weighted **file sharpness and trust surface** more heavily than nominal marketplace convenience. citeturn4search2turn4search3turn18search0turn26search4

Social-signal evidence from the exact channels you specified was uneven. Recent X signal was strong; `r/ClaudeAI` and `r/LocalLLaMA` had much weaker plugin-marketplace signal outside a few isolated posts; and HN showed little plugin-specific discussion in this window. That made file-level inspection more important than trendiness for the final list. citeturn13search0turn13search10turn11reddit42turn11reddit45turn11reddit46turn11reddit49turn13search9
