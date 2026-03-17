---
title: "Design Docs Optimized for AI Coding Agents"
summary: "Three Deep Research reports on technical design documents structured as inputs to AI coding agents — templates, PRD-to-design handoff, trade-off documentation, phasing, and failure modes."
keywords:
  - deep-research
  - design-docs
  - rfc
  - technical-specs
  - ai-coding-agents
  - implementation-planning
related:
  - wiki/research
  - wiki/research/ai-augmented-prds
  - wiki/design-docs
  - wiki/prds
scope: "Subject index for design doc research. Links to three provider reports."
last_verified: 2026-03-16
---

Three Deep Research reports on technical design documents optimized
for AI coding agent consumption, generated from the same prompt
across three providers. Used as inputs for designing the design doc
agent and template.

## Prompt

> Research the current state of technical design documents (design
> docs, RFCs, technical specs) optimized for AI coding agent
> consumption. Specifically investigate:
>
> 1. Design doc templates and structure — What sections appear in
>    best-in-class design docs at companies like Google, Uber,
>    Stripe, GitLab, and Shopify? How do these differ from PRDs?
>    What's the minimum viable design doc vs. comprehensive RFC?
>
> 2. PRD-to-design-doc handoff — How do teams translate product
>    requirements into technical architecture decisions? What
>    information from the PRD should carry forward vs. what gets
>    left behind? How do AI-native workflows (GitHub Spec Kit,
>    AWS Kiro, Copilot Workspace) handle this transition?
>
> 3. Design docs as inputs to AI coding agents — How should a
>    design doc be structured so that a coding agent (Claude Code,
>    Cursor, Copilot) can use it as a plan? What makes architecture
>    decisions machine-readable? How do file-level change lists,
>    dependency ordering, and phase boundaries affect agent
>    implementation quality?
>
> 4. Trade-off documentation — How do effective design docs capture
>    alternatives considered, decision rationale, and constraints?
>    How should trade-offs be structured so an agent understands
>    what was rejected and why, preventing it from re-discovering
>    or re-proposing eliminated approaches?
>
> 5. Implementation phasing and task decomposition — How do design
>    docs break work into bounded, ordered phases that map to
>    agent-executable tasks? What granularity works? How do
>    McKinsey's two-layer architecture, GitHub Spec Kit's task
>    generation, and AWS Kiro's sequencing handle this?
>
> 6. Design doc failure modes — What goes wrong with design docs?
>    Over-specification vs. under-specification, stale docs,
>    bikeshedding, docs that don't match implementation. How does
>    AI change these failure modes (e.g., agents following outdated
>    design decisions, or agents ignoring design constraints)?
>
> Focus on practitioner experience, published templates, and tool
> documentation over academic theory. Flag where evidence is thin.

## Reports

- [Claude Deep Research](/wiki/research/design-docs-for-agents/claude.html) —
  6 sections covering design doc templates (Google, Uber, GitLab, Stripe),
  PRD-to-design handoff via Spec Kit/Kiro/Copilot Workspace, agent-optimized
  doc structure, trade-off documentation and ADRs, two-layer orchestration
  and task granularity, and AI-amplified failure modes.
- [ChatGPT Deep Research](/wiki/research/design-docs-for-agents/chatgpt.html) —
  Platform-specific analysis of Google, Uber, GitLab, Shopify, and Stripe
  templates, machine-readable doc structure, trade-off capture, two-layer
  orchestration, and a minimal viable agent-ready design doc template.
- [Gemini Deep Research](/wiki/research/design-docs-for-agents/gemini.html) —
  10 sections covering design doc taxonomies, PRD-to-design handoff with
  EARS notation, machine-readable instruction sets, ADRs, McKinsey two-layer
  architecture, task decomposition via Spec Kit/Kiro, and AI-era failure modes.
  36 works cited.

---

## Cross-Source Synthesis

All three reports were generated from the same prompt on 2026-03-16. Below is a structured comparison of their findings, with no outside opinions or external knowledge added.

### Shared Findings (present in 2+ sources)

#### All three sources

- **Google's design doc template centers on Context/Scope, Goals/Non-goals, Design, Alternatives Considered, and Cross-cutting Concerns** -- All three identify this as the most widely cited template, with "Alternatives Considered" called one of the most important sections. Google docs run 10-20 pages for large projects and 1-3 pages for "mini design docs." (Claude, ChatGPT, Gemini)
- **Design docs capture the "how" and trade-offs; PRDs capture the "what" and "why"** -- All three draw the same boundary: PRDs are owned by product managers covering user needs, success metrics, and constraints; design docs are owned by engineers covering architecture, APIs, data models, and alternatives. (Claude, ChatGPT, Gemini)
- **A minimum viable design doc needs roughly five sections** -- Context/problem, Goals/Non-goals, Proposed Design, Alternatives/Trade-offs, and Open Questions or Definition of Done. All three converge on this core structure as the floor for useful design documentation. (Claude, ChatGPT, Gemini)
- **Uber uses tiered templates that vary by criticality and domain** -- All three describe Uber's practice of maintaining lightweight templates for speed alongside heavyweight checklists for high-impact changes, with domain-specific sections for services (SLAs), mobile (third-party libraries), and payments (legal checkpoints). (Claude, ChatGPT, Gemini)
- **GitLab stores design docs as version-controlled artifacts** -- All three note GitLab's approach of treating design documents as living, Git-native files updated via merge requests, with structured metadata and consistent sections (Summary, Motivation, Goals, Non-Goals, Proposal, Alternatives). (Claude, ChatGPT, Gemini)
- **Stripe's documentation culture is leadership-driven but lacks a published internal template** -- All three acknowledge Stripe's strong writing culture (embedded in career ladders and performance reviews), while noting that direct evidence of a specific internal design doc template is thin. (Claude, ChatGPT, Gemini)
- **GitHub Spec Kit implements a four-phase spec-driven workflow** -- Constitution, Specify, Plan, Tasks (with /implement and /analyze steps). Specs are decoupled from code, enabling multi-variant implementations. All three describe the same sequential structure. (Claude, ChatGPT, Gemini)
- **AWS Kiro generates three linked Markdown files: requirements.md, design.md, and tasks.md** -- Requirements use EARS notation acceptance criteria, design includes architecture diagrams and schemas, and tasks are sequenced by dependencies with traceability to requirements. (Claude, ChatGPT, Gemini)
- **Copilot Workspace generates an editable spec-to-plan-to-implementation flow** -- Starting from a GitHub issue, it produces current-state and desired-state specifications, a file-level change plan, and code diffs, with each layer editable so downstream artifacts regenerate. (Claude, ChatGPT, Gemini)
- **The PRD-to-implementation handoff requires a structured intermediate representation** -- All three describe the convergence on explicit intermediate artifacts (specs, plans, task lists) between product requirements and agent execution, rather than asking agents to infer "how" directly from a PRD. (Claude, ChatGPT, Gemini)
- **What carries forward from a PRD: user needs, success criteria, non-functional requirements, scope boundaries** -- And what gets left behind: market analysis, competitive positioning, stakeholder narrative, and go-to-market strategy. (Claude, ChatGPT, Gemini)
- **Agents re-propose rejected approaches when trade-off documentation is missing** -- The "amnesiac agent" or "design regression" problem: agents lack persistent memory of past decisions and will independently rediscover and reintroduce approaches the team already eliminated, unless rejection rationale is explicitly documented. (Claude, ChatGPT, Gemini)
- **Google's "Alternatives Considered" section prevents re-litigation of past decisions** -- All three cite Google's guidance that this is among the most important sections because it answers "why not X?" for future readers and agents. (Claude, ChatGPT, Gemini)
- **Architecture Decision Records (ADRs) capture trade-offs in a structured format** -- All three describe ADRs (Context, Decision, Status, Consequences) as the primary mechanism for documenting what was decided and why, with the Alternatives Considered gap in Nygard's original template addressed by MADR and similar extensions. (Claude, ChatGPT, Gemini)
- **McKinsey/QuantumBlack's two-layer architecture separates deterministic orchestration from bounded agent execution** -- A rule-based workflow engine enforces phase transitions, manages dependencies, and tracks artifact state (Layer 1), while specialized agents execute creative work within bounded phases (Layer 2). Self-orchestrating agents failed on larger codebases, producing skipped steps, circular dependencies, and analysis loops. (Claude, ChatGPT, Gemini)
- **Tasks should be small, testable, and independently verifiable** -- All three converge on the principle that agent tasks work best when scoped to a single coherent change that can be tested in isolation. (Claude, ChatGPT, Gemini)
- **Dependency ordering and explicit sequencing improve agent performance** -- Tasks need declared dependencies, phase boundaries, and prerequisites that tools can parse, rather than leaving agents to infer ordering. (Claude, ChatGPT, Gemini)
- **Staleness is a persistent design doc failure mode that AI amplifies** -- Docs that fall out of sync with implementation are a longstanding problem. AI makes documentation easier to create but harder to keep current because more code is generated faster, accelerating drift. (Claude, ChatGPT, Gemini)
- **Under-specification causes agents to hallucinate or guess** -- When critical information is missing, agents fill gaps with assumptions from training data rather than asking clarifying questions, leading to "vibe coding" based on generic patterns. (Claude, ChatGPT, Gemini)
- **Over-specification causes template bloat and review fatigue** -- Accumulated required sections grow templates to 14+ pages, burying useful information and slowing review throughput. For agents, over-specification can prevent exploration of better implementation approaches. (Claude, ChatGPT, Gemini)
- **Spec-driven development (SDD) is the emerging consensus pattern** -- All three describe the convergence on specifications as first-class, versioned artifacts that drive agent implementation, with the pipeline: requirements, design, dependency-ordered tasks, agent execution. (Claude, ChatGPT, Gemini)

#### Two sources

- **Shopify uses GitHub-native RFCs with deadlines and explicit rejection rationale** -- Shopify's template includes a discussion window, a "Why should we not build this?" section, and a rule that if no one vetoes by the deadline, the RFC author decides. (Claude, ChatGPT)
- **File-level change lists improve agent implementation quality** -- Explicitly listing files to create, modify, or delete as a first-class element of the plan creates a "diff-shaped" map from architectural intent to repository touchpoints. Copilot Workspace and Cursor Plan Mode both implement this pattern. (Claude, ChatGPT)
- **Markdown is the universal format for agent instructions; YAML is for metadata only** -- Every major tool uses plain Markdown for agent-facing documentation. YAML appears exclusively in frontmatter for scoping metadata such as status flags and dependency lists. (Claude, Gemini)
- **Memory files (CLAUDE.md, AGENTS.md, .cursorrules) anchor project context across sessions** -- Without these files, agents are effectively stateless and repeat mistakes. These files establish build commands, testing setup, architectural patterns, and boundary rules. (Claude, Gemini)
- **Addy Osmani's spec guidance covers six core areas** -- Executable commands, testing frameworks, project structure, code style, Git workflow, and clear boundaries of what agents must never touch. (Claude, Gemini)
- **Spec-first workflow: generate a plan, have human annotate, then implement in a fresh session** -- Multiple practitioners describe saving a plan as a Markdown file, iterating on it with human markup, then starting a clean agent session for implementation. Boris Tane's insight: "I want implementation to be boring. The creative work happened in the annotation cycles." (Claude, ChatGPT)
- **Agents that follow stale docs can systematically reproduce wrong assumptions at scale** -- Because agents convert text to code at scale, an outdated design doc leads to wrong assumptions propagated across many files faster than a human would. (ChatGPT, Gemini)
- **Kiro supports bidirectional sync and task regeneration when specs change** -- Developers can update specs from code changes or update code from spec changes, helping keep tasks synchronized with evolving requirements. (Claude, ChatGPT)
- **Artifact state tracking via frontmatter enables workflow automation** -- Storing state (draft, in-review, approved, complete) in document frontmatter allows the orchestration layer to determine what is ready versus blocked. (Claude, ChatGPT)
- **Comprehensive RFCs are justified only when cross-cutting concerns are first-order risks** -- Multi-region failover, capacity, SLOs, security/privacy constraints, and migrations warrant the full template. Keeping operational sections conditional ("include if applicable") prevents bloat. (Claude, ChatGPT)
- **The BMAD Method uses agent personas simulating an agile team** -- Analyst, PM, Architect, Scrum Master, Developer, and QA personas pass structured artifacts between roles, with documentation as the source of truth and code as "merely a downstream derivative." (Claude, Gemini)
- **Two layers of structure serve design docs: human-readable narrative plus structured anchors for agents** -- Narrative provides context, rationale, and edge-case explanation; structured anchors (metadata, file-impact lists, task DAGs, gate conditions) provide machine-parseable directives. (ChatGPT, Gemini)
- **Text-based diagramming formats (Mermaid, PlantUML) make architecture machine-parseable** -- These allow agents to understand component relationships without interpreting binary image files. (Claude, Gemini)
- **Uber's template has separate "Approaches" and "Proposal" sections** -- Options are enumerated separately from the recommended approach, which already structures trade-offs in an agent-friendly way. (Claude, ChatGPT)
- **DORA 2025 report confirms AI is an amplifier, not a corrector** -- AI magnifies the strengths of high-performing organizations and the dysfunctions of struggling ones. Teams with good documentation practices get better tools; teams without them accumulate debt faster. (Claude, Gemini)
- **Steerability checkpoints reduce agent drift** -- Copilot Workspace inserts editable spec and plan artifacts; Cursor Plan Mode produces an editable plan with file paths; Kiro regenerates tasks when specs change. These are workflow interventions turning static docs into living specs. (ChatGPT, Gemini)
- **Sequential/waterfall-style phases may be rehabilitated by AI economics** -- When agents can execute a full requirements-to-implementation cycle in hours rather than months, the economics of upfront specification change fundamentally. McKinsey: "Waterfall got a bad reputation not because sequential phases are inherently wrong, but because the economics didn't work. Agents change the economics." (Claude, Gemini)
- **Spec Kit constitution.md captures non-negotiable project principles** -- A "constitution" file establishes immutable quality, testing, and UX standards that govern all subsequent agent actions throughout the workflow. (Claude, Gemini)
- **Template bloat is a recurring organizational failure** -- Required sections accumulate over time from "special interests," growing templates to 14+ pages before they are even filled in. At Uber scale, this created noise, ambiguity about when an RFC is required, and discoverability problems. (Claude, ChatGPT)
- **Bikeshedding wastes review time on trivial details** -- For humans this means disproportionate discussion of surface-level choices; for agents it can manifest as "loops of death" or redundant refactoring cycles. (Claude, Gemini)

### Unique Findings (from one source only)

#### Claude only
- **Keep instruction files radically short (under 300 lines)** -- HumanLayer research shows frontier LLMs can reliably follow ~150-200 instructions. As instruction count increases, adherence degrades uniformly across all instructions, not just later ones. HumanLayer's production CLAUDE.md is under 60 lines.
- **Use progressive disclosure with an agent_docs/ directory** -- Rather than stuffing everything into a root CLAUDE.md, create separate files (architecture.md, conventions.md, testing.md) and instruct the agent to read relevant ones. Builder.io's CTO switched to Claude Code partly because this pattern handled an 18,000-line React component.
- **Include executable verification commands scoped to individual files** -- File-scoped commands like `npm run tsc --noEmit path/to/file.tsx` prevent agents from unnecessarily running full project-wide builds.
- **Negative-only instructions fail; pair "never" with "prefer instead"** -- Telling agents what not to do without providing an alternative causes them to get stuck. "Never use --foo-bar; prefer --baz instead" works where "Never use --foo-bar" alone does not.
- **LLM-generated AGENTS.md files can lower agent performance** -- A March 2026 study found that auto-generated config files from /init outputs should be treated as starting points, not finished products, since human-written ones outperformed them.
- **The "amnesiac agent" problem has a specific cited practitioner account** -- Mahdi Yusuf (January 2026): an agent consolidated three microservices into one because the separation "added unnecessary complexity," but the separation existed because the services scaled differently under load.
- **MADR 4.0 adds explicit "Considered Options" with per-option pros/cons and YAML frontmatter** -- Filling the gap in Michael Nygard's original 2011 ADR template, which deliberately omitted an Alternatives Considered section.
- **Claude Code users are requesting better ADR support via GitHub issues** -- Issue #15222 proposes DECISIONS.md with [REJECTED] markers; issue #13853 requests automatic ADR loading because CLAUDE.md becomes unwieldy with multiple architectural decisions.
- **ADRs can form an agent-navigable graph by subsystem** -- Yusuf's protocol: add machine-readable metadata (status, subsystem, supersedes, related) to each ADR so an agent touching a subsystem can walk back through its decision history.
- **Boris Tane's probability analysis illustrates why broad tasks fail** -- At 80% accuracy per decision across 20 decisions, there is only a ~1% chance of an all-correct implementation (0.8^20).
- **SWE-bench Pro shows success rates drop from 70% on simple tasks to 23% on enterprise-complexity multi-file edits** -- The closest empirical signal on task granularity's impact on agent performance.
- **Tasks too narrow strip agents of holistic insight** -- Amazon Science notes that task decomposition "can come at the cost of the novelty and creativity that larger models display."
- **SFEIR Institute quantifies atomic subtasks as 5-10 minutes of work** -- A concrete time-based guideline for task scoping.
- **The AGENTS.md cross-platform standard was launched by Google, OpenAI, Factory, Sourcegraph, and Cursor** -- Provides a vendor-neutral layer for agent instruction conventions.
- **Context drift within a session is the most widely reported AI failure mode** -- Agents start strong but as the context window fills, the original plan "falls out of the LLM's brain." Moving state into persistent Markdown files that agents re-read is the core mitigation.
- **Architecture drift at scale: agents optimize for locally plausible tokens, not global consistency** -- Without tight constraints, large steps force the model to invent structure from generic patterns rather than project-specific conventions.
- **Spec misinterpretation is documented by Birgitta Boeckeler (Martin Fowler's team)** -- An agent "ignored the notes that these were descriptions of existing classes, took them as a new specification and generated them all over again, creating duplicates."
- **The staleness acceleration paradox: AI makes docs easier to create but harder to keep current** -- IBM reports a 59% reduction in documentation time, but more code generated faster means faster drift. Boeckeler notes Spec Kit's maintenance strategy is "left vague or totally open."
- **Cognitive complexity increases 39% in agent-assisted repos per one study, with change failure rates up 30%** -- Code quality issues compound when AI generates more code faster.
- **Lambros Petrou's RFC template has 13 sections from Problem and Context through FAQ to Appendix** -- A comprehensive community-produced template widely cited by practitioners.
- **The Rust RFC template inspired most open-source RFC processes** -- Summary, Motivation, Detailed design, Drawbacks, Alternatives, Unresolved questions.
- **Practitioner reception of Spec Kit is mixed** -- Some report 5x productivity gains; others found agents claiming completion when "most of the functionality is missing and there are zero tests." Critics worry it "brings back the worst parts of Waterfall under a shinier name."
- **Lucas F. Costa's design doc critique** -- "Ask yourself how many design docs at your company get updated after implementation starts. If the doc were genuinely useful as a design tool, you'd update it as you learn. Nobody does."
- **Anthropic recommends emphasis markers like "IMPORTANT" and "YOU MUST" to improve instruction adherence** -- Part of their guidance on organizing prompts into distinct sections.
- **No controlled studies exist comparing agent behavior with versus without ADRs** -- The entire practice of ADRs as "agent memory" is emerging (2025-2026) with no longitudinal data.

#### ChatGPT only
- **GitLab's LabKit design doc explicitly warns that lacking a machine-readable spec leads to documentation drift** -- Proposes protocol buffer schemas plus validation as contracts, an unusually direct statement about why formal schemas help both humans and agents.
- **A practical decision record unit should include five elements** -- Decision statement, options considered (including "do nothing"), evaluation criteria tied to goals/non-goals, chosen option with rationale, and rejected options with specific reasons for rejection.
- **Cursor Plan Mode saves plans under .cursor/plans/ as durable documentation** -- Plans as Markdown with file paths and code references become persistent artifacts for future agents, not just ephemeral session state.
- **Shopify's RFC template includes explicit deadline markers in the title** -- Format: `[OPEN until <date>][COMPONENT] TITLE`, with an explicit section on who should know about the change.
- **Comprehensive RFC sections should be conditional, not mandatory** -- Keep canonical headings but make operational sections "include if applicable" and push deep details into linked appendices or contracts (schemas, API specs, test plans) version-controlled with code.
- **A minimal agent-ready design doc should include decision deadline/status** -- To prevent agents from following draft proposals as if they were finalized decisions.
- **Stripe co-maintains an RFC-style specification for agentic commerce with OpenAI** -- Demonstrating a Stripe-adjacent approach to machine-readable spec metadata with explicit Status, Version, and Scope fields.

#### Gemini only
- **EARS (Easy Approach to Requirements Syntax) notation formalizes vague requirements for agents** -- Forces requirements into structured notation (WHEN [event], THE SYSTEM SHALL [behavior]) that acts as a programming interface for the AI agent.
- **Uber uses AI agents and Figma Console MCP to generate component specs directly from design tokens** -- Ensuring documentation remains a living reflection of source material and eliminating transcription errors.
- **Confidence-based approach to file-level change lists** -- File-level change lists improve quality for low-confidence tasks (<66%), where the agent should first research and build knowledge. For high-confidence tasks (>85%), agents can proceed directly to automated implementation.
- **AI agents can automatically generate ADRs by scanning a codebase for architectural shifts** -- Capturing the "why" behind a change while context is still fresh.
- **ADR template for agents includes a "Guardrails" field** -- Explicit instructions for the agent such as "References MUST exist -- check each link," beyond the standard Status/Context/Decision/Consequences fields.
- **Structured task decomposition yields a 24% performance improvement in problem-solving** -- CMU research on LLM-based approaches to software engineering tasks found decomposition creates "navigable pathways" for agents.
- **Kiro's "Grind Mode" autonomously iterates through tasks** -- A long-running agent checks its own work against "correctness properties" and compile-time diagnostics until the CI pipeline passes.
- **Shopify uses "Program Playbooks" with merchant-centric UX focus** -- With sections for Problem Statement, Objectives, Guiding Principles, Risks, and Path to Done, distinct from their engineering RFCs.
- **The "stale doc" problem is particularly acute when memory files conflict with code** -- If CLAUDE.md says Node.js >=18.0.0 but package.json requires 22.0.0, the agent will likely prioritize the explicit markdown instruction, causing environment mismatches.
- **Context-evaluator tools can audit memory files for outdated references** -- Highlighting stale technology references and suggesting structured improvements.
- **Stripe's "Agentic Commerce Suite" requires documentation for non-human traffic** -- Specs must cover llms.txt files for AI agent discoverability, agentic burst handling with edge computing, and rate limiting for autonomous agent interactions.
- **McKinsey's two-layer architecture maps to control theory terminology** -- A "Speed Planner" (long-horizon strategic layer) generates reference trajectories and a "Tracking Controller" (reactive lower layer) executes immediate actions.
- **Lead Agent / Worker Agent dual-agent workflow for parallel execution** -- A lead agent decomposes a project into a phased plan focusing on the critical path, while worker agents execute individual tasks in parallel within independent contexts.
- **GitLab's "handbook-first" approach treats documentation as a single source of truth (SSOT)** -- Updated with every pull request to mitigate the staleness problem.
- **Design docs should explicitly avoid implementation code to remain resilient** -- Some practitioners argue TDDs should avoid file-level change lists and implementation code to ensure the document survives framework or tooling changes.

### Contradictions (points where sources disagree)

- **Whether file-level change lists belong in design docs** -- Claude and ChatGPT both advocate for file-level change lists as a first-class element that improves agent implementation quality, citing Copilot Workspace and Cursor Plan Mode. Gemini presents a more nuanced view: some practitioners argue design docs should explicitly avoid file-level change lists to remain resilient to framework changes, though Gemini concedes they help for low-confidence tasks. The sources disagree on whether file-level specificity is a feature or a liability.
- **Whether Stripe has meaningful design doc structure or only writing culture** -- Claude states Stripe uses "no standard template at all," relying on sample documents as exemplars. ChatGPT finds thin public evidence for internal section structure but cites a Stripe-OpenAI co-authored RFC as a proxy. Gemini presents Stripe as having specific structural patterns (Core requirements, API performance, Security/Compliance, Onboarding patterns) drawn from RFP templates and pattern guides.
- **How Uber's template practice is characterized** -- Claude describes three generations (DUCK, RFC, ERD) with domain-specific templates reflecting organizational scaling. ChatGPT emphasizes a minimal public template (Abstract, Motivation, Approaches, Proposal) combined with heavyweight checklists. Gemini focuses on a different dimension entirely: Uber's use of AI agents and Figma MCP to auto-generate component specs from design tokens, characterizing Uber as moving toward automated specification rather than human-authored templates.
- **Whether the spec-driven development pattern rehabilitates or risks waterfall** -- Claude and Gemini both note that sequential phases may be rehabilitated when agents execute cycles in hours, with Claude calling this "the most surprising insight" and McKinsey explicitly arguing agents change the economics of upfront specification. ChatGPT does not engage with this framing, instead describing the same tools without commenting on their relationship to waterfall methodology. The question of whether SDD is progress or repackaged waterfall remains unresolved across the sources.
- **How to handle the under-specification vs over-specification trade-off for agents** -- Claude argues strongly for keeping instruction files "radically short" (under 300 lines), citing research that adherence degrades uniformly as instruction count increases. Gemini argues for "strict formalism" with EARS notation, Mermaid diagrams, and comprehensive structured anchors. ChatGPT takes a middle position, recommending conditional sections that expand only when material. The sources imply different optimal levels of specification density.
- **Whether AI mitigates or accelerates documentation staleness on net** -- Claude presents the "staleness acceleration paradox" as fundamentally unresolved: AI makes docs easier to create and harder to keep current, with Boeckeler noting Spec Kit's maintenance strategy is "left vague." ChatGPT describes AI-native tools with explicit update paths (Kiro regeneration, Copilot steerability) as turning this from a failure into a managed workflow. Gemini advocates automation (agents generating specs from Figma tokens, context-evaluator tools auditing memory files) as solving the problem. The sources differ on whether staleness under AI is getting worse, getting better, or both simultaneously.
