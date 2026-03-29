---
title: "Claude Deep Research: Automating an AI-Native SDLC Pipeline on Kubernetes"
summary: "Claude Deep Research report on automating an AI-native SDLC pipeline on Kubernetes. Covers self-clarification protocols, autonomous PRD generation, agent-sandbox CRDs, Temporal orchestration, and a four-milestone implementation plan with code examples."
keywords:
  - deep-research
  - claude
  - autolearn
  - autonomous-sdlc
  - kubernetes
  - poc-pipeline
  - agent-orchestration
  - temporal
  - agent-sandbox
provider: claude
prompt: "I want to build an automated learning system. It should discover trending/new open source tools, investigate them, stand up a PoC, exercise the tech, evaluate it against my adopted stack, and write a wiki page and optionally a blog post about it. It runs in k8s. I currently use a PRD + design doc interview approach for scoping work. Should I keep that, automate the interviewer by adding an interviewee agent, or skip upfront research and just tell Claude to go do it? Also evaluate GetShitDone and similar frameworks. Research the best way to do this and give me an implementation plan."
date_generated: 2026-03-29
related_posts: []
related:
  - wiki/research/autolearn-v1
scope: "Full Claude Deep Research report on autonomous PoC learning pipelines. Covers interviewer pattern validation, autonomous coding agent comparison, orchestration frameworks (Temporal, LangGraph, CrewAI), k8s-native agent infrastructure (agent-sandbox, kagent), single-prompt failure analysis, and four-milestone implementation plan with CRD examples."
last_verified: 2026-03-29
---

# Automating an AI-native SDLC pipeline on Kubernetes

**Your interviewer pattern is the right foundation—but the human interviewer is the bottleneck to eliminate.** Production systems like compound-product already generate PRDs fully autonomously using a "self-clarification protocol" that replaces human Q&A with agent self-interrogation. The research consensus (2025–2026) strongly favors structured planning over single-prompt approaches: FeatureBench data shows **74% success** for scoped bug fixes dropping to just **11%** for complex feature development without structured decomposition. The optimal path forward combines your existing AgentTask CRD with compound-product's autonomous PRD generation, Ralph Loop execution, and the new `kubernetes-sigs/agent-sandbox` CRD for isolated agent workloads—all orchestrated through your Go reconcile loop.

---

## The interviewer pattern is validated but should evolve beyond human dependency

Your PRD/DD interview approach is now the dominant paradigm in AI-assisted development. The **BMAD Method** (19,000+ GitHub stars, MIT licensed, v6.2) codifies exactly this pattern: a PM agent asks 20+ structured questions about assumptions, constraints, personas, data flows, SLAs, NFRs, risks, and test strategy before execution begins. Practitioners report the planning phase takes **4–5 hours by design**, and this investment dramatically reduces execution failures.

The critical question is whether the human interviewee can be replaced. Three production systems already demonstrate this:

**compound-product** (snarktank) implements the most complete autonomous PRD pipeline. Its `prd` skill explicitly instructs the agent *not* to ask clarifying questions. Instead, it runs a **self-clarification protocol**, answering five questions internally from available context: What problem does this solve? What are the 2–3 key actions? What should this NOT do? How do we verify it works? What constraints exist? Context comes from an `analysis.json` generated in a prior analysis phase, plus `AGENTS.md` files containing codebase patterns. Output is a standardized 8-section PRD with numbered tasks and boolean pass/fail acceptance criteria that are autonomously verifiable.

**BMAD Party Mode** enables multiple agent personas (PM, Architect, Product Owner, QA) to collaborate in a single session. The BMad Master orchestrator selects 2–3 relevant agents per exchange, and agents agree, disagree, and build on each other's ideas. While currently human-steered, wrapping Party Mode in an outer orchestration layer (feeding one agent's output as input to the next) creates fully autonomous AI-to-AI planning.

**MetaGPT** implements multi-agent PRD automation with specialized researcher, planner, reviewer, and refiner agents iterating in structured loops. IBM has published tutorials for running this with DeepSeek/Ollama for local inference.

The tradeoff of increasing question count when patience is no constraint is favorable but bounded. BMAD's PO asks 20+ questions; an AI-to-AI system could ask 100+ without fatigue. Practitioner **Kovyrin** reports using the largest available models for PRD creation ("absolutely no reason to save on tokens") and spending 20–30 minutes on voice-dictated context dumps. The risk is diminishing returns—quality is ultimately bounded by available context (codebase, existing docs, domain knowledge), not question count. **The recommended hybrid: AI-to-AI for 90% of planning (technical feasibility, architecture, edge cases, testing), human intervention for product vision, business priorities, and risk tolerance.**

---

## Claude Code remains the best execution agent, but your orchestration layer needs upgrading

### Autonomous coding agents ranked for your use case

**Claude Code** (already in your stack) should remain the primary execution agent. It holds the **highest SWE-bench Verified score at 80.9%** (Opus 4.5), now runs headless via `claude -p` for k8s job execution, has native subagent spawning for parallel work, checkpointing for crash recovery, and Linear MCP integration you're already using. The Agent SDK (Python/TypeScript, released June 2025) provides the same agent loop and tools as the CLI. Agent Teams (Feb 2026) enable multi-agent coordination, and the native `/loop` command (March 2026) absorbs the Ralph pattern directly.

**OpenHands** (formerly OpenDevin, 38,800+ stars, MIT) is the strongest complement to Claude Code. Its event-stream architecture with Docker-based sandboxed runtimes maps naturally to k8s pods. The enterprise edition explicitly supports Kubernetes self-hosting. Its SDK enables programmatic orchestration—ideal for integration with your Go reconcile loop. It's model-agnostic, so it provides a fallback if Anthropic rate limits become a bottleneck. **Use OpenHands for sandboxed PoC deployment testing** where you don't want untrusted code running with full cluster access.

**SWE-agent mini** (~100 lines of Python, bash-only tools) is trivially deployable as k8s job pods. It achieves >74% on SWE-bench Verified and starts much faster than Claude Code. **Use it for lightweight, targeted investigation tasks** where Claude Code's full context window is unnecessary.

**GetShitDone** is not a coding agent—it's a browser distraction blocker extension (getshitdone.one) and an unrelated SME CRM platform (getshdone.ai). Neither is relevant to your pipeline. **Devin** is cloud-only with no self-hosting option, making it unsuitable for k8s-native integration despite its high autonomy. **Factory AI** has strong Terminal-Bench performance (58.8%) and Linear integration but is proprietary with no self-hosting. **Aider** (42,000+ stars) is an excellent pair programmer with git-native workflow but lacks fully autonomous headless operation. **Sweep** is JetBrains-focused and not pipeline-suitable.

### Orchestration frameworks: Temporal wins for your Go stack

**Temporal** is the strongest orchestration fit for your infrastructure. Its **Go SDK is native** to your reconcile loop language. Self-hosted Temporal Server runs on k8s. Workflows survive crashes and can run for days or weeks—critical for multi-hour investigation tasks. Activities wrap Claude Code SDK calls. Signals enable your AgentTask CRD to communicate with running workflows. Temporal Schedules handle cron-based trending tool discovery. Production-proven at NVIDIA and Uber scale.

**LangGraph** (v1.0, late 2025) is the best AI-specific orchestration framework. Its graph-based state machines with conditional edges map perfectly to your pipeline's branching logic (skip PoC if tool is irrelevant). Built-in checkpointing with "time travel" state replay, durable execution, and LangSmith observability make it production-hardened. **27,100 monthly searches**—the dominant framework. The tradeoff: it's Python-native, requiring a Python sidecar or bridge in your Go-based stack.

**CrewAI** offers the lowest barrier to entry for prototyping role-based agent teams (Discoverer → Investigator → Builder → Evaluator → Writer). YAML-driven agent definitions. Good for validating the pipeline concept quickly, but teams commonly migrate to LangGraph for production. **AutoGen** is in maintenance mode—avoid for new development.

### Kubernetes-native agent infrastructure you should adopt

Two projects directly complement your AgentTask CRD:

**kubernetes-sigs/agent-sandbox** (official K8s SIG Apps project, v0.1.0, March 2026) introduces Sandbox CRDs purpose-built for AI agent workloads. Unlike Deployments or StatefulSets, Sandboxes are singleton, stateful pods with persistent identity, storage that survives restarts, gVisor/Kata isolation for untrusted LLM-generated code, and scale-to-zero hibernation. `SandboxTemplate` defines reusable agent archetypes, `SandboxClaim` enables programmatic allocation, and `SandboxWarmPool` keeps pre-warmed pods ready for fast startup. **This replaces your need to manually configure pods for agent workloads.**

**kagent** (CNCF Sandbox, Solo.io) provides a Kubernetes-native agent framework with CRD-defined agents, MCP tool integration (kubectl, Prometheus, Helm, Argo, Grafana), and OpenTelemetry tracing. Pre-built agents include k8s-agent, helm-agent, and argo-rollouts-agent. **Use kagent for the validation/review layer** of your pipeline—agents that verify generated manifests, check metrics, and validate deployments.

---

## Single-prompt autonomy fails at your pipeline's complexity level

The "just give it a high-level goal" approach will not work reliably for your pipeline. The evidence is overwhelming and quantitative.

**FeatureBench** (February 2026) provides the definitive benchmark: Claude Opus 4.5 achieves 74.4% on SWE-bench (scoped single-PR bug fixes) but only **11.0% on complex feature development**. That's a **7x success rate collapse** as task complexity increases. Your pipeline—investigate, deploy PoC, evaluate, document—is closer to feature development than bug fixing.

**Meta-Task Planning research** shows structured hierarchical planning achieves **42.68%** on the TravelPlanner benchmark versus **2.92%** for unstructured approaches—a **14x improvement** from planning alone. Google DeepMind's "Towards a Science of Scaling Agent Systems" (December 2025) found that adding agents without deliberate coordination topology leads to *worse* performance, with accuracy saturating after ~4 agents without proper structure.

Documented Claude Code failure modes at high complexity include **premature task completion** (generates a plan, executes first phases, then stops and summarizes as if done), **progress reversion** on 50–60+ step tasks (drops back to previous prompt), and **context degradation** where earliest information is lost once the context window exceeds half capacity. Andrej Karpathy notes: "The models make wrong assumptions on your behalf and run with them without checking. They don't manage confusion, don't seek clarifications, don't surface inconsistencies."

Anthropic's own data shows the deployment overhang: while Claude Opus 4.5 can theoretically handle tasks taking a human ~5 hours, the longest practical Claude Code turns are ~42 minutes. Average human interventions per session decreased from **5.4 to 3.3** between August and December 2025—improving but far from zero. Experienced users (750+ sessions) interrupt more often than novices (9% vs 5% of turns), suggesting expertise leads to more active monitoring, not less.

**The sweet spot is Level 3 autonomy**: the agent plans and executes autonomously within defined scope, with human oversight at key phase transitions. For your pipeline specifically: provide structured phase boundaries and success criteria (not a full PRD, but clear gates), use Claude Code's Plan Mode for investigation (read-only), break execution into explicit phases with review points, and keep tasks to 3–5 steps max per phase.

---

## Implementation plan: four milestones to full automation

### Milestone 1: Autonomous PRD generation (weeks 1–3)

**Goal**: Replace human interviewer with compound-product self-clarification protocol.

```
AgentTask CRD additions:
  spec:
    phase: planning | execution | evaluation | documentation
    prdSource: ""          # empty = generate autonomously
    goalStatement: "..."   # one-sentence product intent
    contextRefs:           # existing docs, AGENTS.md paths
    - path: docs/stack-overview.md
    - path: AGENTS.md
    maxPlanningIterations: 5
    costLimit: "$10.00"
```

- Fork compound-product's `prd` skill, adapt self-clarification questions to your domain (k8s PoC evaluation, stack compatibility assessment, documentation requirements)
- Extend the 5-question protocol to **15–20 domain-specific questions** covering: What does this tool replace in the current stack? What k8s resources does it need? What are the security implications? How does it integrate with ArgoCD? What metrics define success?
- Wire into Go reconcile loop: when `AgentTask.spec.phase == planning` and `prdSource` is empty, spawn a Claude Code headless session with the self-clarification prompt
- Output: `prd.json` committed to feature branch in monorepo
- Gate: Human approval of PRD via Linear ticket (MCP integration) before phase transition

**Key files to create in `github.com/kylep/multi`**:

- `agents/planning/self-clarify-prompt.md` — domain-specific self-clarification template
- `agents/planning/prd-template.md` — standardized PRD format with k8s-specific sections
- `internal/controller/phases/planning.go` — planning phase reconcile logic

### Milestone 2: Sandboxed execution with Ralph Loop (weeks 4–6)

**Goal**: Implement isolated agent execution using agent-sandbox CRDs and Ralph pattern.

```yaml
# Agent execution sandbox
apiVersion: agents.x-k8s.io/v1alpha1
kind: Sandbox
metadata:
  name: poc-evaluator-{{ .task.name }}
spec:
  runtimeClassName: gvisor
  containers:
  - name: claude-agent
    image: ghcr.io/kylep/multi/agent-runner:latest
    env:
    - name: ANTHROPIC_API_KEY
      valueFrom:
        secretKeyRef:
          name: anthropic-credentials
          key: api-key
    - name: PRD_PATH
      value: /workspace/prd.json
    volumeMounts:
    - name: workspace
      mountPath: /workspace
  storage:
    size: 20Gi
```

- Install `kubernetes-sigs/agent-sandbox` CRDs on your k3s cluster
- Build `agent-runner` container image containing Claude Code CLI + Ralph loop script + git configuration
- Go reconcile loop creates Sandbox when `AgentTask.spec.phase == execution`
- Ralph loop inside Sandbox reads `prd.json`, implements tasks, commits to feature branch
- Configure circuit breaker: 3 identical failures → pause and escalate
- Configure cost controls: `--max-cost` per task, `--timeout 45m` per iteration
- Monitor `prd.json` task completion status from reconcile loop; when all tasks pass → phase transition

**Key files**:

- `deploy/agent-sandbox/` — Helm chart for agent-sandbox operator
- `images/agent-runner/Dockerfile` — Claude Code + Ralph + git-sync
- `images/agent-runner/ralph-config.json` — loop configuration
- `internal/controller/phases/execution.go` — execution phase reconcile logic
- `internal/controller/sandbox.go` — Sandbox CRD lifecycle management

### Milestone 3: Automated evaluation and documentation (weeks 7–9)

**Goal**: Agent evaluates PoC against existing stack and generates wiki/blog documentation.

Evaluation phase uses a structured rubric committed as a ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: evaluation-rubric
data:
  rubric.yaml: |
    criteria:
      - name: k8s_native
        weight: 0.25
        question: "Does it deploy as native k8s resources manageable by ArgoCD?"
      - name: stack_overlap
        weight: 0.20
        question: "Does it replace or conflict with existing stack components?"
      - name: operational_complexity
        weight: 0.20
        question: "What is the operational burden (resource usage, maintenance)?"
      - name: value_add
        weight: 0.20
        question: "What capability does it add that the current stack lacks?"
      - name: community_health
        weight: 0.15
        question: "Is the project actively maintained with healthy community?"
    pass_threshold: 0.6
```

- Evaluation agent runs in a separate Sandbox with read-only cluster access
- Uses Claude Code Plan Mode to analyze the deployed PoC against the rubric
- Outputs structured `evaluation.json` with scores, rationale, and recommendation
- Documentation agent generates markdown for blog (`apps/blog/`) and wiki
- Uses the PRD, evaluation results, and implementation artifacts as source context
- ArgoCD detects new blog content, deploys to `kyle.pericak.com` via Cloudflare Tunnel

**Key files**:

- `agents/evaluation/rubric.yaml` — evaluation criteria template
- `agents/evaluation/eval-prompt.md` — evaluation agent instructions
- `agents/documentation/blog-template.md` — blog post structure
- `internal/controller/phases/evaluation.go` — evaluation phase logic
- `internal/controller/phases/documentation.go` — documentation phase logic

### Milestone 4: Trending tool discovery and full pipeline integration (weeks 10–12)

**Goal**: Close the loop with automated discovery feeding the pipeline.

Discovery agent runs on a Temporal Schedule (daily or weekly):

```go
// Temporal workflow definition
func DiscoverTrendingTools(ctx workflow.Context) error {
    // Activity 1: Search GitHub trending, HN, Reddit, CNCF landscape
    var discoveries []ToolCandidate
    workflow.ExecuteActivity(ctx, SearchTrendingSources, opts).Get(ctx, &discoveries)

    // Activity 2: Filter against existing stack (deduplicate, relevance check)
    var candidates []ToolCandidate
    workflow.ExecuteActivity(ctx, FilterCandidates, discoveries, opts).Get(ctx, &candidates)

    // Activity 3: Create AgentTask CRDs for top candidates
    for _, candidate := range candidates[:3] { // max 3 per cycle
        workflow.ExecuteActivity(ctx, CreateAgentTask, candidate, opts)
    }
    return nil
}
```

- Install Temporal Server on k3s (Helm chart: `temporalio/temporal`)
- Discovery workflow uses Claude Code web search to find trending tools matching criteria (k8s-compatible, infrastructure-relevant, >100 GitHub stars, active in last 90 days)
- Filtering activity checks against existing stack components to avoid redundancy
- Creates AgentTask CRDs that trigger the full pipeline: plan → execute → evaluate → document
- Linear MCP integration creates tracking tickets for each pipeline run
- Configure `SandboxWarmPool` with 2 pre-warmed pods for fast pipeline startup

**Key files**:

- `internal/temporal/workflows/discover.go` — discovery workflow
- `internal/temporal/activities/search.go` — trending source search
- `internal/temporal/activities/filter.go` — candidate filtering
- `deploy/temporal/` — Helm values for Temporal Server
- `internal/controller/phases/discovery.go` — discovery phase reconcile logic

### Architecture summary

```
┌──────────────────────────────────────────────────────────┐
│  Temporal Schedule (daily)                                │
│  → Discovery Workflow                                     │
│    → Search GitHub trending, HN, CNCF landscape           │
│    → Filter against existing stack                        │
│    → Create AgentTask CRDs (max 3/cycle)                  │
└──────────────┬───────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────┐
│  Go Reconcile Loop (watches AgentTask CRDs)               │
│                                                           │
│  Phase 1: PLANNING                                        │
│  → Spawn Claude Code headless in Sandbox                  │
│  → Self-clarification protocol → PRD + prd.json           │
│  → Human approval gate via Linear MCP                     │
│                                                           │
│  Phase 2: EXECUTION                                       │
│  → Create agent-sandbox Sandbox (gVisor isolated)         │
│  → Ralph Loop: iterate prd.json tasks                     │
│  → Circuit breaker + cost controls                        │
│  → Git commit to feature branch                           │
│                                                           │
│  Phase 3: EVALUATION                                      │
│  → Read-only Sandbox runs evaluation rubric               │
│  → Structured scoring against existing stack              │
│  → Pass/fail gate (threshold: 0.6)                        │
│                                                           │
│  Phase 4: DOCUMENTATION                                   │
│  → Generate blog post + wiki entry                        │
│  → Commit to apps/blog/ in monorepo                       │
│  → ArgoCD syncs → Cloudflare Tunnel → published           │
│                                                           │
│  Phase 5: CLEANUP                                         │
│  → Scale Sandbox to 0 (hibernate)                         │
│  → Update Linear ticket with results                      │
│  → Archive evaluation artifacts                           │
└──────────────────────────────────────────────────────────┘
```

---

## Critical decisions and risk mitigations

**Start with a human-in-the-loop gate after Phase 1.** The research is unambiguous: fully autonomous end-to-end execution has an **88% project failure rate** in enterprise contexts. Begin with human PRD approval, then progressively relax gates as you build confidence in the self-clarification protocol's output quality. Track a metric: "PRD approval rate without modification" — when it exceeds 80% over 20+ runs, remove the gate.

**Use gVisor isolation for all execution Sandboxes.** Your pipeline evaluates untrusted open-source tools and generates code to deploy them. The `agent-sandbox` CRD's `runtimeClassName: gvisor` provides kernel-level isolation without the overhead of full VMs. This is non-negotiable for a pipeline that autonomously deploys unknown software to your cluster.

**Budget API costs aggressively.** Gas Town-scale multi-agent runs cost **$50–100+/hour**. Your pipeline should enforce per-task cost limits (`--max-cost $10` for planning, `$25` for execution, `$5` for evaluation/documentation). Temporal's activity timeout enforcement provides a hard backstop. Track cost-per-evaluation as a key metric.

**Monitor the compound-product and agent-sandbox maturity.** compound-product was last indexed January 2026—verify active maintenance before production adoption. agent-sandbox is v0.1.0 alpha. Both are directionally correct but may require patching. The BMAD Method (v6.2, actively maintained, 19k stars) is the safest bet for the planning layer if compound-product stalls.

**The Ralph Loop's coercive exit-prevention language has raised concerns** (Claude Code Issue #23084 regarding "model welfare"). Anthropic's native `/loop` command (shipped March 2026) absorbs the core Ralph pattern with official support. Evaluate whether `/loop` is sufficient before adding the full ralph-claude-code wrapper—it reduces your dependency surface and aligns with Anthropic's evolving agent autonomy policies.

---

## Conclusion: what the research actually says about your pipeline

The most important finding across all four research questions is that **architecture matters more than model choice**. The same model scores 17 problems apart on different agent scaffoldings. Your instinct to build structured planning infrastructure (AgentTask CRD, interview patterns, phased execution) is validated by every production system and research paper examined. The teams succeeding with autonomous agents spend **70% of effort on problem definition and verification strategy, 30% on execution**—your PRD/DD pattern encodes exactly this ratio.

The gap to close is not "more autonomy" but "smarter autonomy." Compound-product's self-clarification protocol, agent-sandbox's lifecycle management, and Temporal's durable workflows give you the building blocks to eliminate human bottlenecks at each phase boundary—selectively, measurably, and reversibly. The pipeline you've described (discover → investigate → PoC → evaluate → document) is achievable with today's tooling. The key is phased rollout with progressive autonomy gates, not a single leap to full automation.
