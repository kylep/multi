---
title: "AI-Augmented PRDs and AI-Native SDLC"
summary: "Three Deep Research reports on AI-augmented PRD templates, acceptance criteria, failure modes, and AI-native software development lifecycles."
keywords:
  - deep-research
  - prd
  - product-requirements
  - ai-native-sdlc
  - acceptance-criteria
  - spec-driven-development
related:
  - wiki/research
  - wiki/prds
  - wiki/design-docs
scope: "Subject index for AI-augmented PRD research. Links to three provider reports."
last_verified: 2026-03-16
---

Three Deep Research reports on AI-augmented product requirement
documents and AI-native software development lifecycles, generated
from the same prompt across three providers. Used as inputs for
designing the PRD agent and PRD template.

## Prompt

> Research the current state of AI-augmented product requirement
> documents (PRDs) and AI-native software development lifecycles.
> Specifically investigate: PRD template structure, AI-augmented PRD
> workflows, acceptance criteria best practices, common PRD failure
> modes, AI-native SDLC, and PRD-to-design-doc handoff.

## Reports

- [Claude Deep Research: AI-Augmented PRDs](/wiki/research/ai-augmented-prds/claude.html) —
  6 sections covering 12 published templates, 5 AI workflow patterns,
  acceptance criteria hybrid format, failure modes, McKinsey/AWS/GitHub
  SDLC frameworks, and PRD-to-design-doc convergence.
- [ChatGPT Deep Research: AI-Augmented PRDs](/wiki/research/ai-augmented-prds/chatgpt.html) —
  Platform-specific analysis of Linear, Notion, Figma, Stripe, and
  GitLab PRD structures, AI workflow patterns (capture/structure/enrich/handoff),
  MCP as glue layer, and acceptance criteria comparison.
- [Gemini Deep Research: The Architecture of Intent](/wiki/research/ai-augmented-prds/gemini.html) —
  10 pages, 37 references. Covers PRD evolution, company benchmarks
  (Linear/Stripe/GitLab/Figma/Notion), AI-augmented workflows,
  acceptance criteria frameworks, failure modes, AI-native SDLC
  patterns (Intent/Build/Operate), and PRD-to-design handoff.

---

## Cross-Source Synthesis

All three reports were generated from the same prompt on 2026-03-16. Below is a structured comparison of their findings, with no outside opinions or external knowledge added.

### Shared Findings (present in 2+ sources)

#### All three sources

- **Modern PRDs are living, lightweight documents, not static contracts** — All three describe the shift from 20-30+ page waterfall-era PRDs to short (1-8 page), outcome-focused, iteratively developed documents embedded in collaborative tools like Notion, Coda, and issue trackers. (Claude, ChatGPT, Gemini)
- **PRDs should separate the "what/why" from the "how"** — All three emphasize that PRDs define the problem, users, goals, and success criteria, while design docs/RFCs handle architecture and implementation trade-offs. (Claude, ChatGPT, Gemini)
- **Explicit non-goals and scope boundaries are essential** — All three identify explicit "non-goals," "out of scope," or "no gos" sections as a defining feature of best-in-class modern PRD templates. (Claude, ChatGPT, Gemini)
- **Goals and success metrics are a universal PRD section** — Every source lists goals, KPIs, or success metrics as a core component present across all reviewed templates. (Claude, ChatGPT, Gemini)
- **AI-as-first-draft is the dominant PRD workflow pattern** — All three describe the pattern where PMs feed rough notes or bullet points into an LLM to produce a structured first draft, then edit. ChatPRD and Notion AI are named as primary tools. (Claude, ChatGPT, Gemini)
- **Human judgment remains irreplaceable for strategic decisions** — All three assert that humans retain exclusive authority over product intent, scope trade-offs, strategic fit, hypothesis definition, rollout strategy, and acceptance decisions. AI accelerates drafting; humans remain accountable. (Claude, ChatGPT, Gemini)
- **Three acceptance criteria formats compete: Given/When/Then, checklist, and outcome-based** — All three describe the same three formats and compare their strengths. Given/When/Then (BDD/Gherkin) provides the most structure and maps directly to automated tests. Checklists are simpler and good for non-functional requirements. Outcome-based criteria focus on measurable results. (Claude, ChatGPT, Gemini)
- **A hybrid acceptance criteria format is emerging as best practice for AI agents** — All three recommend combining elements of all three formats: outcome statements for alignment, BDD scenarios for critical paths, and checklists for cross-cutting constraints like security and documentation. (Claude, ChatGPT, Gemini)
- **Acceptance criteria that translate to tests are the most effective control surface for agents** — All three identify testable, executable acceptance criteria as the primary mechanism for constraining and validating AI agent implementation. Agents iterate until tests pass. (Claude, ChatGPT, Gemini)
- **Vagueness and ambiguity are the most common PRD failure mode** — All three cite vague requirements with unmeasurable language ("seamless," "intuitive") as the most frequent failure. (Claude, ChatGPT, Gemini)
- **Over-prescription (dictating "how" instead of "what") is a recurring failure mode** — All three identify PRDs that specify implementation details rather than outcomes as a failure pattern that stifles engineering creativity and, in AI-native flows, causes agents to blindly follow flawed instructions. (Claude, ChatGPT, Gemini)
- **Missing stakeholder alignment causes PRD failures** — All three describe PRDs written in isolation without proper discovery or review as a common failure mode. (Claude, ChatGPT, Gemini)
- **AI creates false confidence through plausible, polished output** — All three warn that AI-generated PRDs look professional and complete even when they lack depth, original thinking, or validated assumptions. This "illusion of completeness" is identified as the most dangerous AI-specific failure mode. (Claude, ChatGPT, Gemini)
- **AI can worsen PRDs by making verbosity cheap and skipping discovery** — All three note that AI makes it trivially easy to produce long, polished documents without the hard work of user research, stakeholder alignment, and strategic thinking. (Claude, ChatGPT, Gemini)
- **GitHub Spec Kit is a key spec-driven development tool** — All three describe GitHub Spec Kit as a structured workflow that generates requirements, plans, and tasks from specifications, representing the spec-driven development pattern. (Claude, ChatGPT, Gemini)
- **Spec-driven development is the consensus AI-native SDLC pattern** — All three converge on specifications as first-class, versioned artifacts that drive AI agent implementation, with "specification engineering" replacing "prompt engineering." (Claude, ChatGPT, Gemini)
- **Agent-implemented tasks require well-scoped work items with clear requirements** — All three emphasize that AI agents produce better results when given well-defined, bounded tasks with explicit acceptance criteria, rather than broad or ambiguous instructions. (Claude, ChatGPT, Gemini)
- **A plan-first step before implementation improves agent output** — All three describe a workflow where agents generate an explicit plan (enumerating files, actions, or phases) before writing code, and this plan is human-reviewable. (Claude, ChatGPT, Gemini)
- **The PRD-to-design-doc boundary is blurring in AI-native workflows** — All three observe that AI agent tooling is collapsing the traditional separation between PRD (what) and design doc (how) into a single specification artifact or tightly linked flow. (Claude, ChatGPT, Gemini)
- **GitLab treats the issue as the PRD** — All three describe GitLab's approach of using structured issue templates as the requirements artifact, with the issue description functioning as both PRD and SSOT. (Claude, ChatGPT, Gemini)
- **Figma embeds live designs into PRD templates** — All three note that Figma's PRD approach uses embedded live Figma files/frames that stay in sync with the written specification. (Claude, ChatGPT, Gemini)

#### Two sources

- **Scope creep is a common PRD failure mode** — PRDs that bloat with additional features until they become unread documents are identified as a recurring problem. (Claude, Gemini)
- **Stale/drifting documentation is a failure mode** — PRDs that fall out of sync with the actual codebase once development begins are called out as a common failure. Claude describes this generally; Gemini notes AI-native tools can auto-update docs via webhooks to mitigate it. (Claude, Gemini)
- **Intercom's "Intermission" template is a canonical minimum viable PRD** — A one-page format that enforces brevity by constraining the document to a single A4 page. (Claude, Gemini)
- **Amazon's PR/FAQ format inverts the PRD process** — Writing the press release first and working backward to requirements, used for launching AWS, Kindle, and Prime Video. (Claude, Gemini)
- **Figma's PRD includes non-functional requirements, risks, and evaluation plans** — Both describe Figma's template as going beyond basic requirements to include risk, NFRs, and success measurement. (ChatGPT, Gemini)
- **MCP (Model Context Protocol) is becoming the glue layer for agent-operable requirements systems** — Figma, Linear, and Stripe all publish MCP servers that let AI agents access design files, issue trackers, and APIs through standardized connectors. (ChatGPT, Gemini)
- **Linear's Triage Intelligence uses AI to suggest issue properties and detect duplicates** — Addressing failure modes where work lands with the wrong team or duplicates existing efforts. (ChatGPT, Gemini)
- **GitLab Duo can generate structured issue descriptions from short summaries** — Raising the baseline quality of requirements by transforming vague tickets into well-structured work items with acceptance criteria. (ChatGPT, Gemini)
- **Notion's "Linear PRD Implementer" agent generates structured Linear projects from PRD content** — An end-to-end handoff from Notion PRD to Linear project with milestones and phased rollout. (ChatGPT, Gemini)
- **Reforge identifies over-documenting and under-documenting as twin failure modes** — Teams either write dissertation-length PRDs to compensate for trust issues or under-document and force downstream ambiguity. (ChatGPT, Gemini)
- **Devin follows a staged workflow of Ticket, Plan, Test, PR** — Representing the AI-native SDLC where agents participate across requirements to implementation to review. (ChatGPT, Claude)
- **Copilot Workspace generates a spec-to-plan-to-implementation flow** — Starting from a GitHub issue, it generates an editable spec, plan enumerating file changes, and implementation diff. (ChatGPT, Claude)
- **Replit Agent builds end-to-end from prompt to deployed app** — But context retention degrades around 15-20 components. (ChatGPT, Claude)
- **AWS Kiro generates requirements with Given/When/Then acceptance criteria** — Including identifying contradictions between user stories, expanding ~10 requirements into 50+ well-defined ones. (Claude, Gemini)
- **McKinsey/QuantumBlack's two-layer architecture separates deterministic orchestration from bounded agent execution** — Self-orchestrating agents failed in practice (skipped steps, circular dependencies, analysis loops), leading to a rule-based workflow engine controlling sequencing with agents handling creative work within phases. (Claude, Gemini)
- **AWS AI-DLC replaces sprints with "bolts"** — Shorter cycles measured in hours or days rather than weeks, with AI creating plans and implementing after human validation. (Claude, Gemini)
- **Human-in-the-loop gating remains essential at spec approval and PR review** — All documented agent flows retain strong human review gates at plan/spec approval and merge/release. (ChatGPT, Claude)
- **Security and prompt injection are limiting factors for agentic SDLC** — Agent autonomy expands the attack surface; guardrails, tool safeguards, and human confirmation of tool calls are required. (ChatGPT, Gemini)
- **Stripe's writing culture integrates documentation into engineering practice** — Stripe treats writing as a core engineering competency, with docs in career ladders and performance reviews. (Claude, Gemini)
- **GitLab's public handbook cleanly separates Product ("What/Why") from Engineering ("How/When")** — With design documents version-controlled and requiring review. (Claude, ChatGPT)
- **Linear advocates against user stories in favor of clear, plain-language issues** — Arguing that user stories can be expensive to maintain and push engineers into a mechanical role. (ChatGPT, Gemini)
- **Hallucinated requirements are an AI-specific risk** — LLMs can fabricate constraints, cite non-existent standards, or specify integration points that do not exist. (Claude, Gemini)
- **ERNI's 43-PRD CRM case study revealed AI agent implementation limits** — Claude Code implemented integrations without checking backend APIs, missed required fields, and updated tests on incorrect assumptions, demonstrating that complex systems still require human oversight. (Claude, Gemini)

### Unique Findings (from one source only)

#### Claude only
- **12 published PRD templates surveyed with section frequency rankings** — Problem Statement (~100%), Goals/Success Metrics (~95%), Non-Goals (~90%), Solution/Approach (~85%), User Stories (~75%), Open Questions/Risks (~70%), Timeline/Milestones (~65%)
- **Three architectural patterns define elite templates** — Separating problem from solution with an explicit gate, explicit non-goals, and living collaborative documents embedded in tools
- **Basecamp's "appetite" concept** — A time budget set before scoping ("We're giving this 2 weeks, not 2 months"), introduced via Shape Up's Pitch format
- **Five distinct AI-augmented PRD workflow patterns** — AI-as-First-Draft, Claude Projects + Templates, PRD-Driven AI Coding, Spec-Driven Development platforms, and Lean PRD for Vibe Coders
- **Claude Projects + PRD Templates pattern** — Technical PMs create dedicated Claude Projects with custom system instructions and example PRDs as "Project Knowledge," using sub-agent personas to stress-test drafts
- **Lean PRD for Vibe Coders** — A one-page formula (Problem, User/Job, Non-goals, Success metric, Scope v1, Risks, Kill/iterate rule) targeting solo developers and indie hackers
- **AI agents don't ask clarifying questions; they assume** — The key insight that traditional PRDs could omit behavior descriptions and error states because human developers would ask, but AI tools fill gaps with assumptions
- **65% of product professionals integrate AI into workflows** — With reported 6-9 hours/week time savings on PRD work, though figures come from vendor-adjacent surveys
- **GitHub's analysis of 2,500+ agent configuration files** — Found the most effective specs cover Commands, Testing, Project Structure, Code Style, Git Workflow, and Boundaries; the most common constraint was "never commit secrets"
- **"Specification engineering" is replacing "prompt engineering"** — A terminology shift in practitioner discourse reflecting the move toward structured specifications as the primary interface for AI agents
- **Martin Fowler's Thoughtworks team found agents frequently ignored or over-interpreted spec instructions** — Including an agent that duplicated existing classes by treating descriptions as new specifications
- **Requirements failures account for 37% of enterprise project failures (PMI)** — With 68% of requirement defects discovered at later stages where correction costs 5-10x more (Carnegie Mellon SEI)
- **Context loss and architectural drift is the core failure mode of vibe coding** — Documented by Zarar (payments engineering): reconciliation logic scattered across three modules because each prompt generated its own approach
- **Non-functional requirements blindspot** — AI-generated specs systematically miss scalability, security, accessibility, and regulatory compliance unless explicitly prompted
- **Net impact matrix: AI significantly worsens discovery-skipping, generic language, and false confidence** — While modestly helping with acceptance criteria templates, prioritization frameworks, and document updates
- **Scott Logic's CTO found GitHub Spec Kit produced "a sea of markdown documents" with friction** — Calling it more useful principles than a practical end-to-end process
- **Microsoft/GitHub's Agentic DevOps and the V-Bounce Model** — The academic model formalizing AI handles implementation while humans shift to validators and verifiers
- **Factory AI provides model-agnostic "Droids" with tunable autonomy levels** — Deployed at EY to 5,000+ engineers
- **Cursor achieves 85% accuracy on refactors** — With deep codebase context
- **DORA 2024 report found AI improved throughput but increased software delivery instability** — GitClear 2025 found a surge in duplicated code and decline in refactoring
- **Six converging architectural patterns** — Two-layer architecture, spec-driven development, human-on-the-loop, mob elaboration, agent autonomy levels, and critic agents
- **Form3's three-document framework: PRD, RFC, and ADR** — PRD (problem), RFC (proposed solution), ADR (decision record), with the gray zone around NFRs and API contracts acknowledged as blurry
- **Andrew Ng observed the PM-to-engineer ratio shifting** — "For the first time in my life, managers are proposing having twice as many PMs as engineers"
- **Addy Osmani recommends blending PRD and SRS for AI agents** — Writing like a PRD for user-centric context while expanding like an SRS for implementation specifics
- **Google, Uber, Shopify, and Amazon PRD-to-design-doc frameworks** — Detailed company-by-company analysis of how each handles the what-vs-how boundary
- **Kevin Yien's "perimeter of the solution space" philosophy** — Drawing boundaries so the team can focus on filling them in, with mandatory stakeholder sign-offs at each stage
- **Carlin Yuen (Meta) distinguishes Product PRDs from Feature PRDs** — Targeting 6-8 pages, with different document types for opportunity-level vs detailed requirements

#### ChatGPT only
- **Notion's PRD template organized as Context, Goal/KPIs, Constraints/Assumptions, Dependencies, Tasks** — With PRDs positioned as lightweight pages linking out to artefacts
- **GitLab's Feature Proposal template includes 15+ structured sections** — Including Release Notes, Permissions/Security, Documentation, Availability/Testing, Available Tier, Feature Usage Metrics, Buyer Type, Cross-Stage, and Competitive Advantage
- **Linear positions agents as "app users" who can be delegated issues** — But explicitly states delegating to an agent does not transfer responsibility; the human remains responsible for completion
- **Notion Agent operates with the user's permissions and changes are undoable** — With explicit authority boundaries listing actions the agent cannot perform
- **OpenAI's agent design guidance treats instructions as one of three core components (model/tools/instructions)** — With layered guardrails, tool safeguards with risk ratings (low/medium/high), and escalation triggers
- **Cursor recommends instructing agents to write code that passes tests without modifying tests** — Making tests the control surface for agent autonomy, iterating until all tests pass
- **Maarten Dalmijn argues the bottleneck in requirements is shared understanding, not writing speed** — AI-generated requirements can worsen understanding by short-circuiting collaboration
- **GitLab's Issue-to-MR agent flow** — Analyzes issue requirements, opens a draft MR linked to the issue, creates a development plan, and proposes implementation; developer monitors, reviews, and merges through standard workflow
- **Linear provides "agent guidance" in Markdown with history** — Specifying repository conventions, commit/PR references, and review process to align agents with existing workflows
- **Capture-structure-enrich-handoff as the four-stage AI PRD workflow** — Capture (meetings/threads to structured inputs), Structure (AI drafts into template), Enrich (metadata/dependencies/duplicates), Hand-off (PRD to tickets to code)
- **Linear AI discussion summaries with citations to source comments** — Providing audit trails for decisions and reducing context loss
- **GitLab uses enablement toggles for agentic features at the project level** — Signaling that organizations gate autonomous actions
- **Stripe's MCP docs explicitly warn about prompt injection** — Recommending human confirmation of tool calls and restricted API keys
- **The "what vs how" enforcement mechanism is changing** — Less about document types and more about which artefact is allowed to drive automated action

#### Gemini only
- **Linear's PRD philosophy is "increasing granularity"** — Starting with high-level context before moving to scenarios and milestones, documenting least-changing elements first
- **Stripe's "product shaping" documents include code snippets alongside user stories** — Viewing documentation as a core engineering product
- **Stripe's "Gavel Block"** — A section listing impacted stakeholders with checkboxes to track review status, ensuring explicit rather than implied alignment
- **Notion treats requirements as nodes in a knowledge graph** — With database-style tables for personas and user stories prioritized P0-P2, and embedded Figma prototypes next to acceptance criteria
- **GitLab's Validation Track and Build Track workflow** — Bifurcating the process into understanding the problem and testing hypotheses before building
- **Research Synthesis as a PRD workflow stage** — Using tools like Dovetail or Kraftful to ingest customer feedback, interview transcripts, and support tickets to extract pain points and user stories
- **AI enables startups to explore 50+ design variations in a single afternoon** — Democratizing engineering capabilities and acting as a translator between siloed disciplines
- **20-30% of R&D time in large enterprises spent on documentation** — AI addresses this "Knowledge Management Bottleneck" by parsing internal repositories and OpenAPI specs to keep docs in sync
- **"Five States per Screen" rule** — Every UI requirement must explicitly define Loading, Empty, Partial, Full, and Error states for reliable AI-generated code
- **"Contract-First" mandate** — Freezing the specification (Figma designs, OpenAPI specs, database plans) before agent implementation begins
- **"Velocity Trap"** — The speed of AI code generation outpacing the team's ability to validate quality or intent
- **AI-native SDLC structured as Intent/Build/Operate modes** — Intent (spec-first), Build (parallel requirements/design/development), Operate (production telemetry analysis and pruning proposals)
- **FIRE (Fast Intent-Run Engineering) flow** — Uses adaptive checkpoints (Autopilot, Confirm, Validate) based on task complexity, designed for brownfield projects and monorepos
- **AI-DLC flow implements Domain-Driven Design for complex domains** — A full methodology for regulated environments
- **New performance metrics for AI-native teams** — Prompt Quality + Decision Velocity, Risk-Weighted Test Coverage, Time-to-Detection + Resolution Automation Rate, Sustainability of Velocity
- **Agents can analyze production telemetry to generate pruning proposals** — Identifying unused code or obsolete compatibility shims in Operate mode
- **"Shaping document" as a distinct artifact bridging PRD and technical design** — A cross-functional document with rough solutions, code snippets, and trade-offs
- **Knowledge Graphs and Memory Banks as handoff mechanisms** — Notion requirements as nodes linking directly to technical docs and Figma prototypes, creating a "digital thread" agents can follow
- **Stripe enforces a "Problem Review" checkpoint between Project Brief and Project Proposal** — Ensuring alignment before engineering effort is expended
- **BDD scenarios described as "gold standard" for AI-native workflows** — Because they map directly to automated tests and provide deterministic goals for coding agents

### Contradictions (points where sources disagree)

- **Whether Stripe has a PRD template or practice** — Claude states Stripe has "no published template, only quotes about their writing culture." ChatGPT similarly finds "no Stripe-authored PRD template surfaced" and extrapolates their approach is design-doc-centric. Gemini presents Stripe's "product shaping" documents as a concrete, documented practice with specific structural elements (code snippets, Gavel Blocks, Problem Review checkpoints).
- **Whether Linear has a meaningful PRD template** — Claude states Linear has "no published PRD template" with only one PM for 50+ employees. ChatGPT finds Linear supports project documents for specs/PRDs but does not publish an official section list. Gemini describes a specific Linear PRD philosophy ("increasing granularity") with named sections (Context, Usage Scenarios, Milestones) and a deliberate structural principle of documenting least-changing elements first.
- **Whether the PRD and design doc are collapsing into one artifact or maintaining separation** — Claude argues strongly that AI is "collapsing the PRD and design doc into a single specification artifact," citing GitHub Spec Kit, Osmani, and ChatPRD MCP integration. ChatGPT maintains the boundary still exists but says the enforcement mechanism is changing from document types to "which artefact is allowed to drive automated action." Gemini describes a "shaping" phase that bridges the two documents but preserves the PRD/TDD distinction as separate artifacts with different owners.
- **AI's net impact on PRD failure modes** — Claude presents a "sobering" net impact matrix where AI "significantly worsens" discovery-skipping and generic language while only "modestly helping" with templates and prioritization. Gemini presents AI as a net positive that mitigates most traditional failure modes (ambiguity via clarity checking, drift via auto-updates, scope creep via non-goals, silos via translation), with hallucination as the main new risk. ChatGPT takes a middle position, listing both mitigations and new risks without a net assessment.
- **Emphasis on company template analysis vs workflow analysis** — Claude focuses heavily on 12 published templates with quantified section frequencies across named companies and product leaders. ChatGPT focuses on platform-specific tool capabilities (Linear, Notion, Figma, GitLab) and agent-operable systems. Gemini focuses on company philosophies and cultural approaches (Linear's "increasing granularity," Stripe's "product shaping," Notion's "knowledge graph"). The same companies are analyzed through substantially different lenses.
- **Whether BDD/Gherkin is the "gold standard" for AI agents** — Gemini explicitly calls BDD scenarios "the gold standard for AI-native workflows." Claude describes a hybrid format as "the converging best practice" with Gherkin as one component. ChatGPT recommends a hybrid where BDD scenarios are used for "critical paths/edge cases" alongside outcome statements and DoD checklists, without elevating BDD above the others.
- **Deterministic orchestration as a dominant pattern** — Claude and Gemini both describe deterministic orchestration with bounded agent execution as an architectural pattern for AI-native SDLC, with Claude calling it "the dominant architectural pattern" based on McKinsey/QuantumBlack's experience. ChatGPT does not discuss deterministic orchestration as a pattern, instead focusing on individual tool workflows (GitLab Issue-to-MR, Devin, Copilot Workspace) without abstracting a meta-pattern for agent orchestration.
