---
title: "Gemini Deep Research: Technical Audit and Strategic Curation of the Claude Code Plugin Ecosystem"
summary: "Gemini Deep Research report on the Claude Code plugin ecosystem. Recommends five extensions (Claude-Mem, official TypeScript LSP, KubeShark, frontend-design, Superpowers) with token-economics analysis, context degradation thresholds, and trust-surface hardening guidance."
keywords:
  - deep-research
  - gemini
  - claude-code
  - plugins
  - skills
  - marketplace
  - evaluation
  - token-economics
  - trust-surface
provider: gemini
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
scope: "Full Gemini Deep Research report. Covers the architectural foundation of Claude Code extensibility (skills, agents, MCP), skill discovery and invocation mechanics with metadata field constraints, token economics with a session-token equation and degradation thresholds (50/70/85/95%), five curated extensions with detailed trust-surface notes, ten popular cuts with reasons, context hygiene red-line thresholds, four trust-surface risk categories (shell execution, network exfiltration, context poisoning, credential theft), subagent orchestration patterns, and incremental implementation strategy."
last_verified: 2026-04-28
---

The emergence of Claude Code as a terminal-native agentic framework represents a paradigm shift in software development, transitioning from the graphical user interface (GUI) extensions characteristic of traditional integrated development environments (IDEs) toward a context-aware, instruction-driven methodology. In this new ecosystem, extensibility is defined not by binary plugins but by a tripartite architecture of skills, agents, and Model Context Protocol (MCP) servers.1 For a professional developer operating within a high-performance stack—comprising Python, TypeScript, Kubernetes, and Next.js—the challenge lies not in the scarcity of tools, but in the proliferation of "instructional bloat" and "prompts-as-plugins" that offer high star counts on GitHub but provide thin technical leverage in actual production sessions.3 A rigorous evaluation of this landscape requires a meticulous audit of the underlying SKILL.md files, hook scripts, and agent definitions to identify extensions that provide sharp, composable logic while maintaining strict context hygiene.

## **The Architectural Foundation of Claude Code Extensibility**

The Claude Code plugin system is fundamentally an orchestration layer for "Agent Skills," an open standard designed to package specialized knowledge, workflows, and tools into a format that AI agents can discover and invoke dynamically.5 Unlike a standard VS Code extension that might add a sidebar or a button, a Claude Code plugin modifies the agent’s reasoning loop. The core unit of this extensibility is the SKILL.md file, which typically resides within a .claude/skills/ directory at either the user, project, or local scope.1 These files are structured to provide the model with a detailed playbook, allowing it to orchestrate work using built-in tools like Bash, Edit, and Grep.5
A critical distinction exists between built-in commands and skill-based commands. While built-in commands execute fixed logic directly, skills are prompt-based; they provide the agent with a procedure and let the model decide how to navigate the steps.5 This introduces a significant trade-off in "token cost." Every skill that is "always-on" or registered in the marketplace contributes to the fixed context overhead of every session, even before a user sends a message.5

### **The Mechanics of Skill Discovery and Invocation**

Claude Code utilizes a tiered discovery mechanism for skills. At startup, the agent loads the metadata for all enabled plugins and skills.7 This metadata, defined in the YAML frontmatter of the SKILL.md file, includes the skill's name and a description that acts as the primary trigger for the agent's decision to use it.5 If a user’s query matches the intent described in the frontmatter, the agent invokes the skill, at which point the full markdown content of the SKILL.md file is loaded into the active context window.5

| Metadata Field | Limit / Constraint | Purpose in Discovery |
| :---- | :---- | :---- |
| name | 64 chars, lowercase/hyphens | Deterministic identifier for slash commands (e.g., /refactor).7 |
| description | 1,024 - 1,536 characters | Truncated cap; used by Claude to decide when to apply the skill.5 |
| disable-model-invocation | Boolean | If true, only the user can trigger the skill; prevents autonomous side effects.5 |
| user-invocable | Boolean | If false, the skill is for background knowledge only and cannot be used as a command.5 |

This architecture enables a pattern known as progressive disclosure.7 By keeping the initial metadata compact (approximately 100 tokens per skill), a developer can have dozens of skills installed without exhausting the model's reasoning capacity.7 However, once a skill is triggered, the body of the SKILL.md—which can range from 1,000 to 5,000 tokens—competes with project files and conversation history for the remaining context window.7 This "context pressure" is non-trivial; research indicates that model precision begins to degrade at 70% context saturation, with hallucinations increasing significantly beyond 85%.13

## **Token Economics and the Evaluation of Performance Overhead**

For a developer working in complex environments like Kubernetes or Next.js, context window management is as critical as memory management in low-level programming. The total token consumption of a plugin-enabled session can be modeled by the following equation:

`T_session = T_sys_prompt + sum(M_i for i=1..n) + sum(A_j for j=1..k) + C_history + P_files`

Where `T_session` is the total context usage, `T_sys_prompt` is the base system prompt (often estimated at 16,000 tokens for Claude Code) 14, `M_i` is the metadata for each of `n` installed skills, `A_j` is the full instruction set for each of `k` *active* skills triggered in the current turn, `C_history` is the conversation log, and `P_files` is the project context.7
In a scenario with 30 configured MCP servers and dozens of plugins, the effective context window—the space left for actual reasoning—can shrink from 200,000 tokens to as little as 70,000 tokens before any code is even read.8 This necessitates a "ruthless curation" of plugins. Extensions that provide generic advice (e.g., "be a helpful coding assistant") are essentially "token taxes" that provide zero marginal utility over the base model's training data.3 Conversely, plugins that implement "failure-mode-first" guidance or persistent memory layers justify their overhead by reducing the total number of turns required to solve a problem.10

## **The Curated Five: Recommended Claude Code Extensions**

Following a comprehensive audit of the official marketplace, high-star GitHub repositories, and trending community implementations, the following five extensions are recommended. These selections have been vetted for instructional sharpness, stack compatibility (Python, TS, K8s, Next.js), and token efficiency.

### **1. Claude-Mem: Persistent Context Layer**

The primary bottleneck in agentic workflows is the "session amnesia" inherent in stateless LLM APIs. Every new claude session requires a fresh injection of project context, architectural decisions, and previous work history.10 Claude-Mem addresses this through an automated memory capture and compression system.10

| Attribute | Detail |
| :---- | :---- |
| Repo URL | https://github.com/thedotmack/claude-mem 10 |
| Purpose | Preserves context across sessions by automatically capturing tool usage and generating semantic summaries.10 |
| Invocation Frequency | High; automatically active during session lifecycle events.10 |
| Contents | 5 Lifecycle hooks, 4 MCP search tools, SQLite/Chroma DB backend, worker service.10 |
| Token Weight | ~50-100 tokens per search result; ~500 tokens for full details.10 |

Claude-Mem's technical superiority lies in its three-layer workflow pattern. Instead of dumping full history into the context, it uses a search tool to return a compact index of observation IDs.10 Only when the agent identifies a relevant result does it use the get_observations tool to fetch the full data. This results in an approximate 10x token saving compared to naive history injection.10 For a developer moving between Next.js frontend tasks and Kubernetes infrastructure, this continuity is essential for maintaining architectural alignment.10
**Trust Surface Notes:** Installation via npx claude-mem install registers hooks that monitor all tool usage.10 It runs a local worker on port 37777.10 Users should leverage the `<private>` tags in prompts to exclude sensitive keys or PII from the local SQLite/Chroma database.17

### **2. Official TypeScript LSP Plugin**

While Claude 3.5 Sonnet is highly capable of inferring types, it remains a probabilistic engine. In large TypeScript projects, it frequently hallucinates property names or fails to account for complex generic interfaces.18 The official TypeScript LSP (Language Server Protocol) plugin bridges this gap by giving the agent access to the same deterministic diagnostics as a human developer.1

| Attribute | Detail |
| :---- | :---- |
| Repo URL | github.com/anthropics/claude-plugins-official (plugins/typescript-lsp) 20 |
| Purpose | Integrates the TypeScript language server for go-to-definition, type checking, and real-time diagnostics.1 |
| Invocation Frequency | Continuous; used for every file edit or navigation task in .ts/.tsx.1 |
| Contents | .lsp.json configuration, LSP server initialization logic.19 |
| Token Weight | Negligible; diagnostics are processed via the LSP tool as needed.19 |

This plugin is a "no-real-alternative" for the TypeScript stack. It enables the LSP tool, allowing Claude to "see" type errors immediately after making an edit.1 Note that several versions of this plugin in the marketplace have been reported as "stubs" containing only a README.md. A successful installation requires verifying that the .lsp.json file is present in `~/.claude/plugins/cache/` and that the ENABLE_LSP_TOOL=1 environment variable is set.19
**Trust Surface Notes:** The plugin executes a local language server (usually tsserver) which has read access to the project.1 This is standard behavior for development tools but worth noting for highly sensitive codebases.

### **3. KubeShark: Operational Kubernetes Skill**

Most Kubernetes-related plugins provide YAML templates, which the base model already knows.16 KubeShark (LukasNiessen/kubernetes-skill) differs by providing a failure-mode-first diagnostic workflow designed to catch silent runtime errors that the model might otherwise overlook.16

| Attribute | Detail |
| :---- | :---- |
| Repo URL | https://github.com/LukasNiessen/kubernetes-skill 16 |
| Purpose | Enforces production-ready K8s manifests by identifying failure modes before generation.16 |
| Invocation Frequency | Per-task; whenever working with manifests, Helm, or Kustomize.16 |
| Contents | 85-line procedural SKILL.md, focused references for RBAC and security.16 |
| Token Weight | ~650 tokens on activation.16 |

KubeShark beats bloated alternatives by focusing on "the why" of Kubernetes failures—such as ingress selector mismatches or resource starvation—rather than just "the what" of YAML syntax.16 It forces the agent through a diagnostic sequence: capture context, identify failure modes, load relevant references, and propose fixes with risk controls.16 This prevents "training data pollution" where the model might otherwise use deprecated APIs (e.g., pre-1.22 Ingress).16
**Trust Surface Notes:** The skill may recommend using kubectl commands.16 Users should ensure that the agent does not autonomously execute kubectl delete or similar destructive commands without explicit review, which can be managed via the disable-model-invocation: true flag.5

### **4. Official Frontend-Design Skill**

In Next.js development, Claude often defaults to generic, "AI-slop" aesthetics—Inter fonts, purple gradients, and card grids—due to the statistical center of its training data.12 The frontend-design skill pulls the model away from this center by providing a rigorous design philosophy and system.22

| Attribute | Detail |
| :---- | :---- |
| Repo URL | github.com/anthropics/claude-plugins-official (plugins/frontend-design) 20 |
| Purpose | Guides the model toward distinctive, production-grade UI aesthetics rather than generic defaults.12 |
| Invocation Frequency | Moderate; used during feature scaffolding and UI refactors.12 |
| Contents | Design system rules, typography hierarchies, animation principles.22 |
| Token Weight | ~1,500-2,500 tokens when active.7 |

This skill is highly recommended because it addresses the "distributional convergence" problem.22 It doesn't just ask for a "modern UI"; it defines the bold aesthetic choices, color systems, and animations that make a Next.js application feel intentional.12 It is widely cited as the single most impactful "aesthetic" plugin in the ecosystem.12
**Trust Surface Notes:** The skill is strictly instructional and carries no network or filesystem risks beyond the code it instructs the model to generate.27

### **5. Superpowers (ModularizedSDLC)**

For complex feature development in Python or TypeScript, the "impatience" of AI agents is a significant liability. They often skip planning or testing in favor of immediate code generation.23 The obra/superpowers framework enforces a disciplined software development life cycle (SDLC) that mirrors a senior engineer's workflow.17

| Attribute | Detail |
| :---- | :---- |
| Repo URL | https://github.com/obra/superpowers 29 |
| Purpose | A complete agentic skills framework that enforces a clarify-spec-plan-execute-review sequence.17 |
| Invocation Frequency | High; the framework typically bootstraps at every session start.29 |
| Contents | Composable skills (TDD, Planning, Review), agents, session-start hooks.17 |
| Token Weight | Variable; ~5,000-8,000 tokens for the full workflow.29 |

Superpowers beats alternatives like everything-claude-code or karpathy-skills because it uses "anti-rationalization" tables—explicit instructions that debunk the common excuses an AI uses to skip tests (e.g., "it's too simple to test").11 Its test-driven-development skill is the sharpest in the ecosystem, mandating a red-green-refactor cycle that prevents implementation drift.23
**Trust Surface Notes:** The plugin includes a session-start-hook that automatically activates the system.29 Users should be aware that it significantly increases the "base context" of every conversation.29 It also supports "subagent dispatching," which can lead to multiple parallel Claude sessions and increased API costs if not monitored.33

## **Technical Post-Mortem: Dropped and Rejected Plugins**

The curation process involved rejecting several popular or "highly-starred" repositories that failed the criteria of technical leverage, stack fit, or token efficiency.

* **Everything-Claude-Code**: Rejected for extreme instructional bloat. With 140,000 stars, it is highly popular but functions as a monolithic "do everything" prompt dump that creates massive context pressure without providing unique tool access.15
* **Andrej Karpathy Skills**: Dropped because the actual files are thin. While the principles are sound, they are formatted as high-level "style guidelines" rather than the procedural, actionable workflows required for effective agentic steering.36
* **Composio / Connect-Apps**: Rejected due to a vast trust surface. It requires pre-approving permissions for hundreds of external apps via a central API key, which introduces unacceptable security risks for a local terminal agent.12
* **Remotion Skills**: Rejected as a stack mismatch. It is highly specialized for programmatic video and provides no utility for general-purpose web or backend engineering.25
* **AgentLint**: Dropped as a "meta-tool." While useful for skill *developers*, it does not provide day-to-day productivity gains for a developer *using* the agent.24
* **Laravel-Boost / Django-Expert**: Stack mismatch. These are excellent for their respective ecosystems but irrelevant to the user's TypeScript/Next.js/Python stack.18
* **Firecrawl (Original)**: Rejected for bloat. The official implementation is heavy; community-curated "lean" versions are better but redundant with Claude's built-in WebSearch or Playwright capabilities.18
* **Shannon (Security)**: Rejected due to risk. It conducts active penetration testing and automated scanning that can be dangerous if run against production environments without strict sandboxing.12
* **Commit-Commands**: Dropped as redundant. Formatting git commits is a task Claude handles natively; a dedicated plugin for this adds unnecessary context overhead.1
* **Code-Simplifier**: Rejected for genericness. Most of its instructions are redundant with the base model's inherent ability to refactor code.18

## **Context Hygiene and the "Red-Line" Threshold**

The primary risk in adopting a "plugin-heavy" workflow is the degradation of the model’s reasoning as the context window fills. Research on Claude 3.5 and 4.x models demonstrates that as the prompt length increases, the model's "attention" is diluted.13

| Context Usage (%) | Observed Behavior / Degradation |
| :---- | :---- |
| 0% - 50% | High precision; adheres to complex cross-file constraints.13 |
| 50% - 70% | Attention begins to waver; may require a /compact call to maintain performance.13 |
| 70% - 85% | Significant precision loss; may "forget" secondary rules from CLAUDE.md.13 |
| 85% - 95%+ | Erratic behavior; high probability of hallucinations or tool failure.13 |

To mitigate this, a professional setup should favor modular, on-demand skills over global, "always-on" hooks.8 For example, the Superpowers framework, while powerful, should be invoked only for complex feature development rather than simple bug fixes or file management tasks.23 Developers should also monitor the cumulative token weight of enabled MCP servers, which provide "always-available" tools that can inadvertently consume 20% of the available context before the first message is sent.8

## **Trust Surface and Security Hardening**

The installation of third-party Claude Code plugins introduces a new vector for supply-chain attacks. Unlike traditional software, "malicious instructions" in a SKILL.md can be subtle and difficult to detect through static analysis.4
There are four primary categories of risk associated with the recommended plugins:

1. **Shell Execution**: Any skill or hook that utilizes the Bash tool can theoretically execute arbitrary commands.4
2. **Network Exfiltration**: MCP servers that connect to external documentation or APIs can potentially exfiltrate project code or secrets if they are not audited.4
3. **Context Poisoning**: A malicious skill can inject instructions that tell the agent to "silently ignore" security vulnerabilities or "always include a backdoor" in generated code.4
4. **Credential Theft**: Plugins that handle authentication for external services (like the rejected Composio) represent a high-value target for credential exfiltration.4

Hardening a Claude Code environment requires a "Zero-Trust" approach to instructional logic. Users should manually audit the SKILL.md files for any instructions that fetch external URLs or pre-approve Bash(\*) permissions without a confirmation prompt.4 For highly sensitive work, running Claude Code within a sandboxed virtual machine or a dedicated development container is the only reliable way to prevent unauthorized system-level changes.4

## **Subagent Orchestration and Horizontal Scaling**

For a Next.js and Kubernetes stack, the most advanced pattern of Claude Code usage is the dispatching of subagents.15 This allows the main session to remain context-lean while specialists handle deep-dive tasks.8
The "Subagent Context Problem" occurs when a subagent is given a task but lacks the orchestrator’s broader project understanding, leading to shallow or misaligned summaries.35 The recommended mitigation is the "Iterative Retrieval Pattern": the orchestrator must explicitly evaluate subagent returns and use up to three follow-up cycles to "extract" the necessary detail before the subagent session is closed.25

| Subagent Strategy | Tool Restriction | Primary Benefit |
| :---- | :---- | :---- |
| **Explorer** | Read-Only (Grep, Glob, Read) | Prevents accidental edits during information gathering.15 |
| **Reviewer** | Critical Analysis (Read, Lint) | High-fidelity feedback without implementation bias.15 |
| **Researcher** | Network-Heavy (WebSearch) | Isolates API latency and token-heavy documentation fetches.8 |

This horizontal scaling is particularly effective in monorepos where a single task might span multiple services. By forking a conversation or using git worktrees, a developer can have one subagent fixing a Python backend bug while another updates the TypeScript frontend types, effectively doubling the agent's throughput without saturating the main session's context.2

## **Implementation Strategy and Conclusion**

The transition to a highly optimized Claude Code setup should be incremental. The recommended roadmap for a professional developer is to start with the persistent memory layer (Claude-Mem) and the deterministic diagnostics of the TypeScript LSP.10 Once the baseline productivity is established, the specialized KubeShark skill should be integrated to manage infrastructure risk.16 Finally, the disciplined SDLC workflows of Superpowers and the aesthetic guidance of Frontend-Design can be layered on as the complexity of the project requires.22
This curated set provides a balance between technical leverage and context economy. By rejecting the "all-in-one" prompt collections in favor of modular, procedurally-sharp skills, a developer ensures that Claude Code remains a surgical instrument rather than a bloated, hallucination-prone assistant. Curation is the only effective defense against the instructional decay that currently characterizes the rapidly expanding plugin marketplace.

#### **Works cited**

1. Discover and install prebuilt plugins through marketplaces - Claude Code Docs, accessed April 28, 2026, https://code.claude.com/docs/en/discover-plugins
2. Anthropic's Claude Code hits 84.6K GitHub stars: why developers are skipping the IDE, accessed April 28, 2026, https://www.augmentcode.com/learn/claude-code-86k-github-stars-terminal-ai-agent
3. Show HN: A registry for curated, high quality Claude skills and skillsets - Hacker News, accessed April 28, 2026, https://news.ycombinator.com/item?id=46721900
4. What is the most recommended website for browsing a catalog of downloadable Claude Code Agent Skills? - Reddit, accessed April 28, 2026, https://www.reddit.com/r/ClaudeAI/comments/1qcj27k/what_is_the_most_recommended_website_for_browsing/
5. Extend Claude with skills - Claude Code Docs, accessed April 28, 2026, https://code.claude.com/docs/en/skills
6. claude-code/plugins/plugin-dev/skills/skill-development/SKILL.md at main - GitHub, accessed April 28, 2026, https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md?plain=1
7. CLAUDE.md - gocallum/nextjs16-agent-skills - GitHub, accessed April 28, 2026, https://github.com/gocallum/nextjs16-agent-skills/blob/main/CLAUDE.md
8. everything-claude-code/the-shortform-guide.md at main - GitHub, accessed April 28, 2026, https://github.com/ysyecust/everything-claude-code/blob/main/the-shortform-guide.md
9. claude-mem/README.md at main · thedotmack/claude-mem · GitHub, accessed April 28, 2026, https://github.com/thedotmack/claude-mem/blob/main/README.md
10. GitHub - thedotmack/claude-mem: A Claude Code plugin that automatically captures everything Claude does during your coding sessions, compresses it with AI (using Claude's agent-sdk), and injects relevant context back into future sessions., accessed April 28, 2026, https://github.com/thedotmack/claude-mem
11. addyosmani/agent-skills: Production-grade engineering ... - GitHub, accessed April 28, 2026, https://github.com/addyosmani/agent-skills
12. The Claude Code skills actually worth installing right now (March 2026) - Reddit, accessed April 28, 2026, https://www.reddit.com/r/claude/comments/1s51b5u/the_claude_code_skills_actually_worth_installing/
13. FlorianBruniaux/claude-code-ultimate-guide - GitHub, accessed April 28, 2026, https://github.com/FlorianBruniaux/claude-code-ultimate-guide
14. Claude Code-like terminal-based tools for locally hosted LLMs? : r/LocalLLaMA - Reddit, accessed April 28, 2026, https://www.reddit.com/r/LocalLLaMA/comments/1qxluiw/claude_codelike_terminalbased_tools_for_locally/
15. claude-code-ultimate-guide/docs/resource-evaluations/015-everything-claude-code-github-repo.md at main, accessed April 28, 2026, https://github.com/FlorianBruniaux/claude-code-ultimate-guide/blob/main/docs/resource-evaluations/015-everything-claude-code-github-repo.md
16. Kubernetes Skill for Claude Code and Codex: KubeShark - GitHub, accessed April 28, 2026, https://github.com/LukasNiessen/kubernetes-skill
17. Everyone's Hyped on Skills - But Claude Code Plugins take it further (6 Examples That Prove It) : r/ClaudeAI - Reddit, accessed April 28, 2026, https://www.reddit.com/r/ClaudeAI/comments/1qrlsly/everyones_hyped_on_skills_but_claude_code_plugins/
18. There are 28 official Claude Code plugins most people don't know about. Here's what each one does and which are worth installing. : r/ClaudeAI - Reddit, accessed April 28, 2026, https://www.reddit.com/r/ClaudeAI/comments/1r4tk3u/there_are_28_official_claude_code_plugins_most/
19. All LSP plugins missing .lsp.json — installed plugins have no LSP configuration · Issue #379 · anthropics/claude-plugins-official - GitHub, accessed April 28, 2026, https://github.com/anthropics/claude-plugins-official/issues/379
20. Official, Anthropic-managed directory of high quality Claude Code Plugins. - GitHub, accessed April 28, 2026, https://github.com/anthropics/claude-plugins-official
21. foxj77/claude-code-skills - GitHub, accessed April 28, 2026, https://github.com/foxj77/claude-code-skills
22. 10 Must-Have Skills for Claude (and Any Coding Agent) in 2026 - Medium, accessed April 28, 2026, https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051
23. The 10 Claude Code Skills I Actually Use at Work - Welcome, Developer, accessed April 28, 2026, https://www.welcomedeveloper.com/posts/the-10-claude-code-skills/
24. Awesome Claude Code Plugins - GitHub, accessed April 28, 2026, https://github.com/ComposioHQ/awesome-claude-plugins
25. Top 10 Claude Code Skills Every Builder Should Know in 2026 | Composio, accessed April 28, 2026, https://composio.dev/content/top-claude-skills
26. skill-creator: run_eval.py trigger detection fails for all user-defined skills via claude -p #1249, accessed April 28, 2026, https://github.com/anthropics/claude-plugins-official/issues/1249
27. accessed December 31, 1969, https://raw.githubusercontent.com/anthropics/claude-plugins-official/main/plugins/frontend-design/skills/frontend-design/SKILL.md
28. Say "you are capable" instead of "Claude is capable" to make the skill more portable · Issue #391 · anthropics/claude-plugins-official - GitHub, accessed April 28, 2026, https://github.com/anthropics/claude-plugins-official/issues/391
29. I Gave Claude Code a Brain. It's Called Superpowers — and It Has 150000 GitHub Stars for a Reason | by Anil Mathew - Medium, accessed April 28, 2026, https://medium.com/@anilmathewm/i-gave-claude-code-a-brain-its-called-superpowers-and-it-has-150-000-github-stars-for-a-reason-16c4074a9209
30. SKILL.md - obra/superpowers - GitHub, accessed April 28, 2026, https://github.com/obra/superpowers/blob/main/skills/using-superpowers//SKILL.md?plain=1
31. superpowers/skills/writing-skills/SKILL.md at main - GitHub, accessed April 28, 2026, https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md
32. SKILL.md - Test-Driven Development (TDD) - GitHub, accessed April 28, 2026, https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md
33. superpowers/skills/dispatching-parallel-agents/SKILL.md at main - GitHub, accessed April 28, 2026, https://github.com/obra/superpowers/blob/main/skills/dispatching-parallel-agents/SKILL.md
34. WorldFlowAI/everything-claude-code: Claude Code toolkit - agents, commands, skills, rules, and hooks for productive AI-assisted development - GitHub, accessed April 28, 2026, https://github.com/worldflowai/everything-claude-code
35. affaan-m/everything-claude-code: The agent harness ... - GitHub, accessed April 28, 2026, https://github.com/affaan-m/everything-claude-code
36. forrestchang/andrej-karpathy-skills: A single CLAUDE.md ... - GitHub, accessed April 28, 2026, https://github.com/forrestchang/andrej-karpathy-skills
37. andrej-karpathy-skills/skills/karpathy-guidelines/SKILL.md at main, accessed April 28, 2026, https://github.com/forrestchang/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md
38. Agent Skills | Remotion | Make videos programmatically, accessed April 28, 2026, https://www.remotion.dev/docs/ai/skills
39. julianobarbosa/claude-code-skills - GitHub, accessed April 28, 2026, https://github.com/julianobarbosa/claude-code-skills
40. What are your favourite plugins/skills for Claude Code right now as of April 2026? - Reddit, accessed April 28, 2026, https://www.reddit.com/r/ClaudeCode/comments/1shlte1/what_are_your_favourite_pluginsskills_for_claude/
41. What are your top 5 Claude Code skills or plugins for dev workflow management? - Reddit, accessed April 28, 2026, https://www.reddit.com/r/AI_Agents/comments/1skm75n/what_are_your_top_5_claude_code_skills_or_plugins/
42. GitHub - K-Dense-AI/scientific-agent-skills: A set of ready to use Agent Skills for research, science, engineering, analysis, finance and writing., accessed April 28, 2026, https://github.com/K-Dense-AI/scientific-agent-skills
43. I use vanilla Claude Code, and I've never looked that much into skills, so I'm c... | Hacker News, accessed April 28, 2026, https://news.ycombinator.com/item?id=47550826
