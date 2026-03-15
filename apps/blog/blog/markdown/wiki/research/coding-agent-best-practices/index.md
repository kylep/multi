---
title: "Coding Agent Best Practices"
summary: "Three Deep Research reports on defining and structuring coding agents, generated from the same prompt across ChatGPT, Gemini, and Claude."
keywords:
  - deep-research
  - coding-agents
  - claude-code
  - subagents
  - orchestration
  - context-engineering
related:
  - wiki/research
scope: "Subject index for coding agent best practices research. Links to three provider reports."
last_verified: 2026-03-15
---

Three Deep Research reports on defining and structuring coding agents,
generated from the same prompt across three providers. Used as inputs
for the
[Best Practices Guide for Claude Coding Agents](/using-agents-better.html)
blog post.

## Prompt

> Create a report on the current research-based best practices around
> defining and structuring coding agents. Interested in general
> guidance but my specific use-case is Claude agents that use Open,
> Sonet, and Haiku currently. Interested in subagents vs calling
> parallel agents with bash scripts, current standards for
> orchestrating agents, what's most effective for having them maintain
> state and knowledge, how to best manage their context, and similar
> best practices.

## Reports

- [ChatGPT Deep Research: Coding Agent Best Practices](/wiki/research/coding-agent-best-practices/chatgpt.html) —
  17 pages, 101 references. Covers model routing, subagents vs
  parallel scripts, orchestration frameworks, state/context
  management, testing, deployment, cost, governance, and
  implementation roadmap.
- [Gemini Deep Research: Coding Agent Best Practices](/wiki/research/coding-agent-best-practices/gemini.html) —
  11 pages, 33 references. Covers model tiering, hierarchy vs
  parallelism, context engineering, state management, MCP/A2A/LACP
  standards, agent-computer interface, evaluation, and prompting.
- [Claude Deep Research: Coding Agent Best Practices](/wiki/research/coding-agent-best-practices/claude.html) —
  9 sections, no numbered references (inline citations). Covers
  the canonical agent loop, multi-agent architecture, model
  selection (80/10/10 rule), state management, context window
  engineering, subagents vs bash agents, tool use/MCP, prompting
  patterns, and evaluation.

---

## Cross-Source Synthesis

All three reports were generated from the same prompt on 2026-03-13.
Below is a structured comparison of their findings.

### Shared Findings (present in 2+ sources)

#### All three sources

- **Three-tier model routing (Opus/Sonnet/Haiku)** — All three recommend routing tasks to different Claude models based on complexity and risk. Opus for high-stakes architectural reasoning and final synthesis, Sonnet as the default workhorse for implementation, Haiku for cheap/fast tasks like classification, summarization, and routing. (chatgpt, claude, gemini)
- **Subagents as the default multi-agent primitive** — All three recommend subagents over parallel bash scripts for most use cases, because subagents isolate context (each runs in a clean window, returns only a compressed summary) and reduce context bloat in the orchestrator. (chatgpt, claude, gemini)
- **Context isolation is the primary value of subagents** — Subagents act as a "context firewall," consuming noisy intermediate tool outputs and returning only condensed results. This prevents the lead agent's context from growing unmanageably. (chatgpt, claude, gemini)
- **Subagents cannot spawn subagents** — Claude Code enforces a single-level hierarchy to prevent recursive explosion. The main agent can delegate, but subagents cannot further delegate. (chatgpt, claude, gemini)
- **Compaction/summarization for long-running sessions** — All three describe server-side or manual compaction as essential for sessions that approach context limits. Claude's compaction API summarizes and drops earlier history to free context space. (chatgpt, claude, gemini)
- **"Lost in the middle" problem** — Models retrieve information best from the beginning and end of context, degrading on information buried in the middle. All three recommend strategies to mitigate this (just-in-time loading, progressive disclosure, context pruning). (chatgpt, claude, gemini)
- **MCP as the de facto standard for tool connectivity** — MCP (Model Context Protocol) provides a standardized JSON-RPC interface for connecting agents to external tools and data sources. All three identify it as the primary interoperability standard. (chatgpt, claude, gemini)
- **A2A protocol for inter-agent communication** — Google's Agent-to-Agent protocol is identified by all three as an emerging standard for agent discovery and cross-agent messaging. (chatgpt, claude, gemini)
- **Prompt caching as the highest-leverage cost optimization** — Cache reads at 10% of standard input cost (90% discount) make this the single biggest cost lever for agents with stable system prompts and tool definitions. (chatgpt, claude, gemini)
- **Tool Search Tool for managing tool sprawl** — When agents have 10+ tools, tool definitions alone consume excessive context tokens. The Tool Search Tool with deferred loading reduces this by ~85%. (chatgpt, claude, gemini)
- **Batch API for async workloads at 50% discount** — Non-latency-sensitive tasks (evals, bulk review, CI pipelines) should use the Batch API for cost savings. (chatgpt, claude, gemini)
- **Orchestrator-worker as the primary multi-agent pattern** — A lead agent decomposes tasks and delegates to specialized workers. This is the pattern used by Claude Research and recommended for complex tasks where subtasks are not known upfront. (chatgpt, claude, gemini)
- **Evaluation-driven development** — Define measurable success criteria, build evaluation sets from real failures, and iterate. Use code-based graders for objective checks and LLM-as-judge for flexible scoring. (chatgpt, claude, gemini)
- **CLAUDE.md / repo-level instruction files as governance** — Persistent project context files loaded at session start provide conventions, architecture decisions, and build commands that anchor agent behavior across sessions. (chatgpt, claude, gemini)
- **Haiku as a cost-effective router/classifier** — Use Haiku for routing and classification tasks where it performs within 2-5% of Sonnet accuracy at a fraction of the cost. (chatgpt, claude, gemini)
- **Effort parameter for reasoning density control** — Opus at medium effort matches Sonnet performance while using 76% fewer tokens. This prevents overinvestment in simple queries. (chatgpt, claude, gemini)
- **Parallel bash/process agents for specific use cases** — Reserve parallel bash scripts for process-level isolation, CI fan-out, heterogeneous runtimes, or long-running autonomous work exceeding single-session limits. (chatgpt, claude, gemini)

#### Two sources

- **ReAct loop as foundational pattern** — Interleave reasoning traces and tool-use actions to reduce hallucinations and improve task trajectories. (chatgpt, claude)
- **Structured outputs with strict: true for reliable tool use** — Use JSON schema validation with strict mode to guarantee valid responses and validated tool parameters, turning parsing into compile-time constraints. (chatgpt, claude)
- **File checkpointing for safe rollback** — The Agent SDK supports rewinding file changes made via edit tools, but Bash edits are not tracked, so high-integrity workflows should prefer SDK edit tools. (chatgpt, claude)
- **Memory tool / persistent cross-session storage** — Claude's Memory tool stores and retrieves information across conversations via a client-side /memories directory. (chatgpt, claude)
- **RAG can degrade with too much context** — More retrieved context is not automatically better; retrieval should be selective and relevance-aware. Long-context LLMs can degrade when fed too many passages. (chatgpt, claude)
- **Deny-by-default permissions with progressive allowlisting** — Default to denying tool access in production and progressively allowlist specific tools and sub-commands as confidence grows. (chatgpt, claude)
- **Container-based sandboxing for deployment** — Isolate agent processes in containers to control resources, network access, and support ephemeral filesystems. (chatgpt, claude)
- **Secret-injection proxy pattern** — Inject credentials outside the agent's security boundary via a proxy so the agent never sees secrets directly. (chatgpt, claude)
- **OpenTelemetry for agent observability** — Adopt OpenTelemetry GenAI semantic conventions for vendor-neutral distributed tracing of model calls, tool calls, and retries. (chatgpt, claude)
- **Agents use ~4x more tokens than chat; multi-agent ~15x more** — Multi-agent is an economic decision that should be reserved for tasks where value justifies the token cost multiplier. (claude, gemini)
- **Start simple, add complexity only when measured outcomes improve** — Begin with the basic agent loop (50 lines), add Agent SDK when needed, adopt frameworks only when justified by specific requirements. (claude, chatgpt)
- **Tool descriptions are the most important factor in tool performance** — Each tool description should be 3-4+ sentences explaining what it does, when to use it, what parameters mean, and what it does not do. (claude, chatgpt)
- **Git as coordination protocol for parallel agents** — Carlini's 16-agent C compiler used a shared bare git repo for synchronization, with agents pushing/pulling and git conflicts forcing resolution. (claude, gemini)
- **Programmatic Tool Calling reduces token usage** — Claude writes Python to orchestrate tools in a sandbox, reducing token usage by ~37% on complex multi-step workflows. (chatgpt, claude)
- **Five workflow patterns (chaining, routing, parallelization, orchestrator-worker, evaluator-optimizer)** — Anthropic's "Building Effective Agents" post defines these five as composable building blocks. (chatgpt, claude)
- **Three-layer memory architecture (short-term, long-term, derived/workflow)** — Effective agent memory separates ephemeral context, persistent cross-session storage, and derived/compressed knowledge. (chatgpt, gemini)
- **Transparent/file-based memory for developer trust** — Treating agent memory as editable files in the workspace (PROGRESS.md, CLAUDE.md) is superior for auditability because developers can review and correct the agent's internal state. (claude, gemini)
- **SWE-bench as the primary coding agent benchmark** — All sources referencing benchmarks identify SWE-bench Verified as the gold standard, though they note it has limitations (Python-only, may not reflect proprietary multi-language codebases). (chatgpt, claude, gemini)
- **Hierarchical supervision degrades sequential reasoning** — The communication overhead between supervisor and worker layers can degrade performance by 39-70% on purely sequential reasoning tasks. (gemini, claude)
- **Agent teams (swarms) for collaborative/adversarial reasoning** — Agent teams with peer-to-peer messaging enable adversarial debugging and competing-hypothesis investigation, but cost significantly more tokens. (chatgpt, gemini)
- **Prefer raw API/SDK over frameworks** — Anthropic recommends building on raw API first, understanding what frameworks do under the hood, and only adopting frameworks when specific capabilities (stateful routing, built-in observability) are needed. (chatgpt, claude)
- **OWASP Top 10 for LLM Applications as security checklist** — Use this framework to structure governance around prompt injection, insecure output handling, model DoS, and supply chain risks. (chatgpt, claude)
- **Retry with exponential backoff + jitter for transient errors** — Distinguish provider transient errors (529, 500) from rate limits (429) and budget exhaustion, handling each appropriately. (chatgpt, claude)

### Unique Findings (from one source only)

#### ChatGPT only
- **A2A as a Linux Foundation ecosystem standard** — Describes A2A not just as Google's protocol but as part of the broader AAIF initiative under the Linux Foundation, reducing vendor lock-in
- **Agent SDK permission evaluation order** — Hooks first, then deny rules, then allow rules, then canUseTool callback; deny rules override even bypass modes
- **Structured output repair loops** — Agent SDK stops with error_max_structured_output_retries when schema validation fails too many times, signaling a prompt/schema bug or routing signal to switch models
- **Prompt caching concurrency caveat** — Cache entry becomes available only after the first response begins; concurrent requests may miss the cache
- **Cache-aware rate limits** — Cache_read_input_tokens don't count toward ITPM for most models, improving effective throughput with high cache hit rates
- **Context editing as a beta feature** — Selective clearing strategies (tool result clearing, thinking block clearing) distinct from compaction, but not eligible for ZDR
- **1M token context premium pricing** — Requests >200K tokens switch to 2x input and 1.5x output pricing with dedicated rate limits
- **Claude Code Analytics Admin API** — Organization-level analytics including tool acceptance rates, model-level costs, and productivity metrics
- **MCP connector for remote servers** — Direct connection to remote MCP servers from the Messages API with OAuth bearer token support
- **Self-RAG (retrieve on-demand, reflect/criticize)** — Gains from selective retrieval and critiquing passages rather than always stuffing k passages
- **MemGPT OS metaphor** — Treat context as fast memory and external stores as slow memory, swapping in/out via "interrupts" and retrieval policies
- **Generative Agents reflection pattern** — Store experiences, synthesize reflections, and retrieve them dynamically, transferring to project memory and decision logs
- **Detailed implementation roadmap (week-by-week)** — Specific 3-month phased rollout: weeks 1-2 adopt CLAUDE.md and subagents, weeks 3-4 add structured outputs and caching, month 2 add Memory tool and MCP, month 3 harden isolation
- **Token counting preflight** — Count tokens before expensive long-context calls to route accordingly and avoid surprise costs
- **Prompt leakage mitigation** — Start with monitoring and post-processing rather than leak-proofing prompts, which can degrade performance
- **LangGraph for checkpointed persistence** — Specifically calls out LangGraph's pause/resume, human-in-loop, and time-travel debugging features
- **Temporal/Airflow/Prefect as durable workflow engines** — Distinguish the agent runtime from the workflow runtime; use dedicated engines for scheduling, retries, and fleet-scale backpressure
- **Comparison of 7 orchestration frameworks** — Detailed table comparing Claude Agent SDK, LangGraph, AutoGen, Microsoft Agent Framework, OpenAI Agents SDK, Temporal, and Airflow/Prefect
- **Tree of Thoughts for high-stakes decisions** — Search over reasoning paths is useful but expensive; reserve for Opus-gated decision points
- **Reflexion (reflect-and-retry) pattern** — Use explicit feedback signals or reflections to improve next attempts

#### Claude only
- **The 80/10/10 model allocation rule** — Sonnet 80-90% of tasks, Haiku 5-20%, Opus 5-10%; a specific quantified allocation ratio
- **50-line agent loop handles 80% of use cases** — The canonical loop is radically simple and Anthropic recommends it as the starting point before any framework
- **Three specific scenarios for multi-agent** — Anthropic identifies exactly three: context protection (>1,000 tokens of irrelevant intermediate context), parallelization (90.2% improvement on internal benchmarks), and specialization (20+ tools or conflicting system prompts)
- **Token usage explains 80% of performance variance** — In Anthropic's research evaluations, token usage alone is the dominant factor
- **Head+tail compaction strategy** — When implementing custom compaction, allocate 20% to head (task definition) and 80% to tail (recent work), dropping middle messages
- **Context degradation thresholds** — Specific utilization bands: 0-50% optimal, 50-75% good, 75-90% noticeable degradation, 90%+ significant issues
- **Compaction achieves 60-80% reduction** — A 150K context typically compacts to 30-50K
- **Action-oriented subagent descriptions improve delegation** — Trigger phrases like "MUST BE USED" and "PROACTIVELY invoke for" in description fields improve auto-delegation reliability
- **The "right altitude" prompting principle** — A Goldilocks zone between over-specified (brittle if-else) and under-specified (vague) instructions; aim for heuristics over hardcoded rules
- **Adaptive thinking eliminates manual thinking budget tuning** — Claude 4.6 dynamically calibrates reasoning depth based on task complexity
- **Interleaved thinking between tool calls** — Beta feature enabling reasoning about each tool result before deciding the next step
- **Think tool as explicit scratchpad** — Distinct from extended thinking; gives agents a place to pause and assess in policy-heavy environments
- **Subagent delegation needs four things** — Objective, output format, tool/source guidance, and clear task boundaries; without these, agents duplicate work or leave gaps
- **Explicit scaling rules in delegation prompts** — "Simple fact-finding: 1 agent, 3-10 tool calls; direct comparisons: 2-4 subagents" etc.
- **Berkeley MASFT taxonomy: 79% of failures are specification problems** — Not infrastructure or model limitations; specification failures, inter-agent misalignment, and task verification failures
- **Multi-agent systems show 41-86.7% failure rates** — Including a documented case of circular message relay lasting 9 days consuming 60,000+ tokens
- **External loop guardrails are non-negotiable** — The system running the agent must guarantee termination via max iterations, token budgets, and repetition detection
- **Pass@k as the most actionable production metric** — Probability of at least one correct solution in k attempts; review subagents yield only ~0.5% gain on SWE-bench but significantly more on real-world quality
- **LLM-as-judge shows 0.7-0.9 Spearman correlation with humans** — Known biases include length preference and self-model bias
- **Evaluator must have isolated context from producer** — If the evaluator shares too much context with the producer, it becomes "another participant in collective delusion"
- **PwC reports 7x accuracy improvement via evaluator-optimizer** — From 10% to 70% through structured validation loops
- **Manus identified cache hit rate as their most important production metric** — Specific practitioner insight about what to optimize in production
- **Mem0 reports 91% lower response times** — Compared to full-context approaches while maintaining quality
- **Max subagent parallelism: default 3, max 8 in Claude Code** — Specific concurrency limits for native subagents
- **Carlini's compiler cost: ~$20,000 across ~2,000 sessions (2B input, 140M output tokens)** — Concrete cost reference for large-scale parallel agent work
- **$365K/year savings from combined routing and caching** — Customer support system processing 100K requests/day
- **Structured state dataclass pattern for multi-agent coordination** — Explicit AgentState object serialized into context for step tracking
- **Hybrid vector store + knowledge graph for long-term persistence** — Vector stores for semantic similarity, knowledge graphs for structured relationships
- **Agent Memory is read-write (RAG -> Agentic RAG -> Agent Memory evolution)** — The agent stores information for its own future retrieval, not just reads from a static corpus

#### Gemini only
- **LACP (LLM-Agent Communication Protocol)** — A telecom-inspired three-layer protocol for secure, interoperable, transactional agent communication with a "narrow waist" principle; not mentioned by the other two sources
- **Agent-Computer Interface (ACI) as a distinct design pattern** — SWE-agent's abstraction layer between LLM and terminal (view_file, search_dir, edit_file) with built-in guardrails like automated lint/syntax checking during edits
- **Mini-SWE-Agent implementable in ~100 lines of Python** — Demonstrates that architectural guardrails are often more impactful than model scale
- **Loss-Aware Pruning / Semantic Compression** — Identifying parts of context that least contribute to the model's predictive confidence (perplexity) and removing them; stripping comments, formatting, and non-essential function definitions
- **Context Poisoning as a named failure mode** — When a hallucination or error in a previous step is carried forward, influencing all future reasoning
- **Context Clash as a named failure mode** — When different parts of context provide conflicting instructions (old requirements vs new changes), leading to model paralysis
- **Event-stream architecture (OpenHands pattern)** — Modeling agent-environment interaction as a continuous Agent -> Actions -> Environment -> Observations loop with a persistent event log as source of truth
- **Three-level comparative analysis for evaluation** — Code-level (AST comparison), process-level (solution tree comparison), and LLM-level (cross-backbone behavior comparison)
- **Adversarial debugging with parallel agent teams** — Multiple teammates investigate competing hypotheses for a bug, debating findings to overcome single-agent anchoring bias
- **init.sh scripts for agent bootstrapping** — An initializer agent writes a script defining how to run the dev server and execute tests; subsequent sessions begin by reading it
- **Single-agent performance ceiling at 15+ tools** — Performance degrades when managing more than 15 tools due to system prompt complexity and tool documentation length
- **n^2 attention complexity explanation for context bloat** — Transformer models exhibit quadratic pairwise relationships, explaining why confusion grows with prompt length
- **Supervisor pattern degrades performance 39-70% on sequential tasks** — Specific quantification of communication overhead cost
- **Capability Discovery via MCP** — Agents dynamically adapt behavior based on detected MCP servers in their environment
- **Benchmarking beyond SWE-bench with internal eval sets** — Creating internal evaluation sets based on representative samples of actual work, paired with verifiable outcomes
- **"Start wide, then narrow" heuristic for orchestrator prompting** — Begin with short broad queries to understand the landscape before drilling into specifics; agents default to overly specific queries in unfamiliar codebases
- **Think like the agent / simulation-based debugging** — Use simulations to watch agents work step-by-step, revealing hidden failure modes like continuing to search when they already have sufficient results

### Contradictions (points where sources disagree)

- **Compaction trigger threshold** — Claude says Claude Code triggers auto-compaction at ~75-92% context capacity. Gemini says Claude Code triggers auto-compact when context exceeds 95% of the window. ChatGPT does not specify a precise threshold.
- **Emphasis on framework avoidance vs framework comparison** — Claude and ChatGPT both recommend raw API/SDK first, but ChatGPT provides a detailed 7-framework comparison table (LangGraph, AutoGen, Temporal, etc.) suggesting these are reasonable choices, while Claude more strongly positions frameworks as last-resort additions. Gemini does not compare frameworks in detail.
- **Agent teams: experimental vs production-ready** — ChatGPT describes agent teams as "experimental; disabled by default; known limitations." Gemini describes them as an established pattern ("Agent Swarms") with specific use cases like adversarial debugging. Claude describes them as a valid option but notes they use "significantly more tokens."
- **Subagent vs bash script preference strength** — ChatGPT and Claude both recommend subagents by default but treat bash scripts as a legitimate alternative for specific scenarios (process isolation, CI fan-out, K8s deployment). Gemini more strongly favors native orchestration over bash scripts, calling bash scripts a pattern from "early stages of agent development" that lacks "cognitive integration."
- **Model version referenced** — ChatGPT and Claude reference Claude 4.6 models (Opus 4.6, Sonnet 4.6) as the current generation. Gemini references Claude 4.5 models (Opus 4.5, Sonnet 4.5, Haiku 4.5) throughout, possibly reflecting different training data or generation timing despite the same prompt date.
- **SWE-bench scores for Opus** — Claude cites Opus 4.6 (thinking) at 79.2% on SWE-bench Verified. Gemini cites Opus 4.5 as "the first model to cross the 80% threshold" at 80.9%. ChatGPT does not cite a specific score.
