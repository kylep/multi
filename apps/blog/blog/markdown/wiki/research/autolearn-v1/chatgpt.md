---
title: "ChatGPT Deep Research: Automating an AI-Native SDLC for Continuous PoC Learning in Kubernetes"
summary: "ChatGPT Deep Research report on architecting an autonomous PoC learning pipeline on Kubernetes. Covers structured planning validation, stack contracts, investigation artefact chains, deterministic k8s orchestration, and a phased implementation plan."
keywords:
  - deep-research
  - chatgpt
  - autolearn
  - autonomous-sdlc
  - kubernetes
  - poc-pipeline
  - agent-orchestration
  - stack-contract
provider: chatgpt
prompt: "I want to build an automated learning system. It should discover trending/new open source tools, investigate them, stand up a PoC, exercise the tech, evaluate it against my adopted stack, and write a wiki page and optionally a blog post about it. It runs in k8s. I currently use a PRD + design doc interview approach for scoping work. Should I keep that, automate the interviewer by adding an interviewee agent, or skip upfront research and just tell Claude to go do it? Also evaluate GetShitDone and similar frameworks. Research the best way to do this and give me an implementation plan."
date_generated: 2026-03-29
related_posts: []
related:
  - wiki/research/autolearn-v1
scope: "Full ChatGPT Deep Research report on autonomous PoC learning pipelines. Covers current stack analysis, research on autonomy/specs/orchestration, options analysis (PRD/DD, synthetic interviewee, goal-only, GSD), recommended operating model, implementation milestones, failure modes, and guardrails."
last_verified: 2026-03-29
---

# Automating an AI-Native SDLC for Continuous PoC Learning in Kubernetes

## Current state of your stack and what it already gets right

Your current PRD → design doc → implementation pipeline is explicitly built to counter the most common "agent failure mode": filling ambiguity with plausible assumptions instead of asking clarifying questions. In your write-up, you call out that agents "don't ask clarifying questions" and that the risk is "convincingly mediocre output that looks complete enough to skip the hard thinking", which directly motivates a PRD agent that interviews first and gates progression ("I have enough to write a PRD. Proceeding to research."). citeturn13view0

That philosophy is codified in your repo's PRD Writer and Design Doc Writer definitions as gated, interview-first workflows: the PRD Writer is required to ask one question at a time, cover specific categories, cap at 15 questions, then research, write, and validate; the Design Doc Writer similarly caps at 12 architecture-focused questions, then produces a file-level change list plus dependency-ordered tasks with acceptance criteria traceable back to PRD requirements. citeturn7view0turn7view1turn13view1

You also already have a strong "deterministic wrapper" pattern running agents inside the cluster: your scheduled journalist CronJobs inject secrets via Vault annotations, generate a short-lived GitHub App installation token, clone the repo into an ephemeral workspace, run a named agent with a constrained allowlist of tools, commit/push to a date-stamped branch, and open (or reuse) a PR—while posting status updates to Discord. This is exactly the separation that makes agentic systems operationally debuggable: shell logic is deterministic; only bounded content generation is "agentic". citeturn12view0turn11view2turn18search3turn18search10

Finally, your own retrospective on where the design doc "hit reality" is the right lesson for your next step: structured tasks worked well for known work, but deployment/end-to-end testing surfaced integration bugs the design doc could not predict, and the design doc evolved into a living artefact that accumulated "Implementation Additions" and runbook-style child docs. That is the correct direction for autonomy: systematic artefacts + systematic feedback loops, not "one big prompt". citeturn13view3

## What research says about autonomy, specs, and orchestration

Across current practitioner guidance, the strongest consensus is: autonomy does not come from removing structure; it comes from (a) externalising structure into artefacts, (b) keeping orchestration deterministic, and (c) adding fast evaluation gates so agents can iterate without humans mid-flight.

A practical spec-writing synthesis from Addy Osmani explicitly recommends plan-first, breaking large tasks into smaller ones, and using structured specs with boundaries and commands; it also describes gated phases (specify → plan → tasks → implement) and notes that multi-agent setups help on large codebases but introduce coordination overhead—so you should start with a small number of specialised agents and clear boundaries. citeturn15view0turn15view1turn15view2

The same "two-layer" conclusion is now being published as an observed pattern in enterprise/production contexts: McKinsey's QuantumBlack describes a two-layer model where orchestration remains deterministic (phase transitions, dependency management, artefact state machines), while agents execute bounded tasks within phases—because letting agents self-orchestrate in larger codebases led to skipped steps, circular dependencies, and analysis loops. They also emphasise automated evaluation at each step (deterministic checks first, then critic-agent judgement) with iteration caps to avoid infinite loops. citeturn14view0

This maps directly onto what your design-doc template is trying to enforce: explicit dependency ordering, file-level change lists, and acceptance criteria checkboxes are all "machine-checkable scaffolding" that reduces the agent's need to invent missing structure. citeturn13view1turn7view1

Benchmarks also support your instinct to decompose. Xiang Deng et al.'s SWE-Bench Pro frames "long-horizon" software tasks as multi-file, hours-to-days problems, and reports that even strong models score under 25% pass@1 under a unified scaffold—i.e., "autonomous end-to-end" remains brittle at realistic complexity without strong scaffolding and evaluation. citeturn14view1

Finally, there is credible research suggesting that adding explicit feedback/learning loops (not weight updates) can measurably improve agent performance across trials: Reflexion is one example, where agents use task feedback signals to produce reflections stored in memory for future attempts, improving decision making in subsequent runs. This matters for your "automated learning system" goal: the reliable path is to capture errors as structured artefacts and feed them back into the next run. citeturn17search1turn17search33

## Options analysis: PRD/DD, synthetic interviewee, goal-only, and GSD-class workflows

The decision you're making is less "PRD vs no PRD" and more "what artefacts are needed for *this* class of work, and how do we generate them without you in the loop while staying grounded in your stack".

### Your existing PRD + design doc interview approach

**When it is the right tool:** it is excellent for "building something new" inside your repo where success criteria and constraints are under-specified and you want to prevent agent assumptions from becoming architecture. Your PRD Writer and Design Doc Writer are already explicitly designed for this, including question caps tuned to human patience and explicit gates into research and writing. citeturn7view0turn7view1turn13view0

**Where it mismatches your autonomous PoC goal:** for "investigate emerging tool X", you usually don't have *product* ambiguity as much as you have *evaluation* ambiguity:

- What class of tool is it (framework, library, platform, operator)?
- What "stack fit" criteria do you care about (language/runtime fit, cluster fit, security posture, maintenance signals, integration surface)?
- What constitutes a PoC success (hello-world, tutorial completion, benchmark, or integration spike)?
- What evidence is strong enough to write a wiki decision record and possibly a blog post?

For this, a PRD is often heavier than needed; you want a repeatable "tool evaluation brief" with a strict rubric and deterministic checks, then a PoC plan and execution. This is also consistent with spec-driven guidance that starts from a high-level brief and has the AI expand into structured artefacts, rather than you authoring heavy upfront specs. citeturn15view0turn15view1

### Automating the interviewer by adding an "interviewee" agent

This can increase autonomy, but only if the interviewee is *not inventing reality*. If you simply have an LLM answer the PRD/DD questions freely, you will get a coherent, confident PRD/design doc that is anchored mostly in model priors—not in your preferences, repo conventions, or actual operational constraints. Your own write-up explicitly identifies "plausible, polished, and wrong" as the primary risk of under-specified prompts. Swapping the human for another LLM without grounding generally reintroduces the same risk—just earlier in the pipeline. citeturn13view0

A safer variant is to turn the "interviewee" into a **retrieval-and-policy agent** that is only allowed to answer from:

- your repo's explicit context (CLAUDE.md, wiki, prior PRDs/design docs, conventions), and
- a machine-readable "stack contract" (more on this below),

and when the answer is absent, it must emit an explicit "assumption + confidence + what evidence is missing". This mirrors the "knowledge/assumption logging" pattern described in the two-layer enterprise workflow discussion and aligns with Reflexion-style learning loops (capture mistakes as structured text and feed back). citeturn14view0turn17search1turn17search33

If you do that, you *can* safely raise the number of questions beyond human patience, because the interviewee is not a human—**but** you should make the extra questions conditional (ask only when an answer is missing or low-confidence), otherwise you will spend tokens "clarifying" things that are already stable in your stack. That is consistent with your own finding that one-at-a-time matters because batches get skimmed. citeturn13view0turn7view0

### "No upfront research, just tell Claude to go do it"

This approach can work for quick, disposable spikes, but it is the least compatible with your stated goal: an automated system that produces reusable artefacts (PoC + evaluation + write-up) and improves over time. The reason is not moral or stylistic—it is operational:

- long sessions drift and lose constraints ("context rot"), which spec-driven harnesses explicitly try to mitigate by splitting work into smaller, checkable plans and fresh contexts; citeturn16view3turn16view2
- multi-step workflows without deterministic orchestration tend to mis-sequence, loop, or skip evaluation gates at scale; citeturn14view0
- integration and end-to-end issues will still happen, and without structured postmortems and runbooks, the system does not "learn" efficiently (your own design-doc-hit-reality narrative is literally a case study of why the living artefact matters). citeturn13view3

So "goal-only" is useful as a *component* (e.g., as the initial brief that triggers the workflow), but not as the full workflow for an autonomous learning factory. citeturn15view0turn14view0

### GetShitDone and adjacent spec-driven harnesses

GetShitDone is not conceptually a different world from what you've built; it is a packaged version of the same core ideas:

- it recommends mapping the codebase with parallel agents so future planning loads existing patterns; citeturn16view0
- it runs a multi-phase workflow (questions → research → requirements → roadmap), then phase-level "discuss / plan / execute / verify" with outputs living as files (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, and research folders); citeturn16view0turn16view2
- it explicitly targets context-rot by pushing work into small, checkable plans and fresh contexts with atomic commits per task; citeturn16view3turn16view2

There are also adjacent ecosystems: Martin Fowler's survey of spec-driven tooling (Kiro, spec-kit, Tessl) and AWS-aligned "AI-DLC" language in related frameworks show the same direction: specifications and evaluation gates become primary artefacts, with code as the downstream product. citeturn19search0turn19search1turn19search2turn19search15

**What this implies for you:** you likely do not need to "switch" to GetShitDone wholesale. You should treat it as a reference design and selectively steal the pieces that match your k8s-native, repo-centric workflow:

- codebase mapping as a periodic job to refresh stack context,
- "discuss-phase" equivalent to lock preferences/constraints for a specific investigation before doing expensive work,
- strict state files (STATE.md) to make long-running workflows resumable,
- commit-per-task and verify-work gates.

Those are exactly the elements that help autonomy without requiring you to be in the loop continuously. citeturn16view0turn16view2turn14view0

## Recommended operating model for autonomous tool investigations

The best fit for your stated goal is a **two-layer, k8s-native "Investigation Factory"** that reuses your existing conventions (wiki as artefact store, agents as specialists, git branches as state) but replaces PRD/DD with artefacts designed specifically for tool evaluation.

### Decision: keep the PRD/DD pattern, but do not use it as the primary artefact for automated PoC investigations

You should keep PRD/DD as-is for "build a thing" project work, because it directly targets ambiguity through interview gates. citeturn13view0turn7view0turn7view1

For automated tool investigations, introduce a parallel artefact chain:

1. **Tool Triage Brief** (fast, cheap, evidence-based)
2. **Tool Evaluation Plan** (your "design doc equivalent": tasks, dependencies, file list, acceptance criteria)
3. **PoC Execution + Verification** (run tasks, tests, scans, and a "critic" evaluation gate)
4. **Wiki Decision Record** (what it is, what you tried, results vs your adopted stack, why/why not)
5. **Optional Blog Draft** (only if the wiki record meets an "interestingness" threshold)

This mirrors the gated, structured approach recommended in spec-driven guidance and in the deterministic orchestration + bounded execution model. citeturn15view1turn14view0turn16view2

### Replace "human interview" with "stack contract + assumption logging", not with a free-form interviewee agent

Your PRD and design-doc interviews exist to extract constraints and success criteria from your head. For autonomy, the correct move is to *move those constraints into the repo* in a machine-readable way, and make "unknowns" explicit.

Concretely:

- Create a single, canonical "Stack Contract" document that is the authoritative source of truth for the investigation agent (languages, build tools, security rules, deployment constraints, observability expectations, and your default preferences). This is aligned with recommendations to keep boundaries, commands, and structure in a consistent format for agent consumption. citeturn15view1turn14view0turn7view1
- Have the investigation workflow log assumptions as structured artefacts (file-based) and require downstream steps to either (a) prove the assumption during PoC, or (b) escalate it for human review. This aligns with the "orchestration reads artefact state and drives phase transitions" concept. citeturn14view0turn13view3
- Add a reflection/postmortem step that updates the Stack Contract or investigation templates when the workflow fails (a Reflexion-like "learn from feedback without retraining" loop). citeturn17search1turn13view3

If you still want an "interviewee" agent, constrain it to answer only from the Stack Contract + wiki + prior investigations; otherwise it must output "unknown". This makes it a retrieval tool, not a speculative product manager. citeturn14view0turn8view6

### Keep k8s as the runtime, but upgrade from single CronJobs to workflow execution for multi-step investigations

CronJobs are perfect for periodic, single-shot runs (as you've already done). citeturn11view2turn12view0turn18search2

For investigations that may include multiple stages (triage → plan → PoC → verify → write-up), consider running the investigation as either:

- a single Job with a deterministic "phase runner" that invokes agents step-by-step (simplest), or
- a DAG workflow engine (if/when you want native parallelism, retries, and explicit step dependencies).

Argo Workflows is a Kubernetes CRD-based workflow engine that models multi-step workflows as sequences or DAGs; Tekton provides Kubernetes-native pipeline CRDs for CI/CD-style workflows. Either is compatible with your portability goal, but the choice mainly affects operational ergonomics. citeturn18search0turn18search1turn18search4turn18search5

### Use your existing "deterministic wrapper" pattern as the orchestration layer

Your journalist CronJob template is already a reference implementation of the two-layer model:

- deterministic prelude: secrets injection, token creation, repo clone/branch management, MCP config, tool allowlist; citeturn12view0turn18search3turn18search10
- bounded agent execution: `claude --agent ...` with explicit allowed tools; citeturn12view0
- deterministic postlude: push branch, create PR, status reporting. citeturn12view0

Reusing this exact wrapper pattern for investigations will get you autonomy *without* sacrificing debuggability.

## Implementation plan by milestone

This plan assumes you continue using your repo/wiki as the system of record, and that investigations create branches/PRs the same way your scheduled agents already do. citeturn12view0turn5view3turn13view3

### Milestone: Define investigation artefacts and the "stack contract"

**Deliverables**

A small set of templates, stored alongside your existing wiki artefacts, that every investigation run must produce:

```text
apps/blog/blog/markdown/wiki/tools/
  index.md
  evaluations/
    <tool-slug>/
      index.md
      triage.md
      plan.md
      results.md
      decision.md
      sources.md
      assumptions.md
```

And one canonical stack contract file (name/path up to you, but keep it stable and short):

```text
apps/blog/blog/markdown/wiki/stack/contract.md
apps/blog/blog/markdown/wiki/stack/eval-rubric.md
```

**Why this is the first milestone**

Spec-driven guidance repeatedly emphasises consistent structure, explicit boundaries, and keeping specs as living artefacts tied to version control; the enterprise two-layer model further depends on artefact state and templates to drive deterministic phase transitions. citeturn15view1turn14view0turn16view0

**Definition of done**

- Every investigation can be evaluated against the same rubric (stack fit, operational fit, security posture, maintenance signals, learning value), and the rubric is written down. citeturn15view1turn14view0
- "Unknowns" are explicitly representable as assumptions + confidence + verification plan (so they can be tested or escalated). citeturn14view0turn13view3

### Milestone: Add an "investigator" agent and a "verifier/critic" agent

**Deliverables**

- An Investigator agent that produces triage + plan + PoC execution instructions and writes the wiki artefacts.
- A Verifier/Critic agent that checks: rubric completeness, traceability (plan tasks → results evidence → decision), and that claims in write-ups are sourced. This is analogous to your existing validate phases on PRD and design-doc writers. citeturn7view0turn7view1turn14view0

**Why this matters**

Both your existing workflow and the two-layer model emphasise that "judgement" checks should be handled by a dedicated critic agent after fast deterministic checks, with iteration caps. citeturn7view1turn14view0

**Definition of done**

- Investigator can run end-to-end on a small, known tool (one you've already investigated) and reproduce the same style/structure of wiki output. citeturn8view7turn13view0
- Verifier can fail the investigation if: missing evidence, missing sections, unsourced claims, or decisions that don't map to rubric criteria. citeturn14view0turn8view7

### Milestone: Build the k8s execution wrapper for investigations

**Deliverables**

A k8s-native runner that is structurally similar to your journalist CronJob wrapper:

- Vault Agent Injector annotations for secrets, consistent with HashiCorp's injector model and your existing practice. citeturn12view0turn18search10turn18search3
- Branch-per-run execution (e.g., `poc-<tool>-<date>`), with commit-per-phase or commit-per-task (depending on how granular you want diffs). The "atomic commits per task" approach is a core theme in GSD-style workflows and directly helps debuggability. citeturn16view3turn16view2turn12view0
- Tight tool allowlists per phase (research phase can WebSearch/WebFetch; PoC phase can run builds/tests; write-up phase can write wiki files). Your existing CronJob shows this pattern is already working in your environment. citeturn12view0turn7view0

**Why this matters**

This milestone is where autonomy becomes operationally real. Deterministic orchestration is the primary lever to prevent "agents deciding what comes next", and it is the foundation of your current scheduled agent system. citeturn14view0turn12view0

**Definition of done**

- A triggered run produces a PR containing: all artefacts, any PoC code/scripts, and a summary comment/notification, even if the run fails mid-way (failures should still produce a partial artefact trail). citeturn14view0turn12view0
- Concurrency and time limits are enforced via native workload controls (the CronJob/Job primitives you already use support these scheduling and run-time constraints). citeturn18search2turn11view2turn12view0

### Milestone: Add "PoC sandboxing" and deterministic checks

**Deliverables**

A standard way for investigations to create PoCs without polluting the main repo:

- a dedicated `apps/pocs/<tool-slug>/` (or similar) location,
- a consistent "how to run" script interface,
- deterministic checks run in-cluster: lint/test/build, plus any existing security scanning you already run (your repo already documents semgrep/trivy/gitleaks containerised usage patterns). citeturn5view2turn8view7turn14view0

**Why this matters**

Your own "design doc hit reality" section shows that integration issues appear late; the earlier you can push "reality checks" (build, tests, resource limits, e2e smoke), the less human intervention you need. Your blog also documents that QA in constrained environments can hang until OOMKilled, which argues for codifying resource assumptions as tests and runbooks. citeturn13view3turn14view0

**Definition of done**

- Every PoC step has a deterministic check, and the pipeline fails fast if checks fail. citeturn14view0turn15view3
- The results artefact includes concrete evidence: commands run, versions, outputs, and links to source material. citeturn16view1turn15view1

### Milestone: Automatic wiki page + optional blog draft gate

**Deliverables**

- Wiki write-up is mandatory for every completed investigation.
- Blog post draft is optional and requires passing an explicit "interestingness" gate (e.g., novelty vs your stack, material trade-offs, unexpected operational lessons). This is consistent with your existing Publisher pipeline: research → substance gate → write → review → QA → security audit. citeturn8view7turn8view8

**Why this matters**

Autonomy without high-quality write-ups turns into "agent churn". The factory only compounds value when the artefacts are searchable, comparable, and decision-oriented. This is also why GSD's project researcher produces multiple structured documents that feed the roadmap, and why it keeps state files. citeturn16view1turn16view0turn14view0

**Definition of done**

- Wiki pages are comparable across tools (same rubric headings), making "tool A vs tool B" possible without rerunning work. citeturn16view1turn15view1
- Blog drafts cannot be published without passing the same reviewer/QA/security stages your Publisher pipeline already enforces. citeturn8view7turn8view8

### Milestone: Make it a learning system

**Deliverables**

A hard feedback loop that updates artefacts used by future runs:

- Each failed run produces a structured "failure record" that includes: failure class (auth, environment, build, tool mismatch), reproduction steps, mitigation, and whether the Stack Contract or templates need updating.
- Each successful run updates: "what to watch out for next time" and "known pitfalls" sections for that tool class.

**Why this matters**

Research-backed agent learning improvements come from incorporating feedback signals into future attempts (Reflexion-style), and enterprise patterns emphasise that artefact-driven evaluation gates and deterministic orchestration enable iterative improvement without constant human supervision. citeturn17search1turn14view0turn15view3

**Definition of done**

- Repeating an investigation on a similar tool class produces fewer environment/setup failures over time because the knowledge base and templates improve. citeturn17search1turn13view3
- The system can be "rolled forward/back" by adjusting templates and re-running, analogous to changing code and rerunning CI. citeturn14view0turn15view3

## Failure modes, metrics, and guardrails

The failure modes you've already observed in practice—UID mismatches, Helm/kubectl ownership conflicts, memory pressure leading to OOM kills, filesystem case-sensitivity differences—are strong evidence that (a) environment reality must be tested, and (b) the system must produce operational notes as first-class artefacts. citeturn13view3

A measurement model that matches your goals should focus on *factory throughput and reliability*, not "agent cleverness":

- **Throughput:** investigations completed per week; median time from trigger to PR; percent of runs that reach a publishable wiki decision record. (This aligns with the "optimise for throughput" framing in enterprise agent workflow guidance.) citeturn14view0
- **Quality:** verifier pass rate; percent of claims with sources; percent of rubric sections populated with evidence. citeturn14view0turn16view1
- **Stability:** failure class distribution over time (should shift from environment/auth failures to genuinely hard "tool mismatch" failures as you harden the wrapper). citeturn13view3turn17search1
- **Autonomy:** fraction of runs requiring human intervention before PR creation; fraction of interventions that lead to Stack Contract/template updates (a proxy for "learning"). citeturn14view0turn17search1

Guardrails should remain deterministic wherever possible:

- k8s workload-level timeouts and concurrency policies (your CronJobs already use these patterns, and Kubernetes documents the relevant semantics like `concurrencyPolicy: Forbid`). citeturn12view0turn18search2
- secret injection and boundary enforcement via HashiCorp Vault Agent Injector annotations (documented behaviours and already in your manifests). citeturn12view0turn18search3turn18search10
- strict tool allowlists per phase (minimise "agent surprise"), which you already do in-cluster. citeturn12view0turn7view0
- "no unsourced claims" enforcement in write-ups (your Publisher pipeline already treats sourcing as a first-class review concern). citeturn8view7turn16view1

The core conclusion, backed by both your existing implementation and the broader evidence: autonomy improves fastest when you increase *determinism and evaluability*, not when you remove the spec/interview layers. For your automated PoC learning system, the right evolution is to shift from PRD/DD (product artefacts) to a rubric-driven investigation artefact chain, with deterministic orchestration in k8s and bounded agents that write and verify those artefacts. citeturn13view0turn14view0turn16view0turn12view0
