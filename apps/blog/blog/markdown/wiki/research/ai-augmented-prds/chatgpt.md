---
title: "ChatGPT Deep Research: AI-Augmented PRDs and AI-Native SDLCs"
summary: "ChatGPT Deep Research report on AI-augmented PRD templates from Linear/Notion/Figma/Stripe/GitLab, acceptance criteria frameworks, PRD failure modes, and AI-native SDLC patterns."
keywords:
  - deep-research
  - chatgpt
  - prd
  - product-requirements
  - ai-native-sdlc
  - acceptance-criteria
  - linear
  - notion
  - figma
  - gitlab
provider: chatgpt
prompt: "Research the current state of AI-augmented product requirement documents (PRDs) and AI-native software development lifecycles. Specifically investigate: PRD template structure, AI-augmented PRD workflows, acceptance criteria best practices, common PRD failure modes, AI-native SDLC, and PRD-to-design-doc handoff."
date_generated: 2026-03-16
related:
  - wiki/research
  - wiki/research/ai-augmented-prds
scope: "Single-provider Deep Research report. Not cross-referenced or synthesized."
last_verified: 2026-03-16
---

# AI‑Augmented PRDs and AI‑Native Software Development Lifecycles

## Evidence base and scope

This report synthesises publicly available, primary documentation from Linear, Notion, Figma, Stripe, and GitLab; plus primary vendor documentation for widely used agentic SDLC tooling and standards (e.g., MCP, coding agents, acceptance‑criteria frameworks). Where vendor pages do not expose a “canonical PRD template”, the report treats the company’s published templates, issue/spec templates, and workflow guidance as the closest proxy for “best‑in‑class PRD structure”. citeturn1view0turn2view0turn2view1turn4view1turn8view0turn24view0turn23view0

Evidence quality varies sharply by subtopic: template sectioning is well‑documented for Notion, Figma, and GitLab; weaker for Linear (tooling supports PRDs but doesn’t publish a single official section list); and weakest for Stripe (public guidance exists for design docs / agent integrations, but not a published PRD template). These gaps are explicitly flagged where they affect conclusions. citeturn1view0turn23view0turn9search0

## PRD template structures and how modern templates differ

### What sections show up in current “best‑in‑class” templates

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["FigJam PRD template","Notion PRD template example","GitLab feature proposal issue template","Linear project documents spec PRD"]}

**Notion (PRD example + guidance)**  
Notion’s “How to write a PRD” post gives a concrete PRD template example organised as: **Context**, **Goal and KPIs**, **Constraints and assumptions**, **Dependencies**, and **Tasks** (often implemented as a Kanban board embedded in the PRD). citeturn2view0  
Separately, Notion’s Help Centre guide frames “typical PRD attributes” as **Context**, **Goals/Requirements**, **Constraints**, **Assumptions**, and **Dependencies**, and explicitly positions PRDs as *lightweight pages that link out to artefacts* (design docs, interviews, images, etc.). citeturn2view1

**Figma (PRD template + PRD guidance)**  
Figma’s PRD guidance enumerates “core components” of a PRD as a broad, cross‑functional set, including **Product overview**, **Purpose/use cases/value propositions**, **Features & functionality**, **User personas + user stories**, **User flows + UX notes**, **Release criteria + timeline**, **Risks**, **Non‑functional requirements**, **Assumptions/dependencies/constraints**, and an **evaluation plan + success metrics**. citeturn4view1  
Figma’s FigJam PRD template page is less explicit about headings, but it emphasises aligning on **purpose**, **problem**, and **product functions/goals/user experience**, consistent with a “collaborative canvas” framing rather than a signed‑off specification. citeturn4view0

**GitLab (feature proposal template as PRD‑adjacent requirements artefact)**  
GitLab’s built‑in **Feature proposal – detailed** issue template is a structured requirements document embedded directly in the tracker. Its headings (in order) are: **Release notes**, **Problem to solve**, **Intended users**, **User experience goal**, **Proposal**, **Further details**, **Permissions and Security**, **Documentation**, **Availability & Testing**, **Available Tier**, **Feature Usage Metrics**, **What does success look like, and how can we measure that?**, **What is the type of buyer?**, **Is this a cross‑stage feature?**, **What is the competitive advantage or differentiation for this feature?**, **Links / references**—and it includes label quick‑actions to classify the issue. citeturn8view0turn8view1  
GitLab also documents the underlying mechanism: description templates (Markdown files in `.gitlab/issue_templates`) standardise issue layouts across projects and can be applied via UI when creating issues. citeturn1view2turn8view1

**Linear (project documents + templates; “PRD” as a doc type, not a canonical template)**  
Linear’s docs explicitly support “project documents” for **specs** and **PRDs**, and allow teams to create **document templates** to “guide creators to share information effectively”. However, Linear’s documentation does not publish an official “PRD template section list” in the same way Notion/Figma do. citeturn1view0  
Instead, Linear publishes process guidance that heavily influences “requirements shape”: it argues against user stories and pushes for **short, plain‑language issues** with clear outcomes, and for user‑experience discussion at the *project/feature level* before work is broken into tasks. citeturn17view0

**Stripe (evidence thin for PRD templates; stronger for adjacent artefacts + agent integration)**  
No Stripe‑authored PRD template or section list surfaced in current public docs during this research. Evidence is stronger for (a) how Stripe thinks about *design docs* (especially API design docs) and (b) agent/tooling standards (notably MCP). A Stripe Sessions developer keynote explicitly references using an LLM to handle “chaos” in a human‑written API design doc in Google Docs and provide suggestions during API design. citeturn9search0  
Separately, Stripe publishes a Model Context Protocol server to let AI agents interact with Stripe’s API and knowledge base (docs + support articles). citeturn23view0  
**Extrapolation (flagged):** Given Stripe’s public emphasis on disciplined API design and tooling‑integrated documentation, it is plausible their internal “requirements” artefact often manifests as design‑doc‑centric rather than PRD‑centric; but this cannot be confirmed from first‑party PRD templates. citeturn9search0turn23view0

### How modern templates differ from waterfall‑era PRDs

Modern, widely‑shared templates converge on several shifts:

**From exhaustive up‑front specification to “living” alignment artefacts.** Notion describes PRDs as typically “one page” that links out to deeper artefacts and can adapt per project, rather than a monolithic document. citeturn2view1  
Figma explicitly frames PRDs as focusing on **what** is being built and why, while remaining adaptable in agile environments (including PRDs that resemble boards combining epics/stories/tasks with context). citeturn4view1  
Reforge contrasts 1990s PRDs (20–30 pages, definitive records) with modern agile contexts where static documents fit poorly; it argues for a “dynamic and evolving” PRD that is “enough to get started” and updated as learning occurs. citeturn18view0

**From “requirements as control” to “requirements as shared understanding”.** Reforge identifies two modern failure modes—over‑documenting to compensate for trust/ownership issues, or under‑documenting and forcing downstream ambiguity—and positions effective PRDs as enabling alignment and creativity rather than dictating a prescriptive plan. citeturn18view0  
Linear’s “Write issues not user stories” is aligned: it argues user stories can obscure the work, be expensive to maintain, and silo engineers into a mechanical role; it advocates discussing UX at the product level and writing clear tasks rather than ritualised story formats. citeturn17view0

**Heavier inclusion of measurement, rollout, risk, and non‑functional constraints.** Figma’s enumerated core components include risks, non‑functional requirements, and an evaluation plan with success metrics. citeturn4view1  
GitLab’s feature proposal template explicitly includes security/permissions, documentation, availability/testing, usage metrics, and a success‑measurement section—closer to a “full lifecycle” spec than a narrow requirements list. citeturn8view0

### Minimum viable PRD vs comprehensive PRD

A practical, evidence‑aligned way to define “minimum viable” is: the smallest artefact that still supports (1) stakeholder alignment, (2) unambiguous scoping, and (3) a testable release gate.

**Minimum viable PRD (MV‑PRD):**  
A consistently supported minimal set across Notion + Figma guidance is:

- **Context / overview** (what is being built and why) citeturn2view0turn4view1  
- **Goal(s) and success metrics / KPIs** (how you’ll know it worked) citeturn2view0turn4view1  
- **Scope**: key features / user flows, plus explicit constraints/assumptions/dependencies citeturn2view0turn2view1turn4view1  
- **Release / acceptance criteria** (what must be true to ship) citeturn2view0turn4view1

Notion’s own framing that “streamlined PRDs” cover purpose, goals, features, and release criteria matches this MV‑PRD definition. citeturn2view0

**Comprehensive PRD (or PRD‑adjacent “full stack” spec):**  
GitLab’s feature proposal template is a canonical example of “comprehensive”: beyond problem/users/proposal, it embeds security, documentation requirements, availability/testing strategy, tiering/commercial framing, and explicit measurement. citeturn8view0  
Figma’s “core components” list similarly expands into non‑functional requirements, risk, and an evaluation plan; it also acknowledges that some teams fold functional/technical specs into (or alongside) the PRD. citeturn4view1

## AI‑augmented PRD workflows

### Common workflow patterns observed in current tools

Across the major platforms reviewed, teams are converging on “AI as a requirements accelerator” in four recurring patterns: **capture → structure → enrich → hand off**.

**Capture: meetings, threads, and scattered context become structured inputs.**  
Notion’s AI Meeting Notes explicitly targets automated capture of meeting content into summaries and action items and keeps the resulting artefacts searchable in the workspace. citeturn15view0  
Linear generates AI discussion summaries when issues reach a comment threshold, and includes citations linking back to source comments to preserve traceability. citeturn13view1  
These features are functionally “PRD feeders”: they convert conversational artefacts into structured decisions, blockers, and next steps. citeturn15view0turn13view1

**Structure: AI drafts or rewrites requirements into a consistent template.**  
GitLab Duo can generate a “detailed description for an issue based on a short summary” directly in the issue creation flow. citeturn14view0  
GitLab’s internal engineering handbook publishes a concrete practice: use a standard prompt with Duo Agent to transform vague follow‑up issues into well‑structured work items with background, current state, requested changes, proposed implementation, acceptance criteria, and technical context. citeturn13view3  
This is a direct example of AI being used to take “vague idea / thin ticket → scoped, actionable requirements”. citeturn13view3turn14view0

**Enrich: AI infers metadata, dependencies, duplicates, ownership, and relationships.**  
Linear’s Triage Intelligence uses LLMs to suggest issue properties (teams, projects, assignees, labels) and detect duplicates/relationships by comparing new triage items against historical workspace data; it supports accept/decline and exposes reasoning. citeturn13view0  
This is effectively “requirements routing + de‑duplication” at scale: it reduces the frequency of PRDs failing because ownership, scope, or prior art is missing. citeturn13view0

**Hand‑off: PRD → tickets → code changes, increasingly via agentic flows.**  
Notion’s “Linear PRD Implementer” agent template claims an end‑to‑end hand‑off: @mention the agent in a Notion PRD/strategy doc/meeting notes, and it generates a structured Linear project with milestones and actionable issues (including descriptions, labels, deadlines, and phased rollout like Alpha/Beta/GA). citeturn15view2  
GitLab Duo Agent Platform’s “Issue to MR” flow is an explicit PRD‑to‑implementation bridge: it analyses an issue’s requirements, opens a draft merge request linked to the issue, creates a development plan, and proposes an implementation in the GitLab UI. citeturn14view1

### Tools and mechanisms enabling these workflows

A key “current state” shift is that requirements artefacts increasingly live **inside systems that are directly operable by agents** (issue trackers, docs systems, and design tools), rather than in disconnected documents.

**Agent‑operable requirements systems (examples)**  
Linear positions agents as “app users” who can be mentioned, delegated issues, comment, and collaborate on projects/documents; importantly, Linear states that delegating to an agent does not transfer responsibility—the human remains responsible for completion. citeturn13view2  
Notion’s Agent runs inside the workspace, can create/edit pages and databases using workspace + connected apps context, and can be personalised with instructions/skills/resources; it also clarifies the agent’s authority boundary (same permissions as the user) and that changes can be undone. citeturn16view0  
GitLab bakes AI into the issue and merge request lifecycle (issue description generation; merge request summaries; AI‑assisted code review flows). citeturn14view0turn14view2

**MCP as the emerging “glue” layer for PRD/SDLC agents**  
A notable 2025–2026 pattern is rapid adoption of the Model Context Protocol (MCP) by major platforms, to let agents securely access product context and tooling:

- Figma publishes an MCP catalog positioning the Figma MCP server as a way to “add Figma context” to agentic coding tools (Cursor, Claude Code, Codex, etc.) for design‑informed code generation. citeturn22view0  
- Linear publishes an MCP server that exposes tools for finding/creating/updating Linear objects (issues/projects/comments), using OAuth‑based remote MCP per spec, with setup instructions for multiple clients (Claude, Codex, Cursor, VS Code, Windsurf, etc.). citeturn24view0  
- Stripe publishes a Stripe MCP server that exposes Stripe API + knowledge‑base tooling for agents, recommending OAuth and restricted API keys; it explicitly warns about prompt‑injection risk and recommends human confirmation for tools. citeturn23view0  

Taken together, this suggests a near‑term architecture for AI‑augmented PRDs: PRD content stays in Notion/Linear/GitLab/Figma, and agents interact through standardised connectors rather than bespoke integrations. citeturn22view0turn24view0turn23view0

### Human judgement vs AI generation in practice

Primary sources consistently codify a “human‑in‑the‑loop” control plane:

- **Responsibility remains human** in Linear: agents act on issues, but the human remains responsible for completion. citeturn13view2  
- **Human review gates output quality** in GitLab’s Issue→MR flow: prerequisites include a well‑scoped issue with clear requirements and acceptance criteria, and the workflow explicitly instructs the developer to review changes, optionally validate locally, and merge through standard review. citeturn14view1  
- **Authority boundaries are explicit** in Notion: the agent operates with the user’s permissions and changes are undoable; the product also lists actions the agent cannot perform (e.g., certain admin actions). citeturn16view0turn16view1  
- **Security/guards are first‑class** in agent design guidance: entity["company","OpenAI","ai research company"] emphasises layered guardrails and “tool safeguards” with risk ratings (low/medium/high) to determine when to pause for checks or escalate to a human. citeturn21view2turn21view4  

This implies a practical division of labour: AI accelerates drafting, structuring, and enrichment; humans remain accountable for product intent, scope trade‑offs, and acceptance decisions. citeturn13view2turn14view1turn21view4

## Acceptance criteria and definition of done for an agentic build world

### What “good” looks like, per established practice

**Acceptance criteria** as “conditions that must be satisfied to be complete” are widely framed as **clear, concise, and testable** statements focused on outcomes rather than the implementation path. entity["company","Atlassian","software company"] explicitly distinguishes acceptance criteria from “how to reach a solution” and emphasises outcome focus. citeturn10search2  

**Definition of Done (DoD)** is structured as a quality gate for increments: the Scrum Guide defines it as the formal description of the state of the increment when it meets required quality measures. citeturn10search1  

### Comparing formats: Given/When/Then vs checklists vs outcome‑based

**Given/When/Then (BDD / Gherkin)**  
Cucumber guidance recommends making scenarios more “declarative” to describe behaviour rather than implementation, improving maintainability and making scenarios read as living documentation. citeturn10search0  
CucumberStudio guidance notes the purpose of Given/When/Then is logical structure and readability for people (automation tools may not care, but humans do). citeturn10search16  
Strength: high precision for key user interactions, straightforward to convert into automated tests. citeturn10search0turn10search16

**Checklist‑style criteria**  
Checklists are commonly used for verification items and are often paired with DoD‑style gates (documentation, rollout checks, security review). GitLab’s issue enhancement template explicitly uses checklist formatting for acceptance criteria in its “Example Structure”. citeturn13view3  
Strength: efficient for non‑functional and process requirements that don’t fit a scenario model (e.g., docs updated, metrics added). citeturn13view3turn10search1

**Outcome‑based criteria (metrics + evaluation plans)**  
Figma includes “evaluation plan and related success metrics” as a core PRD component, indicating that acceptance often includes measurable post‑release outcomes, not only functional checks. citeturn4view1  
Notion similarly pairs goals with KPIs in its PRD example. citeturn2view0  
Strength: protects against shipping “busy work” that meets functional checks but fails user/business value. citeturn4view1turn2view0

### Which format works best when AI agents will implement the work?

Current agent tooling strongly favours **acceptance criteria that can be translated into tests**, while retaining a lightweight checklist for cross‑cutting quality.

Two concrete signals:

- Cursor explicitly frames test generation as “starting with requirements rather than implementation”, and claims it can generate tests directly from “acceptance criteria, tickets, or specs”. citeturn19search11  
- Cursor’s agent best‑practice guidance recommends instructing agents to write code that passes tests (and not to modify tests), iterating until all tests pass—making tests the control surface for agent autonomy. citeturn19search30  

**Implication:** For agent‑implemented tasks, the most robust pattern is a hybrid:

1) **Outcome statement** (user/business result + metric) — aligns the agent with “why”. citeturn4view1turn2view0  
2) **A small set of Given/When/Then scenarios** for critical paths/edge cases — gives the agent executable behavioural targets. citeturn10search0turn10search16turn19search11  
3) **A DoD‑aligned checklist** for cross‑cutting constraints (security, docs, telemetry) — prevents “functional but unsafe/undeliverable” outcomes. citeturn10search1turn13view3

Where teams expect agents to act autonomously across tools, it is also becoming important to specify **tool permissions and escalation triggers** as part of “done”, consistent with OpenAI’s “tool safeguards” framing. citeturn21view4

## Common PRD failure modes and how AI changes them

### Failure modes that recur in practice

**Too vague / context‑poor**  
GitLab’s handbook documents a concrete, high‑frequency failure: follow‑up issues created from merge request discussions often have generic titles, minimal context, no implementation guidance, and vague acceptance criteria; this creates technical debt and reduces pick‑up ability by anyone except the original author. citeturn13view3  

**Too prescriptive / solution‑locked**  
Linear argues user stories can drive “code to the requirements” behaviour and push engineers into a mechanical role, implying a failure mode where requirements over‑specify the solution rather than framing the problem and desired outcome. citeturn17view0  

**Too heavy / used to compensate for trust and ownership problems**  
Reforge highlights a failure mode where PRDs become dissertation‑like documents to solve misalignment and trust issues; conversely, under‑writing creates downstream unresolved questions. citeturn18view0  

**Missing stakeholder alignment and review participation**  
RFC‑style processes fail when review is absent: Increment notes that writing a long RFC is not useful if no one reviews or discusses it, and that RFCs impose a time cost that some resist. citeturn18view2  

### How AI‑augmented approaches mitigate failure modes

**Mitigation: automated summarisation + traceability reduces context loss.**  
Linear issue discussion summaries include citations to source comments, providing an audit trail for decisions and reducing “lost context” failure. citeturn13view1  
Notion AI Meeting Notes turns meetings into structured summaries/actions and keeps them searchable in the workspace, which reduces “decisions trapped in calls” failure. citeturn15view0  

**Mitigation: templated “issue enhancement” and generation raises baseline quality.**  
GitLab’s Duo Agent prompt formalises a structure that forces background, current state, requested changes, proposed implementation, acceptance criteria, and technical context—explicitly targeting the “vague follow‑up issue” failure mode. citeturn13view3  
GitLab Duo’s issue description generation similarly raises baseline detail from a short summary. citeturn14view0  

**Mitigation: inference of ownership/duplication reduces routing errors and scope drift from duplicate work.**  
Linear’s Triage Intelligence suggests ownership and relationships (duplicates/related issues) and can auto‑apply properties—addressing common PRD failure modes where the work lands with the wrong team or duplicates existing efforts. citeturn13view0  

### How AI can worsen failure modes

**Risk: AI “writes the PRD”, but the team doesn’t internalise it.**  
Maarten Dalmijn argues the bottleneck in requirements isn’t writing speed; it is shared understanding, and AI‑generated requirements can worsen understanding by short‑circuiting collaboration. citeturn11search5  

**Risk: plausible detail creates false confidence.**  
Evidence here is indirect but consistent with vendor guardrail emphasis: OpenAI’s agent guidance treats guardrails and tool safeguards as critical because model outputs can be off‑topic, unsafe, or unreliable, especially when connected to tools and data. citeturn21view2turn21view4  
Stripe’s MCP docs explicitly warn about prompt injection and recommend human confirmation of tools, reinforcing that “agentic automation” increases the blast radius of incorrect or manipulated instructions. citeturn23view0  

**Risk: PRDs become over‑long because AI makes verbosity cheap.**  
This is a reasoned extrapolation grounded in Reforge’s “dissertation PRD” failure mode: if teams already over‑document to solve people problems, LLMs can accelerate producing large documents that still fail to create alignment. citeturn18view0  
**Extrapolation (flagged):** the sources do not directly quantify “AI‑caused PRD bloat”, but the mechanism is consistent with observed failure modes + AI writing affordances. citeturn18view0turn21view1  

## AI‑native SDLC: end‑to‑end examples, what’s working, and emerging patterns

### Documented end‑to‑end AI‑native flows

**Requirements → implementation via GitLab Duo Agent Platform (Issue → MR)**  
GitLab documents an “Issue to MR” agent flow: given a well‑scoped issue with clear requirements and acceptance criteria, the flow analyses the issue, opens a draft merge request linked to the issue, creates a development plan, and proposes an implementation; the developer can monitor agent sessions, review file‑level changes, optionally validate locally, and merge via the standard workflow. citeturn14view1  
This is one of the clearest first‑party examples of agents participating across requirements → plan → code → CI pipeline → review. citeturn14view1turn14view2

**Ticket → plan → test → PR via Devin**  
entity["company","Cognition","ai software company"]’s Devin product site explicitly presents a staged workflow: **Ticket**, **Plan**, **Test**, **PR**, including “Devin tests changes by itself” and a “review changes natively” step. citeturn19search8  
Devin’s docs describe it as an autonomous AI software engineer that can write, run, and test code, and can tackle Linear/Jira tickets and implement new features (with an explicit limitation framing that it cannot handle extremely difficult tasks). citeturn19search12  
Cognition also published (Feb 2026) guidance on using Devin internally (“How Cognition uses Devin to build Devin”), reinforcing the “treat it like a teammate, give context, teach conventions” operational model. citeturn19search16

**Spec → plan → edits across files via Copilot Workspace**  
entity["company","GitHub","code hosting platform"] Next’s Copilot Workspace page describes a workflow where—after you edit/approve a “spec”—the tool generates a concrete plan enumerating files to create/modify/delete and bullet‑point actions per file, with the plan remaining user‑editable. citeturn19search9  
While it is presented as an experimental “project”, it is a direct expression of “requirements to plan” inside the developer workflow. citeturn19search9

**Idea → app + design iteration via Replit Agent**  
entity["company","Replit","online IDE company"] positions its Agent as building an app/website from a chat prompt end‑to‑end (“tell it your idea, it will build it”). citeturn19search1  
Replit’s Agent 4 announcement (March 2026) emphasises collapsing design iteration and code into one environment: explore ideas and refine details in a “design board”, then bring outputs into the app and integrate into production code. citeturn19search5

**Design tooling explicitly connecting to coding agents via MCP**  
Figma’s MCP catalog positions its MCP server as adding Figma context to agentic coding tools (Cursor, Codex, Claude Code, etc.) and explicitly aims at “design‑informed code generation.” citeturn22view0  
Linear’s MCP server similarly enables compatible agents to access Linear data securely and take actions (find/create/update issues/projects/comments). citeturn24view0  
Stripe’s MCP server enables agents to call Stripe tools and search documentation/support articles with OAuth‑scoped access. citeturn23view0  

Collectively, these confirm an emerging “AI‑native SDLC substrate”: agents operate along the entire chain only when they have standardised, authenticated access to the same artefacts humans use (design files, issues, repos, APIs). citeturn22view0turn24view0turn23view0

### What’s working

**Well‑scoped, acceptance‑criteria‑rich work items as the “API” for agents.**  
GitLab’s Issue→MR flow explicitly requires clear requirements and acceptance criteria for better output quality. citeturn14view1  
This aligns with Cursor’s guidance that tests/criteria can drive agent execution and iteration, using tests as an objective loop. citeturn19search11turn19search30

**A plan‑first step that enumerates file changes and actions.**  
Copilot Workspace centres a “spec → concrete plan” transition listing touched files and per‑file actions. citeturn19search9  
GitLab’s Issue→MR flow similarly creates a development plan before proposing implementation. citeturn14view1

**Instruction layers / “house rules” that encode team conventions.**  
Linear provides “agent guidance” (Markdown with history) to specify repository conventions, commit/PR references, and review process, explicitly to align agents with existing workflows. citeturn13view2  
Notion lets users personalise agents with instructions, skills, and preferred resources (pages, Slack channels, files). citeturn16view0  
OpenAI’s agent design framing treats “instructions” as one of three core components (model/tools/instructions) and emphasises layered guardrails and evals. citeturn21view0turn21view1turn21view4

### What’s not working (or still immature)

**Tasks beyond an agent’s “reliable complexity envelope”.**  
Devin’s docs draw a boundary (“excluding extremely difficult tasks”) and offer a pragmatic heuristic about what it can likely handle. citeturn19search12  
This implies that AI‑native SDLCs still require deliberate task sizing and decomposition to achieve predictable outcomes. citeturn19search12turn14view1

**Security, tool misuse, and prompt injection remain limiting factors.**  
OpenAI’s guidance treats guardrails and tool safeguards as core design requirements, not optional add‑ons. citeturn21view2turn21view4  
Stripe’s MCP docs explicitly call out prompt injection and recommend human confirmation of tool calls, reinforcing that “agentic SDLC” expands the attack surface when agents can take actions. citeturn23view0  
GitLab’s Issue→MR flow also uses explicit enablement toggles for agentic features, signalling that organisations are gating autonomous actions at the project level. citeturn14view1

**Evidence gap (flagged):** there is limited first‑party documentation showing agents reliably doing *requirements → design exploration → implementation → testing* with high autonomy **without** substantial human review and operational guardrails. The best documented flows (GitLab, Devin, Copilot Workspace) all retain strong human gating at “spec/plan approval” and “PR review/merge”. citeturn14view1turn19search16turn19search9turn21view4

## PRD‑to‑design‑doc handoff and the “what vs how” boundary

### Where teams draw the line in public guidance

A consistent line across sources is:

- **PRD = the “what/why”**: user problem, intended users, scope, success, and release criteria.  
  Notion explicitly says the PRD’s goal is to tell the story of how users will use the product “without getting too far into the technical details”. citeturn2view1  
  Figma similarly says PRDs typically focus on what you’re building rather than how you’ll build it, while still including user flows, risks, and non‑functional constraints as decision support. citeturn4view1

- **Design doc / functional spec / tech spec = the “how”**: architecture, implementation details, and engineering trade‑offs.  
  Figma explicitly differentiates PRDs from functional/tech specs, describing tech specs as explaining exactly how engineers will implement PRD requirements (and noting some teams include functional specifications directly within the PRD). citeturn4view1

In practice, GitLab’s feature proposal template straddles the boundary: it includes “Proposal” plus sections like security, availability/testing, documentation, and metrics—indicating that many organisations blend PRD and design‑doc concerns when the work item is the central unit of execution (issue‑centric development). citeturn8view0turn8view1

### A practical “handoff contract” that fits AI‑native SDLCs

The most robust AI‑native pattern emerging from the documented flows is to treat the PRD as an **input specification for downstream agents** and to make the handoff explicit:

- The PRD (or issue/spec) should contain enough structure for agents to plan and execute: clear requirements + acceptance criteria, scope boundaries, and constraints. GitLab’s Issue→MR flow documents this as a prerequisite for improved output quality. citeturn14view1  
- The design doc should be linked from the PRD and become the artefact that enumerates architecture and implementation trade‑offs; it then feeds code generation and review (human + AI), consistent with GitLab’s “plan + propose implementation” approach and Copilot Workspace’s “spec → plan” model. citeturn14view1turn19search9  
- For teams using design tools as an input to coding agents, the design artefacts themselves are becoming “callable context” via MCP (Figma MCP server), meaning the PRD can link to specific design frames/components and expect agents to retrieve them during implementation. citeturn22view0

**Evidence‑aligned synthesis:** In AI‑native SDLCs, the “what vs how” boundary still exists, but the enforcement mechanism is changing: it is less about document types and more about **which artefact is allowed to drive automated action**. PRDs/issues/specs drive planning and task decomposition; design docs + design artefacts drive implementation choices; acceptance criteria + tests constrain agent execution; and PR review/merge remains the principal human gate. citeturn14view1turn19search11turn19search30turn21view4