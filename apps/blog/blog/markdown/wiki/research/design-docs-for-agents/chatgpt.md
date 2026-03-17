---
title: "ChatGPT Deep Research: Design Docs for AI Coding Agents"
summary: "Platform-specific analysis of Google, Uber, GitLab, Shopify, and Stripe design doc templates, PRD-to-design handoff via Spec Kit/Kiro/Copilot Workspace, machine-readable doc structure, trade-off capture with ADRs, two-layer orchestration, and AI-amplified failure modes."
keywords:
  - deep-research
  - chatgpt
  - design-docs
  - rfc
  - spec-driven-development
  - ai-coding-agents
  - architecture-decision-records
related:
  - wiki/research/design-docs-for-agents
  - wiki/research/ai-augmented-prds/chatgpt
  - wiki/design-docs
scope: "Full ChatGPT Deep Research report on design docs optimized for AI coding agents."
last_verified: 2026-03-16
---

# AI-Optimised Technical Design Documents for Coding Agents

## Why technical design docs are changing

Across many engineering organisations, the Zeitgeist has shifted from "docs as supporting artefacts" to "docs as executable, agent-steerable specifications". citeturn7view0turn7view1 This shift is largely a response to agentic coding workflows: models can execute multi-file changes, and the limiting factor becomes the quality, stability, and *structure* of the plan they are given. citeturn17view0turn17view1

In practitioner field notes, a recurring bottleneck is not raw code generation, but *handoffs*—requirements → design → implementation—where rationale and constraints get lost ("context goes to die"). citeturn6view4 This is precisely where AI agents tend to underperform: they are strong inside a bounded subproblem, but unreliable at reconstructing missing intent, implicit decisions, or undocumented constraints. citeturn6view4turn7view1

A second driver is traceability and governance. When design decisions live primarily in chat transcripts, teams often lack a durable audit trail for "why we built it this way". citeturn6view4turn7view1 Spec-driven toolchains (for example, workflows that explicitly separate requirements, technical design, and task sequencing) are an attempt to make the artefacts themselves durable, reviewable, and "replayable" by humans *and* agents. citeturn6view3turn7view1

## Template sections and structural patterns in mature organisations

Publicly available, high-signal templates and examples from Google, Uber, GitLab, Shopify, and Stripe show a family resemblance: they converge on a small set of repeatable "decision forcing functions" (context, goals, proposal, alternatives), then diverge in how much they standardise cross-cutting concerns (security, privacy, performance, rollout, etc.). citeturn8view0turn18view1turn13view0turn19view0

### Google-style design docs: trade-offs first, requirements second

A widely-circulated description of "Google-style" design docs emphasises that *context and scope* is explicitly **not** a requirements document, and that the enduring value is in documenting trade-offs and alternatives, not an implementation manual. citeturn8view0 The most common "spine" is:

- Context and scope
- Goals and non-goals
- The actual design (often beginning with an overview, then deepening into specific topics like API shape and data storage *only as needed*)
- Alternatives considered
- Cross-cutting concerns (security, privacy, observability, etc.) citeturn8view0

This same source notes a "mini design doc" can be 1–3 pages for incremental work, while larger projects often land in a ~10–20 page zone; beyond that, splitting the problem is recommended. citeturn8view0

### Uber: minimal RFC templates plus "heavyweight" checklists for scale

One public Uber template (in an open-source repo) is extremely lightweight: metadata plus **Abstract**, **Motivation**, **Approaches**, and **Proposal**. citeturn6view0 That minimal template is useful for speed and review throughput.

However, practitioner retrospectives of Uber's historical RFC practice (and how templates evolve at scale) show *much more expansive* section sets for service changes and mobile work—explicit checklists for SLAs, dependencies, load/performance testing, multi-datacentre concerns, security, rollout, monitoring, support considerations, accessibility, and more. citeturn18view1turn15search12

This is an important pattern when designing for AI agents: some orgs maintain **tiered templates** (lightweight for small/local changes; heavyweight for high-impact, cross-team, safety-critical work). citeturn15search12turn18view1

### GitLab: version-controlled design docs with explicit alternatives and adoption paths

GitLab publishes "Architecture Design Documents" as version-controlled artefacts that are intended to be updated over time as understanding evolves. citeturn6view1 That "living doc" stance is directly relevant for agent consumption, because agents will otherwise follow stale decisions.

Two recent, public examples illustrate the section structure GitLab uses in practice:

- **Work Item REST API**: *Summary*, *Motivation* (Goals/Non-goals), *Proposal*, *Concerns and open questions*, *Rollout plan*. citeturn12view0
- **LabKit Configuration Management**: *Summary*, *Motivation* (Goals/Non-goals), *Proposal*, *Design and implementation details*, *Alternative Solutions*, *Adoption Path*, *Future Work*, *Related Work*. citeturn13view0turn13view3

Notably, the LabKit document explicitly calls out "documentation drift" risks when there is "no machine-readable specification" acting as a contract—an unusually direct statement about why formal schemas matter (and why they help both humans and agents). citeturn13view0

### Shopify: GitHub-native RFCs with deadlines and explicit "do not build" rationale

Shopify describes using Engineering RFCs (in large programmes) as an async-friendly mechanism to align quickly on smaller technical design areas, with a template and "rules of engagement" in GitHub; if no one explicitly vetoes by the deadline, the RFC author decides how to proceed. citeturn18view2

The linked template is concise and operational:

- Title line includes a discussion window / deadline marker: `[OPEN until <date>][COMPONENT] TITLE`
- **Summary / Deadline**
- **Background**
- **Proposed change**
- **Why should we build this?**
- **Why should we not build this?**
- **Who should know about this change?** citeturn19view0

For AI agent consumption, this template is interesting because it bakes in two agent-relevant constructs: (1) explicit deadlines (useful for deciding when a proposal is "final"), and (2) an explicit section on why *not* to build it (a compact trade-off and rejection rationale). citeturn19view0turn18view2

### Stripe: strong public evidence for writing culture; thinner evidence for internal design doc sectioning

What is strongly evidenced publicly about Stripe is not a specific internal RFC template, but a company-wide, leadership-driven writing culture: leaders model structured narrative communication; writing is treated as a default for conveying ideas; and internal sample docs are developed to help teams learn structure and style. citeturn18view3

For section structure specifically, public evidence is thinner. One relevant proxy is Stripe's co-maintenance (with OpenAI) of an RFC-style specification for agentic commerce/checkouts. That RFC example is highly structured: explicit **Status**, **Version**, **Scope**, followed by *Scope & Goals* and other numbered sections. citeturn17view3turn3search23 While this is an external interoperability spec (not an internal backend design doc), it demonstrates a Stripe-adjacent approach to "machine-readable" spec metadata. citeturn17view3turn3search23

### How these differ from PRDs, and what "minimum viable" looks like

Across practitioner guidance, PRDs and design docs are commonly run side-by-side: PRDs articulate *what* should be built and *why*, while engineering design docs/RFCs decide *how* it will be built (including constraints, trade-offs, and rollout). citeturn18view1turn16search32turn16search22

A PRD is commonly defined as aligning stakeholders on purpose, behaviours, and scope; it may include acceptance criteria and constraints, but is not meant to dictate the technical implementation. citeturn16search32turn16search22 Meanwhile, Google-style design docs explicitly warn that the "context and scope" section is not a requirements doc and should stay succinct. citeturn8view0

A practical "minimum viable design doc" (MVD) emerges from the light templates above (Uber's minimal RFC, Shopify's RFC gist, and the core of the Google-style structure): **Summary**, **Context**, **Goals/Non-goals**, **Proposal**, and **Alternatives/trade-offs**—with rollout/testing/security added only when material. citeturn6view0turn19view0turn8view0

A "comprehensive RFC" is what tends to happen when cross-cutting concerns become mandatory and accumulated: multi-region/failover, compute/resource requirements, availability strategies, storage/API design, runbooks/operations, i18n, etc. In one retrospective of large-company RFC practice, a "beast" template had grown to ~14 pages before being filled in due to accumulated required sections from "special interests". citeturn18view0 That growth dynamic (helpful for safety, harmful for throughput) is a key design tension for AI-optimised templates. citeturn18view0turn18view1

## Translating PRDs into architecture decisions and agent-ready specs

The core handoff problem is that product intent often arrives with ambiguous "edges" (implicit assumptions, unstated constraints), and the technical plan is forced to reconstruct those edges during implementation. citeturn6view4turn7view1 AI-native workflows try to fix this by splitting a "PRD → design doc" translation into explicit intermediate artefacts with checkpoints.

### What should carry forward, and what should be dropped

A good PRD typically carries: target user behaviours, success criteria / acceptance criteria, scope boundaries, and any non-negotiable constraints. citeturn16search32turn16search22 In spec-driven workflows, these become the "requirements" artefact.

What tends to be left behind (or linked rather than copied) is material that is high-value for *go/no-go* or prioritisation decisions but low-value for implementation planning: market sizing, competitive positioning, long-form discovery notes, and stakeholder narrative that does not constrain behaviour. This is implied by how PRDs are described as aligning purpose/features/behaviour rather than "how to build", while design docs focus on the technical solution and its trade-offs. citeturn16search32turn8view0

### How AI-native toolchains formalise the handoff

**Spec Kit** formalises the transition in four phases with explicit checkpoints:

- *Specify*: describe what you're building and why (user journeys, success), intentionally not tech stack
- *Plan*: provide stack, architecture, constraints (including compliance/perf targets and integration constraints)
- *Tasks*: break spec + plan into small, reviewable, testable units
- *Implement*: the agent executes tasks in sequence, with the human verifying at each checkpoint citeturn7view1

This structure makes the PRD-to-design-doc translation explicit: "PRD-like" content is front-loaded into Specify, while "design doc-like" content is captured in Plan, and the remainder becomes executable tasks. citeturn7view1turn6view2

**Kiro** uses a similar three-file core structure for each "spec":
`requirements.md` (user stories and acceptance criteria / bug analysis), `design.md` (architecture, sequence diagrams, implementation considerations, error handling, testing strategy), and `tasks.md` (discrete implementation tasks). citeturn6view3turn20search4 This explicitly encodes: requirements → design decisions → an ordered task plan. citeturn6view3turn20search8

**Copilot Workspace** (before the technical preview ended on 30 May 2025) implemented a PRD-to-plan bridge by generating a "spec" as two bullet lists (current state vs desired state), then generating a plan that enumerates every file to create/modify/delete and what to do in each file—both steps editable by the user before code is generated. citeturn7view3

In all three, the design principle is the same: do not ask the agent to infer "how" from a PRD-like statement; instead create a structured intermediate plan artefact that explicitly records constraints, file-level impact, and sequencing. citeturn7view1turn7view3turn6view3

## Structuring design docs so coding agents can implement them reliably

Agent-facing documents are effective when they reduce ambiguity, compress context into durable artefacts, and give the agent a deterministic notion of (a) *what to change*, (b) *in what order*, and (c) *how to know it is done*.

### Concrete file-level change lists

One strongly evidenced pattern is to include a file-level plan as a first-class element—because agents do better when the "where" is explicit.

- Copilot Workspace's plan explicitly lists every file to create/modify/delete and actions per file. citeturn7view3
- Cursor Plan Mode generates plans as Markdown with file paths and code references, and encourages saving plans under `.cursor/plans/` as durable documentation for future work/agents. citeturn17view0turn17view1

This is effectively a "diff-shaped" plan: it creates a map from architectural intent to concrete repository touchpoints. citeturn7view3turn17view1

### Machine-readable workflow state and phase gates

A second demonstrated pattern is to separate (1) deterministic orchestration from (2) bounded agent execution.

In field notes from QuantumBlack (McKinsey & Company), successful implementations used deterministic orchestration to enforce phase transitions, manage dependencies, and track artefact state, with agent work constrained to executing within a phase. citeturn6view4 The same source describes storing artefact state (draft → in-review → approved → complete) in frontmatter, which the workflow engine reads to decide what is ready vs blocked. citeturn6view4

This matters for design docs intended for agents: without state and gates, agents can "skip steps" (e.g., generating implementation before requirements are stable) or form circular dependencies in their own task selection, especially on larger codebases. citeturn6view4

### Making "architecture decisions" machine-readable

"Machine-readable" does not necessarily mean formal models everywhere; it often means *structured metadata where it matters*, and referenceable contracts. Concrete examples:

- GitLab's LabKit design doc argues that lacking a machine-readable spec leads to documentation drift, and proposes protocol buffer schemas plus validation as contracts. citeturn13view0turn13view3
- Kiro's spec artefacts separate requirements, design, and tasks into standard filenames, giving consistent anchors for tools and agents. citeturn6view3turn20search4
- McKinsey/QuantumBlack's workflow describes conventions (folder structures, naming conventions) as an ingredient of machine-readability. citeturn6view4

A practical synthesis is that an AI-optimised design doc benefits from having **two layers of structure**:

1) **Human-readable narrative** for context, rationale, and edge-case explanation. citeturn8view0turn18view3
2) **Structured anchors** for agents: metadata, file-impact lists, task DAGs, and explicit gate conditions. citeturn7view3turn6view4turn20search0

## Capturing trade-offs so agents don't re-propose rejected approaches

A major failure mode of agentic implementation is "design regression": the agent rediscovers or reintroduces approaches the team already rejected, because the rejection rationale is not captured in a way the agent can reliably apply.

### What effective docs already do

Google-style guidance explicitly frames the design doc's job as documenting the trade-offs that selected one design over others, and calls "Alternatives considered" one of the most important sections because it answers "why not X?" for future readers. citeturn8view0

Other templates embed trade-offs as explicit prompts:

- Uber's minimal template has **Approaches** (options) separate from **Proposal** (recommended approach). citeturn6view0
- GitLab's LabKit design doc includes **Alternative Solutions** with multiple explicitly named rejected options. citeturn13view0
- Shopify's RFC template explicitly asks "Why should we not build this?" as a first-class section. citeturn19view0

These are already "agent-friendly" because they turn trade-offs into labelled, reviewable objects rather than scattered comments. citeturn19view0turn13view0turn6view0

### How to structure trade-offs so agents apply them

The evidence from spec-driven workflows suggests the agent benefits when "rejection rationale" is explicit and retrieval-friendly:

- Cursor guidance emphasises planning first and capturing plans as editable Markdown with references, so a later agent has a stable artefact to follow. citeturn17view0turn17view1
- McKinsey/QuantumBlack emphasises conventions and deterministic orchestration to prevent "re-litigating" sequencing decisions or losing rationale in chat logs. citeturn6view4

A useful pattern (synthesis from the above) is to represent each major decision as a unit with:

- Decision statement
- Options considered (including "do nothing")
- Evaluation criteria (especially constraints and non-goals)
- Chosen option + rationale
- Rejected options + *why rejected* (ideally tied to specific goals/non-goals or constraints) citeturn8view0turn19view0turn13view0

If the organisation also uses ADRs, an ADR can act as the stable "final decision record" distilled from a broader RFC discussion. citeturn14search14 (Public evidence from Spotify describes ADRs as capturing a decision, the context, and the consequences, often emerging from RFC discussions.) citeturn14search14

## Phasing and task decomposition that map cleanly to agent execution

### Granularity: tasks should be small, testable, and reviewable

Spec Kit's guidance is explicit that tasks should be "small, reviewable chunks" and implementable and testable in isolation—because this gives the agent a way to validate progress and reduces drift. citeturn7view1 The quickstart also explicitly recommends phased implementation for complex projects to avoid overwhelming agent context. citeturn6view2

Kiro uses a dedicated `tasks.md` artefact and a task execution interface with status updates, reinforcing the idea that the task plan is not just documentation but an operational control surface. citeturn6view3turn20search1

### Dependency ordering and task sequencing

Agent performance improves when ordering is explicit and dependency constraints are enforced:

- The Kiro workflow describes tasks as discrete tasks that can be run individually or all at once, with tracking of in-progress/completed status. citeturn6view3turn20search1
- Multiple Kiro descriptions (including third-party evaluations and Kiro marketing/docs) describe `tasks.md` as sequenced based on dependencies, with tasks mapping back to requirements (traceability). citeturn20search0turn20search8

The dependency emphasis is consistent with McKinsey/QuantumBlack's two-layer model: the orchestration layer manages dependencies and enforces phase transitions, while agents execute within those constraints. citeturn6view4

### Two-layer orchestration (McKinsey/QuantumBlack) applied to design docs

QuantumBlack's field notes describe a two-layer model:

- **Orchestration layer (deterministic)**: enforces phase transitions, manages dependencies, tracks artefact states (often via frontmatter), triggers agent actions only when prerequisites are met. citeturn6view4
- **Execution layer (agent + evals)**: within a phase, the agent creates the content (tasks, architectures, code, docs) and is evaluated against automated checks. citeturn6view4

Explicitly, this model emerged because letting agents orchestrate themselves on larger systems led to skipped steps, circular dependencies, and analysis loops. citeturn6view4

For "design docs as agent inputs", the implication is: your design doc should make phase boundaries and prerequisites *explicit* (e.g., "do not implement until requirements are approved", "do not start migration until data model is final", "Phase 2 depends on Phase 1 schema changes"), ideally in a way a tool can parse. citeturn6view4turn6view3turn6view2

## Failure modes and how AI changes them

### Classic failure modes (pre-AI) that still matter

A frequent failure dynamic is template bloat: required sections accumulate over time, and authors/reviewers feel much of the doc becomes superfluous or misplaced (content better suited for code review). citeturn18view0 At Uber scale, practitioner retrospectives describe "noise" (too many RFCs), ambiguity about when an RFC is required, and discoverability problems when docs are scattered in Google Drive or inconsistent locations. citeturn15search12turn18view1

Staleness is another long-standing issue. Google-style guidance explicitly recommends updating the design doc when implementation reality forces design changes, but also notes humans are bad at keeping documents in sync and that designs can accrete "amendments" rather than staying coherent. citeturn8view0

### AI-amplified failure modes

AI agents can amplify staleness and ambiguity because they convert text into code at scale. If the design doc is outdated or incomplete, the agent can systematically reproduce wrong assumptions across many files faster than a human would. This is one reason McKinsey/QuantumBlack calls out loss of rationale and constraints when decisions live in chat windows rather than durable artefacts. citeturn6view4

Agents also change the "under- vs over-specification" boundary:

- Under-specification leads to hallucinated requirements or architecture guesses (agents "mind read" and fill gaps). Spec-driven workflows explicitly aim to reduce guesswork by creating a clear spec, a technical plan, and then tasks. citeturn7view1turn6view3
- Over-specification increases review load and bikeshedding, and can push low-signal details into a doc that quickly diverges from the implementation. This was observed in large-company RFC practice where many template sections were viewed as superfluous. citeturn18view0

### AI-mitigated failure modes (when the workflow is designed well)

AI-native tools increasingly incorporate "steerability" and checkpoints designed to reduce these risks:

- Copilot Workspace explicitly inserts two steerable artefacts—spec (current/desired state bullets) and plan (file list + per-file actions)—and allows regeneration downstream after edits. citeturn7view3
- Cursor Plan Mode makes planning a distinct step, asks clarifying questions, produces an editable plan with file paths and references, and encourages saving the plan in-repo for future agents. citeturn17view0turn17view1
- Kiro includes mechanisms to regenerate/update tasks when requirements or design change, helping keep tasks synchronised with evolving specs. citeturn20search4turn6view3

These are workflow interventions aimed at turning "docs that don't match implementation" into "living specs" with explicit update paths. citeturn20search4turn7view1

## Evidence gaps and a practical template for agent consumption

### Where evidence is strong vs thin

Strong, direct evidence exists for:

- Google-style section structure and the emphasis on trade-offs/alternatives/cross-cutting concerns. citeturn8view0
- Uber's public lightweight RFC template and retrospective evidence of heavyweight checklists for services/mobile. citeturn6view0turn18view1
- GitLab's real, publicly readable design documents with consistent sections (Summary, Motivation, Goals, Non-goals, Proposal, Alternatives, Adoption Path, Rollout, etc.) and a "living document" posture. citeturn6view1turn12view0turn13view0
- Shopify's GitHub-native RFC template with deadlines and explicit "why not build" sectioning. citeturn18view2turn19view0
- AI-native workflow documentation for Spec Kit, Kiro, Cursor Plan Mode, and Copilot Workspace's design (including file-level plans and phase checkpoints). citeturn7view1turn6view3turn17view1turn7view3

Thinner evidence exists for:

- Stripe's *internal* engineering design doc/RFC section templates (public evidence is much stronger on writing culture than on a specific RFC outline). citeturn18view3turn17view3
- Cross-industry, empirical measurement of which doc structures most improve agent implementation quality (public material is mostly practitioner guidance and tool docs, not controlled studies). citeturn6view4turn17view0turn7view1

### A minimal viable "agent-ready" design doc

Synthesising the most repeated and tool-aligned structures, a minimal doc intended to be directly actionable by an agent should include:

- **Summary (TL;DR)** and explicit **decision deadline / status** (prevents agents following drafts). citeturn19view0turn6view4
- **Context + problem statement** (succinct; link out to the PRD instead of copying it). citeturn8view0turn19view0
- **Goals and non-goals** (non-goals are critical for preventing scope creep and agent overreach). citeturn8view0turn13view3
- **Proposal** (the chosen approach) plus **alternatives/trade-offs** (including explicit "why not build / why not X"). citeturn8view0turn19view0turn6view0
- **File-level change list** (create/modify/delete) and **task sequencing** (phase boundaries + dependencies). citeturn7view3turn17view1turn20search0
- **Definition of done**: tests, validation steps, rollout gates. citeturn7view1turn6view3turn6view4

### When to use a comprehensive RFC instead

A comprehensive RFC (or a tier-2 template) is justified when cross-cutting concerns are first-order risks: multi-region failover, capacity, SLOs, security/privacy constraints, migrations, operational readiness/runbooks. citeturn18view0turn18view1turn8view0 The main practical risk is that "comprehensive" becomes "default", causing template bloat and review fatigue. citeturn18view0turn15search12

A common mitigation is to keep the canonical section headings, but make most operational sections *conditional* ("include if applicable"), and push deep details into linked appendices or contracts (schemas, API specs, test plans) that can stay version-controlled with code. citeturn8view0turn13view0turn6view4
