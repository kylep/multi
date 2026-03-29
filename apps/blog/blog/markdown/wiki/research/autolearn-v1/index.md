---
title: "Autolearn v1: Autonomous PoC Learning System"
summary: "Three Deep Research reports on architecting an autonomous AI-native SDLC pipeline for continuous PoC learning on Kubernetes, generated from the same prompt across ChatGPT, Gemini, and Claude."
keywords:
  - deep-research
  - autolearn
  - autonomous-sdlc
  - kubernetes
  - poc-pipeline
  - agent-orchestration
  - prd
  - design-doc
related:
  - wiki/research
scope: "Subject index for autolearn v1 research. Links to three provider reports."
last_verified: 2026-03-29
---

Three Deep Research reports on architecting an autonomous AI-native
SDLC pipeline for continuous PoC learning on Kubernetes. Covers
structured planning vs zero-research approaches, automated
requirements elicitation, agent sandboxing, orchestration frameworks,
and implementation roadmaps.

## Prompt

> I want to build an automated learning system. It should discover
> trending/new open source tools, investigate them, stand up a PoC,
> exercise the tech, evaluate it against my adopted stack, and write
> a wiki page and optionally a blog post about it. It runs in k8s.
> I currently use a PRD + design doc interview approach for scoping
> work. Should I keep that, automate the interviewer by adding an
> "interviewee" agent, or skip upfront research and just tell Claude
> to go do it? Also evaluate GetShitDone and similar frameworks.
> Research the best way to do this and give me an implementation plan.

## Reports

- [ChatGPT Deep Research](/wiki/research/autolearn-v1/chatgpt.html) —
  Two-layer investigation factory with rubric-driven artefacts,
  stack contract, and phased k8s execution. March 2026.
- [Claude Deep Research](/wiki/research/autolearn-v1/claude.html) —
  Self-clarification protocol, agent-sandbox CRDs, Temporal
  orchestration, and four-milestone implementation plan. March 2026.
- [Gemini Deep Research](/wiki/research/autolearn-v1/gemini.html) —
  GSD wave-based execution, ARC contract enforcement, SIG Apps
  sandbox, and simulated interviewee pattern. March 2026.

---

## Cross-Source Synthesis

Compare and contrast of findings across all three reports. No outside
opinions added. Every point below is derived directly from the source
material.

### Shared Findings (present in 2+ sources)

- **Structured planning dramatically outperforms single-prompt approaches** — all three reports cite benchmark data showing agents fail at complex multi-step tasks without decomposition. ChatGPT cites SWE-Bench Pro showing under 25% pass@1 without scaffolding. Claude cites FeatureBench showing a 7x success rate collapse (74% to 11%) as complexity increases. Gemini cites ProjDevBench and SWE-EVO showing agents fail at system architecture without roadmaps. (all 3)
- **Keep the PRD/DD interview pattern but evolve it for autonomy** — all three agree the existing interview-first approach is validated and should not be discarded, but the human interviewer is the bottleneck to remove. ChatGPT recommends keeping PRD/DD for "build a thing" work while adding a parallel rubric-driven artefact chain for tool evaluations. Claude says the interview pattern is the "dominant paradigm" but the human must be replaced. Gemini frames the human as the bottleneck in the current stack. (all 3)
- **Replace the human interviewee with a grounded retrieval agent, not a free-form LLM** — all three warn that having an LLM freely answer interview questions reintroduces the "plausible, polished, and wrong" risk. ChatGPT prescribes a retrieval-and-policy agent that answers only from repo context and a stack contract, emitting "unknown" when evidence is absent. Claude recommends a self-clarification protocol where the agent answers from available context (analysis.json, AGENTS.md). Gemini proposes a User Proxy agent pre-loaded with bot-wiki and FAISS RAG data. (all 3)
- **Agent-to-agent interviews can exceed human patience limits** — ChatGPT notes extra questions should be conditional (ask only when answers are missing or low-confidence). Claude cites BMAD's 20+ questions and says AI-to-AI could ask 100+ without fatigue, but quality is bounded by available context. Gemini says agent-to-agent interviews can execute 50+ iterations to map out API contracts and edge cases. (all 3)
- **Deterministic orchestration with bounded agent execution** — all three recommend a two-layer model: deterministic phase transitions and state management on the outside, bounded agent execution on the inside. ChatGPT explicitly names the McKinsey/QuantumBlack two-layer model. Claude calls for deterministic phase boundaries with 3-5 steps max per phase. Gemini describes GSD wave-based execution with fresh context per task. (all 3)
- **Use kubernetes-sigs/agent-sandbox CRDs for isolated agent workloads** — all three recommend the SIG Apps agent-sandbox project (v0.1.0, March 2026) for stateful, singleton, isolated pods with persistent storage, gVisor/Kata isolation, and scale-to-zero hibernation. Claude and Gemini both detail SandboxTemplate, SandboxClaim, and SandboxWarmPool sub-resources. (all 3)
- **gVisor or Kata Containers for kernel-level isolation** — all three identify this as necessary for running untrusted LLM-generated code and third-party tools. Claude calls gVisor isolation "non-negotiable." Gemini details how gVisor intercepts syscalls in user space while Kata runs each pod in a lightweight VM. ChatGPT references security scanning (semgrep/trivy/gitleaks) as complementary deterministic checks. (all 3)
- **SandboxWarmPool to eliminate cold-start latency** — Claude recommends configuring 2 pre-warmed pods for fast pipeline startup. Gemini describes how warm pools hand over pre-provisioned environments in milliseconds via SandboxClaim. (Claude, Gemini)
- **The Ralph pattern for iterative task execution** — all three reference the Ralph loop as a mechanism for context management: executing prd.json stories one at a time with fresh context windows. ChatGPT treats it as a reference for atomic commits per task. Claude recommends it for the execution phase inside sandboxes. Gemini details its three persistence layers (git history, progress.txt, prd.json). (all 3)
- **Context rot is a primary failure mode for long-running agent sessions** — ChatGPT cites "context rot" as what spec-driven harnesses mitigate by splitting work into smaller checkable plans. Claude documents premature task completion, progress reversion on 50-60+ step tasks, and context degradation past half-capacity. Gemini describes "stochastic divergence" or "spaghetti mode" after thirty-minute horizons. (all 3)
- **Structured artefacts as external memory** — all three recommend externalizing state into versioned files rather than relying on model context. ChatGPT recommends state files (STATE.md) for resumability. Claude uses prd.json with task completion tracking. Gemini describes a three-tier memory model: short-term (context window), mid-term (progress.txt/AGENTS.md), long-term (FAISS/git history). (all 3)
- **Automated evaluation rubric for stack-fit assessment** — all three propose structured rubrics for evaluating tools against the existing stack. ChatGPT lists stack fit, operational fit, security posture, maintenance signals, and learning value. Claude provides a weighted YAML rubric with k8s-native, stack overlap, operational complexity, value-add, and community health criteria with a 0.6 pass threshold. Gemini lists deployment complexity, resource efficiency, security posture, and integration surface with specific measurement tools and targets. (all 3)
- **Wiki decision records as mandatory output** — all three require a structured wiki page for every completed investigation, making results searchable and comparable across tools. ChatGPT calls it a "Wiki Decision Record." Claude generates markdown for both blog and wiki. Gemini creates a synthesized wiki format fed back into FAISS. (all 3)
- **Blog post gated on interestingness threshold** — all three treat blog posts as optional, conditional on the evaluation meeting some bar. ChatGPT gates on novelty, trade-offs, and unexpected operational lessons. Claude gates on evaluation results and the existing Publisher pipeline. Gemini uses LLM-as-a-judge to evaluate "interest" level. (all 3)
- **Reuse the existing deterministic wrapper pattern (journalist CronJob)** — ChatGPT and Claude both explicitly reference the existing journalist CronJob as a reference implementation of the two-layer model: secrets injection, token creation, repo clone, tool allowlist, agent execution, push/PR/notify. (ChatGPT, Claude)
- **Phased tool allowlists** — ChatGPT and Claude recommend restricting which tools agents can use per pipeline phase (research phase gets WebSearch/WebFetch; PoC phase gets builds/tests; write-up phase gets wiki file writes). (ChatGPT, Claude)
- **Commit-per-task or commit-per-phase for debuggability** — ChatGPT explicitly recommends atomic commits per task as a GSD pattern. Claude commits to feature branch per phase. Gemini references parallel research with atomic commits. (all 3)
- **Feedback/learning loop that updates templates from failures** — ChatGPT recommends a Reflexion-style "learn from feedback" loop where failed runs update the Stack Contract or templates. Claude tracks "PRD approval rate without modification" to progressively relax human gates. Gemini describes a RAG feedback loop where completed PoCs update the bot-wiki for future elicitation. (all 3)
- **Metrics should focus on factory throughput and reliability, not agent cleverness** — ChatGPT proposes throughput (investigations/week, time to PR), quality (verifier pass rate, sourced claims), stability (failure class distribution), and autonomy (fraction needing human intervention). Claude tracks cost-per-evaluation and PRD approval rate. Gemini recommends the "Fix Rate" metric capturing partial progress. (ChatGPT, Claude, Gemini)
- **GetShitDone (GSD) is a useful reference design, not a wholesale replacement** — ChatGPT recommends selectively stealing GSD patterns (codebase mapping, discuss phase, state files, commit-per-task) rather than switching. Gemini provides detailed analysis of GSD wave-based execution and its discuss/plan/execute/verify cycle. Both treat it as input to a custom system. (ChatGPT, Gemini)
- **Human-in-the-loop gate at planning phase initially, relaxed progressively** — ChatGPT recommends starting with human review of artefacts and relaxing as confidence builds. Claude explicitly recommends human PRD approval initially, removing the gate when approval-without-modification exceeds 80% over 20+ runs. (ChatGPT, Claude)
- **Cost controls and iteration caps to prevent runaway spending** — Claude recommends per-task cost limits ($10 planning, $25 execution, $5 evaluation) and notes multi-agent runs can cost $50-100+/hour. ChatGPT recommends iteration caps to avoid infinite loops. Gemini references GSD rules for auto-fixing bugs but stopping and checkpointing for architectural changes. (all 3)

### Unique Findings (from one source only)

#### ChatGPT only
- **Tool Triage Brief as a lightweight alternative to PRD for investigations** — proposes a five-artefact chain (Triage Brief, Evaluation Plan, PoC Execution, Wiki Decision Record, Optional Blog Draft) specifically designed for tool evaluation, replacing the heavier PRD/DD for this class of work
- **Stack Contract as a single canonical machine-readable document** — a stable file encoding languages, build tools, security rules, deployment constraints, observability expectations, and default preferences, serving as the authoritative source for investigation agents
- **Assumption logging as structured artefacts** — each assumption gets a confidence level and verification plan; downstream steps must either prove the assumption during PoC or escalate for human review
- **Argo Workflows or Tekton as DAG workflow engines** — names these two k8s-native CRD-based workflow engines for multi-step investigations when native parallelism, retries, and step dependencies are needed
- **Failure class taxonomy for structured postmortems** — categorizes failures as auth, environment, build, or tool mismatch, with reproduction steps, mitigation, and whether templates need updating
- **Stability metric: failure class distribution should shift over time** — environment/auth failures should decrease as the wrapper hardens, leaving only genuinely hard "tool mismatch" failures

#### Claude only
- **compound-product self-clarification protocol** — specifically recommends forking compound-product's `prd` skill, which answers five internal questions (problem, key actions, scope exclusions, verification, constraints) from analysis.json and AGENTS.md context, then extending to 15-20 domain-specific questions
- **BMAD Method (19k stars, v6.2)** — identifies this as the codification of the interview pattern with 20+ structured questions across assumptions, constraints, personas, data flows, SLAs, NFRs, risks, and test strategy; recommends it as fallback if compound-product stalls
- **BMAD Party Mode for multi-persona collaboration** — PM, Architect, Product Owner, and QA agents collaborate in a single session, agreeing and disagreeing with each other
- **MetaGPT for multi-agent PRD automation** — specialized researcher, planner, reviewer, and refiner agents iterating in structured loops, with IBM tutorials for DeepSeek/Ollama local inference
- **Temporal as the recommended orchestration framework** — Go SDK native to the existing reconcile loop, durable workflows surviving crashes, activity-based Claude Code SDK integration, and Temporal Schedules for cron-based discovery
- **LangGraph as the best AI-specific orchestration framework** — graph-based state machines with conditional edges, checkpointing with time-travel replay, but Python-native requiring a bridge to Go stack
- **CrewAI for rapid prototyping** — lowest barrier to entry with YAML-driven agent definitions, but teams commonly migrate to LangGraph for production
- **AutoGen in maintenance mode** — explicitly advises avoiding for new development
- **kagent (CNCF Sandbox, Solo.io)** — k8s-native agent framework with CRD-defined agents, MCP tool integration (kubectl, Prometheus, Helm, Argo, Grafana), and OpenTelemetry tracing; recommended for the validation/review layer
- **OpenHands as complement to Claude Code** — Docker-based sandboxed runtimes mapping to k8s pods, model-agnostic fallback for rate limits, recommended for sandboxed PoC deployment testing with untrusted code
- **SWE-agent mini for lightweight tasks** — ~100 lines of Python, >74% on SWE-bench Verified, faster startup than Claude Code, suitable for targeted investigation tasks
- **Claude Code /loop command (March 2026) absorbs the Ralph pattern** — recommends evaluating /loop before adding the full ralph-claude-code wrapper to reduce dependency surface
- **Ralph Loop model welfare concerns** — Claude Code Issue #23084 raised concerns about coercive exit-prevention language in Ralph; Anthropic's /loop is the official alternative
- **FeatureBench 7x collapse metric** — 74.4% on SWE-bench dropping to 11.0% on complex feature development, cited as the definitive benchmark for why single-prompt fails
- **Meta-Task Planning 14x improvement** — 42.68% vs 2.92% on TravelPlanner benchmark from structured planning alone
- **Google DeepMind finding on agent scaling** — adding agents without deliberate coordination topology leads to worse performance, accuracy saturating after ~4 agents
- **Claude Code specific failure modes** — premature task completion, progress reversion on 50-60+ step tasks, context degradation past half context window capacity
- **Anthropic deployment overhang data** — longest practical Claude Code turns are ~42 minutes; human interventions decreased from 5.4 to 3.3 per session; experienced users interrupt more often than novices
- **Level 3 autonomy as the sweet spot** — agent plans and executes within defined scope with human oversight at key phase transitions, 3-5 steps max per phase
- **Architecture matters more than model choice** — the same model scores 17 problems apart on different scaffoldings; teams succeeding with autonomous agents spend 70% of effort on problem definition and verification, 30% on execution
- **88% enterprise failure rate for fully autonomous end-to-end execution** — cited as reason to start with human-in-the-loop and progressively relax
- **Cost benchmarks: $50-100+/hour for multi-agent runs** — recommends per-task cost limits ($10 planning, $25 execution, $5 evaluation/documentation) with Temporal activity timeouts as hard backstop
- **Go reconcile loop as the controller** — recommends extending the existing AgentTask CRD with phase, prdSource, goalStatement, contextRefs, maxPlanningIterations, and costLimit fields

#### Gemini only
- **GSD wave-based execution architecture** — plans grouped into dependency waves; Wave 1 runs parallel research agents (tech stack, architecture, security), then a synthesizer creates a summary informing the next execution wave; maps naturally to k8s pod parallelism
- **ARC Protocol contract enforcement** — a dedicated linter audits subagent output against .arc/CONTRACTS.md; rejects code that doesn't match schema or architectural standards; prevents "vibecoded" technical debt
- **Simulated Interviewee pattern with Lead Interviewer and User Proxy** — distinct from self-clarification; two separate agent roles where the Lead Interviewer uses iterative questioning and the User Proxy responds from bot-wiki and FAISS RAG context, with a third Spec Synthesizer agent generating PRD/DD from the transcript
- **Defensive prompting for elicitation** — explicit failure handling, JSON schema output templates, domain-specific constraints, and MUST/SHOULD/COULD requirement classification
- **Nyquist Validation pattern from GSD** — identifying test infrastructure required to verify each requirement before implementation begins, ensuring the PoC is verifiable
- **Adversarial "Devil's Advocate" agent** — a separate agent that attempts to find failures in the PoC, creating a dueling workflow that improves evaluation robustness
- **Smart model routing for cost optimization** — using different models by task complexity (Haiku for research, Sonnet for execution, Opus for architecture) to save 30-50% on token costs, referencing OMC (oh-my-claudecode)
- **Context compaction and persistent notepad/ledger** — referencing Continuous Claude v3's externalized state that survives context compactions
- **Three-tier memory model** — short-term (context window), mid-term (progress.txt/AGENTS.md per PoC), long-term (FAISS bot-wiki/git history)
- **SWE-EVO benchmark for measuring long-horizon autonomy** — GPT-5 achieves 65% on SWE-Bench Verified but only 21% on SWE-EVO, a 44-point gap representing the long-horizon challenge
- **Fix Rate metric** — captures partial progress on complex tasks, showing how much of the original PRD was successfully implemented and where the agent struggled
- **Causal dependency chain for infrastructure autonomy** — Isolation enables Risk Tolerance, Elicitation enables Architectural Integrity, Backpressure enables Reliability, RAG enables System Evolution
- **Recursive agent pattern** — orchestrator spawns executor which spawns research subagent, using Claude Code SubagentStart/SubagentStop hooks for dynamic sandbox provisioning and cleanup
- **Visual verification via image context** — using Claude Code's visual analysis to document PoC UI or architecture diagrams, adding multi-modal evaluation for frontend tools
- **Milestone ordering: infrastructure-first** — prioritizes secure execution foundation (sandbox + gVisor) as Milestone 1 before any agent coordination work

### Contradictions (points where sources disagree)

- **What GetShitDone actually is** — Claude states that "GetShitDone is not a coding agent" and identifies it as a browser distraction blocker extension (getshitdone.one) and an unrelated SME CRM platform, calling it irrelevant to the pipeline. ChatGPT and Gemini both treat GSD as a legitimate spec-driven development framework with multi-phase workflows, wave-based execution, codebase mapping, and state management. ChatGPT recommends selectively adopting its patterns; Gemini provides detailed analysis of its architecture and workflow stages.
- **Orchestration framework recommendation** — Claude strongly recommends Temporal (Go-native SDK, durable workflows, production-proven at NVIDIA/Uber scale) as the primary orchestration framework, with LangGraph as a secondary option. ChatGPT mentions Argo Workflows and Tekton as k8s-native DAG engines but does not strongly advocate for any specific framework. Gemini does not recommend a specific orchestration framework, instead proposing GSD wave-based patterns and ARC Protocol as the coordination model.
- **Implementation milestone ordering** — Claude starts with autonomous PRD generation (Milestone 1), then sandboxed execution (Milestone 2), evaluation/documentation (Milestone 3), and discovery last (Milestone 4). Gemini starts with secure execution foundation/sandbox infrastructure (Milestone 1), then automated requirements (Milestone 2), wave-based execution (Milestone 3), and synthesis/documentation last (Milestone 4). ChatGPT starts with artefact templates and stack contract (Milestone 1), then investigator/verifier agents (Milestone 2), k8s execution wrapper (Milestone 3), PoC sandboxing (Milestone 4), wiki/blog output (Milestone 5), and learning system (Milestone 6). The disagreement is whether to build planning, infrastructure, or artefact definitions first.
- **PRD/DD usage for tool evaluations** — ChatGPT explicitly recommends NOT using PRD/DD as the primary artefact for automated PoC investigations, proposing a lighter "Tool Triage Brief" artefact chain instead, arguing PRD is heavier than needed for evaluation work. Claude and Gemini retain the PRD as the central planning artefact (prd.json) that drives the entire execution pipeline, adapting it rather than replacing it.
- **Interviewee architecture** — Claude recommends a self-clarification protocol where a single agent answers its own questions internally from available context (no separate interviewee agent). Gemini recommends a multi-agent simulated interviewee with distinct Lead Interviewer, User Proxy, and Spec Synthesizer roles. ChatGPT describes a retrieval-and-policy agent variant but frames it as a constrained interviewee rather than self-clarification.
- **Number of implementation milestones and timeline** — ChatGPT proposes 6 milestones with no explicit timeline. Claude proposes 4 milestones over 12 weeks (3 weeks each). Gemini proposes 4 milestones with no explicit timeline. The scope and granularity of what constitutes a milestone differs substantially across all three.
- **Evaluation rubric specificity** — Claude provides a weighted numerical rubric with specific weights (k8s-native 0.25, stack overlap 0.20, etc.) and a pass threshold of 0.6. Gemini provides specific measurement tools and targets (k6 for latency < 100ms p99, Trivy for zero critical/high vulns). ChatGPT describes rubric categories without numerical weights or specific thresholds, keeping it more qualitative.
