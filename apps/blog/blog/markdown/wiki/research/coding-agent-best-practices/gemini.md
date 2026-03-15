---
title: "Gemini Deep Research: Architectural Paradigms and Engineering Best Practices for Claude-Based Coding Agents"
summary: "Gemini Deep Research report on coding agent best practices, covering model tiering, orchestration hierarchy vs parallelism, context engineering, state management, standards (MCP/A2A), evaluation, and practical implications."
keywords:
  - deep-research
  - gemini
  - coding-agents
  - claude-code
  - subagents
  - orchestration
  - context-engineering
  - mcp
provider: gemini
prompt: "Create a report on the current research-based best practices around defining and structuring coding agents. Interested in general guidance but my specific use-case is Claude agents that use Open, Sonet, and Haiku currently. Interested in subagents vs calling parallel agents with bash scripts, current standards for orchestrating agents, what's most effective for having them maintain state and knowledge, how to best manage their context, and similar best practices."
date_generated: 2026-03-13
related_posts:
  - using-agents-better
related:
  - wiki/research
scope: "Full Gemini Deep Research report. Covers model tiering and routing, orchestration patterns (hierarchy vs parallelism), context engineering and attention budget, state and knowledge management, standards for orchestration (MCP, A2A, LACP), agent-computer interface, evaluation, and prompting best practices."
last_verified: 2026-03-14
---


The architectural transition from monolithic large language model
applications to autonomous agentic systems represents a fundamental shift
in the software engineering discipline. In the contemporary landscape,
where models such as Claude 4.5 Opus, Sonnet, and Haiku provide varying
degrees of reasoning density and operational throughput, the primary
engineering challenge has migrated from prompt construction to the design
of the "harness", the runtime environment, toolsets, and coordination
protocols that enable these models to interact with complex, real-world
development environments. This report analyzes the research-based best
practices for defining and structuring coding agents, providing a
technical blueprint for multi-tiered systems that optimize for autonomy,
coherence, and economic efficiency.


# The Model Tiering Ecosystem: Strategic Allocation of Reasoning

The Claude 4.5 family of models is engineered as a progressive hierarchy,
where each tier is optimized for a specific intersection of task
complexity, latency requirements, and error cost. Developing a robust
coding agent requires an intelligent routing layer that treats these
models not as interchangeable components, but as specialized assets
within a broader cognitive architecture.

## Performance Characteristics and Benchmarks

The flagship model, Claude Opus 4.5, is designed for high-stakes
architectural reasoning and deep technical debugging. It is the first
model to cross the 80% threshold on the SWE-bench Verified benchmark, a
metric that reflects its ability to resolve real-world software issues in
large, existing repositories. In contrast, Claude Sonnet 4.5 serves as
the "workhorse" of the ecosystem, balancing high-level reasoning with
superior throughput. Sonnet 4.5 is particularly notable for its beta
support of a 1-million-token context window, allowing it to maintain a
holistic view of entire codebases that would necessitate extensive
fragmentation in smaller-context models. Claude Haiku 4.5 represents the
high-velocity tier, optimized for routine tasks such as unit test
generation, linting, and boilerplate implementation where speed and
cost-effectiveness are prioritized over deep analytical reasoning.

| Model Tier | Core Role | SWE-bench Verified | Input Price (per 1M) | Output Price (per 1M) | Max Output Tokens |
|---|---|---|---|---|---|
| Claude Opus 4.5 | High-level architectural planning | 80.9% | $5.00 | $25.00 | 32,000 |
| Claude Sonnet 4.5 | Feature development & refactoring | 77.2% | $3.00 | $15.00 | 64,000 |
| Claude Haiku 4.5 | Routine scripting & sub-tasks | 73.3% | $1.00 | $5.00 | 64,000 |

## Intelligent Routing and Effort Scaling

A sophisticated agentic harness must include a classifier, often
implemented as a lightweight model like Haiku or a specialized natural
language understanding (NLU) module, to determine the appropriate model
for a given request. Research indicates that the cost of using an
underpowered model for a complex task is measured not in API fees, but in
the human labor hours required to debug erroneous outputs.
Consequently, high-ambiguity architectural tasks should automatically
route to Opus, while active execution phases can switch to Sonnet to
balance speed and accuracy.

A novel feature in the Claude 4.5 generation is the "effort" parameter,
which allows developers to modulate the thoroughness of the model's
reasoning. Claude Opus 4.5, when set to medium effort, has been shown to
match the peak performance of Sonnet 4.5 while utilizing 76% fewer
output tokens. This suggests that "reasoning density", the amount of
intelligence applied per token, is a critical metric for optimizing
agentic workflows. By scaling effort to query complexity, developers can
prevent "overinvestment" in simple queries, a common failure mode in
early agentic systems where models would spend excessive reasoning tokens
on trivial fact-finding missions.


# Orchestration Standards: Hierarchy vs. Parallelism

The orchestration of coding agents involves a fundamental choice between
hierarchical supervision and parallel execution. While single-agent
systems are simpler to implement, they hit a performance ceiling when
managing more than 15 tools, as the increasing complexity of the system
prompt and the length of the tool documentation lead to degraded accuracy
and increased latency.

## The Hierarchical Supervisor Pattern

The hierarchical supervisor pattern is the "workhorse" for
enterprise-scale software engineering tasks. In this architecture, a
central orchestrator agent (the "Lead") decomposes a high-level goal
into discrete subtasks and assigns them to specialized worker agents.
These workers, such as a "Filesystem Analyst," a "Test Engineer," and a
"Security Auditor", execute their functions within isolated context
windows and report their results back to the supervisor. This pattern
provides several critical advantages:

1. **Observability and Inspectability**: By separating strategy and
   execution, the system becomes easier to audit. Failures in the
   planning phase are clearly distinguishable from implementational
   errors at the worker level.
2. **Context Isolation**: Subagents function as a "context firewall."
   They consume the "noise" of raw tool outputs and logs, returning only
   a condensed summary (e.g., 1,000 tokens) to the lead agent. This
   prevents the primary orchestration thread from becoming overwhelmed
   by irrelevant data, a phenomenon known as "context bloat".
3. **Governance**: Hierarchical systems integrate naturally with
   human-in-the-loop (HITL) checkpoints. A supervisor can pause the
   workflow for human approval before a subagent commits a high-risk
   change to a production codebase.

However, the trade-off for this control is increased latency. Supervisor
patterns can degrade performance by 39-70% on tasks that require purely
sequential reasoning due to the communication overhead between layers.

## Parallel Execution and Swarms

Parallel execution involves a "fan-out" approach where multiple agents
work on independent subtasks simultaneously. This is particularly
effective for research-heavy tasks, where parallel tool calling can
reduce task completion time by up to 90%. In the Claude Code environment,
this has evolved into "Agent Swarms" or teams, where specialized agents
can communicate with each other directly via an inbox-based messaging
system.

| Feature | Subagents (Hierarchical) | Agent Teams (Swarms) |
|---|---|---|
| Communication | Report only to parent agent | Peers can message each other directly |
| Coordination | Parent agent manages all state | Shared task list with self-coordination |
| Context | Isolated; parent sees summaries | Independent windows; peer-to-peer context sharing |
| Token Cost | Lower (controlled routing) | Higher (redundant peer reasoning) |
| Best Use Case | Focused tasks with clear deliverables | Complex work requiring adversarial debate |

A compelling use case for parallel teams is "adversarial debugging,"
where multiple teammates are spawned to investigate competing hypotheses
for a bug. By debating their findings, the team can converge on a root
cause faster than a single agent, which often suffers from "anchoring
bias", once it explores one theory, its subsequent investigations are
biased toward confirming it.

## Subagents vs. Bash Scripts for Orchestration

In the early stages of agent development, many engineers used bash
scripts and tmux split-panes to orchestrate parallel model calls. While
this provides a high degree of transparency, allowing the developer to
see multiple terminal buffers simultaneously, it lacks the cognitive
integration required for complex software development. Modern best
practices favor the "TeammateTool" and native orchestration within the
agent's harness. These tools allow the lead agent to spawn "ephemeral
teammates" that inherit the project's configuration (e.g., CLAUDE.md,
MCP servers) while maintaining an independent conversation history. This
native orchestration is superior to bash scripts because it enables
semantic feedback loops: the lead agent can interpret the failure of a
subagent and dynamically adjust the plan, rather than just receiving a
non-zero exit code from a script.


# Context Engineering: Managing the Attention Budget

Context engineering is the art of curating the set of tokens provided to
the LLM to maximize utility while minimizing the inherent constraints of
transformer architectures. Despite the availability of 200,000 and
1,000,000 token windows, research confirms that models suffer from
"context rot" and "context distraction" when overloaded with irrelevant
information.

## The Mechanism of Attention Scarcity

Transformer-based models exhibit n^2 pairwise relationships for n
tokens, meaning the computational complexity and potential for confusion
grow quadratically with the length of the prompt. This "context bloat"
manifests in several failure modes:

- **Context Poisoning**: When a hallucination or an error in a previous
  step is carried forward, influencing all future reasoning.
- **Context Clash**: When different parts of the context (e.g., old
  requirements vs. new change requests) provide conflicting instructions,
  leading to model paralysis.
- **Lost in the Middle**: The phenomenon where models pay significantly
  more attention to information at the beginning and end of a prompt
  than to information in the middle.

## Compaction and Pruning Strategies

To mitigate context bloat, agents must employ compaction techniques.
Claude Code, for example, triggers an "auto-compact" mechanism when the
context exceeds 95% of the window. This process does not merely truncate
the history; it uses the model to distill critical details, such as
architectural decisions, the current bug status, and the list of resolved
tasks, into a high-fidelity summary while discarding redundant tool
outputs.

Another advanced technique is "Loss-Aware Pruning" or "Semantic
Compression." Instead of using standard compression (like ZIP), the agent
identifies parts of the context that least contribute to the model's
predictive confidence (perplexity) and removes them. In the case of code,
this might involve stripping comments, formatting, and non-essential
function definitions that are not relevant to the current task.

| Technique | Mechanism | Primary Benefit |
|---|---|---|
| Recursive Summarization | Summary + New Chunk -> Updated Summary | Long-term memory without history growth |
| Context Pruning | Filter irrelevant sentences/tokens | Reduced noise and inference latency |
| Compaction | High-fidelity distillation of trajectory | Preserves architectural coherence |
| Isolation | Use of subagents for noisy tasks | Prevents context poisoning in lead agent |


# State Management and Knowledge Maintenance

For a coding agent to be truly autonomous, it must maintain a persistent
state across multiple sessions. Without sophisticated memory management,
every conversation starts as a "blank slate," leading to redundant work
and a lack of coherence in multi-step workflows.

## The Three Layers of Agentic Memory

Effective memory management involves balancing three distinct layers:

1. **Short-term (Ephemeral) Memory**: This is the model's immediate
   context window, holding the current conversation and recent tool
   outputs. It is volatile and does not persist across restarts.
2. **Long-term (Persistent) Memory**: This layer stores facts, user
   preferences, and historical decisions in external storage (e.g.,
   Firestore, SQLite, or a MEMORY.md file). This allows the agent to
   "remember" a dataset it analyzed or an architectural decision it made
   50 exchanges ago.
3. **Derived Memory**: This is the most powerful layer, where the agent
   autonomously compresses and organizes information. Examples include
   "episodic summaries" of past tasks or embeddings of project-specific
   coding patterns that can be retrieved via vector search.

## The "Transparent Memory" Approach

In the domain of coding agents, research suggests that the "transparent
memory" approach, treating the agent's memory as an editable file within
the workspace (e.g., PROGRESS.md or CLAUDE.md), is superior for
developer trust and auditability. This approach allows the developer to
review and even correct the agent's internal state.

Best practices for this include:

- **init.sh Scripts**: Asking an initializer agent to write an init.sh
  script that defines how to run the development server and execute
  end-to-end tests. Every subsequent agent session begins by reading
  this script, ensuring the agent always knows how to verify its work.
- **Git as Procedural Memory**: Asking the model to commit its progress
  frequently with descriptive commit messages. This allows the agent to
  use git revert to recover a working state of the codebase if its
  latest implementation fails.
- **Structured Note-taking**: The agent should maintain a persistent
  to-do list and progress file. In complex tasks like refactoring, this
  ensures that even after a context reset, the agent can read its notes
  and continue exactly where it left off.


# Standards for Orchestration and Environment Interaction

The interoperability of agents and tools is increasingly governed by
standardized protocols that prevent "vendor lock-in" and allow for the
creation of heterogeneous agent ecosystems.

## The Model Context Protocol (MCP)

The Model Context Protocol (MCP), introduced by Anthropic, has emerged
as the de facto standard for connecting AI agents to external context
providers like databases, Slack, GitHub, and local filesystems. MCP
decouples the "Brain" (the LLM) from the "Peripherals" (the tools). An
MCP-based architecture consists of:

- **MCP Servers**: Modules that expose specific capabilities (e.g.,
  querying a Postgres database or searching documentation) via a
  standardized JSON-RPC interface.
- **MCP Clients**: AI applications (like Claude Desktop or Claude Code)
  that discover these servers, inspect their capabilities, and invoke
  them using well-defined schemas.

This standardization allows for "Capability Discovery," where an agent
dynamically adapts its behavior based on the tools available in its
current environment. For instance, if an MCP server for a specific
proprietary SDK is detected, the agent can automatically incorporate
those functions into its planning phase.

## Standardized Inter-Agent Communication (A2A and LACP)

For communication between different agents, Google's Agent-to-Agent
(A2A) protocol manages the lifecycle of requests through discovery,
authorization, and communication steps. More critically, the proposed
LLM-Agent Communication Protocol (LACP) introduces a telecom-inspired
three-layer structure to ensure that agent interactions are secure,
interoperable, and transactional. LACP enforces the "narrow waist"
principle: a minimal, universal core for basic interoperability with an
extensible edge for domain-specific logic.


# The Agent-Computer Interface (ACI) and File Interaction

The way an agent interacts with the filesystem is a primary determinant
of its reliability. Research has identified a significant performance gap
between general-purpose agents and those using a specialized
Agent-Computer Interface (ACI).

## SWE-Agent and the ACI Pattern

The ACI acts as an abstraction layer between the LLM and the terminal.
Instead of providing the model with a full, unrestricted bash shell,
which often produces verbose, confusing output, the ACI offers a small
set of specialized commands:

- `view_file(path, start_line, end_line)`: For concise file reading.
- `search_dir(pattern, directory)`: For efficient codebase exploration.
- `edit_file(path, changes)`: For targeted, interactive editing.

This interface includes built-in guardrails, such as automated linting
and syntax checking during the edit phase. If the model attempts to
write code that fails a lint check, the ACI provides immediate, concise
feedback, forcing the model to fix the error before committing the
change. This "Mini-SWE-Agent" approach, which can be implemented in as
few as 100 lines of Python, demonstrates that architectural guardrails
are often more impactful than model scale alone.

## Event-Stream Architectures

Frameworks like OpenHands utilize an event-stream architecture, modeling
the agent-environment interaction as a continuous loop of Agent ->
Actions -> Environment -> Observations -> Agent. All interactions are
recorded in a persistent event log, which serves as the "source of truth"
for the agent's state. This architecture is particularly resilient, as
it allows for sessions to be paused, resumed, or audited across different
user interfaces (e.g., web UI, VSCode integration).


# Evaluation and Visual Analytics

The current approach of manually inspecting agent outputs is insufficient
for professional agent development. Research highlights the need for a
three-level comparative analysis framework to truly understand agent
behavior.

## Multi-Level Comparative Analysis

1. **Code-Level**: Highlighting differences between consecutive coding
   iterations using AST (Abstract Syntax Tree) comparison. By
   normalizing for formatting and comments, developers can see how the
   agent specifically debugged a solution.
2. **Process-Level**: Comparing multiple solution trees generated by the
   same model backbone. This reveals the agent's "solution-seeking
   policy", whether it tends to explore many ideas shallowly or drill
   deep into a single implementation.
3. **LLM-Level**: Evaluating coding behaviors across different model
   backbones (e.g., how Opus's refactoring strategy differs from
   Sonnet's). This insight allows for the fine-tuning of routing layers.

## Benchmarking Beyond SWE-bench

While SWE-bench is the gold standard for automated evaluation, it
focuses on Python repositories and may not reflect the characteristics of
proprietary, multi-language codebases. Best practices suggest creating
internal "eval sets" based on representative samples of actual work. Each
evaluation prompt should be paired with a verifiable outcome, either a
string comparison, a successful build, or an LLM-as-a-judge metric using
a more capable model like Opus 4.5 to grade the output of a smaller
model.


# Best Practices for Prompting the Orchestrator

The "Lead" agent's prompt is the most sensitive component of the system.
Research from Anthropic's research systems suggests several heuristics
for prompting orchestrators:

- **Think Like the Agent**: Developers should use simulations to watch
  agents work step-by-step. This reveals hidden failure modes, such as
  agents continuing to search when they already have sufficient results.
- **Teach Explicit Delegation**: The lead agent must be instructed to
  provide detailed task descriptions to subagents, including the
  required output format and tool boundaries. Vague instructions like
  "research the semiconductor shortage" often lead to redundant work
  among parallel subagents.
- **The "Start Wide, Then Narrow" Heuristic**: Prompt the agent to begin
  with short, broad queries to understand the landscape before drilling
  into specific implementation details. Agents often default to overly
  specific queries that return zero results in unfamiliar codebases.


# Conclusions and Practical Implications

Building professional-grade coding agents with the Claude 4.5 family
requires a shift from "Vibe Coding" to rigorous architectural
engineering. The most effective systems are characterized by three core
principles:

First, **Cognitive Tiering**: the harness must intelligently route tasks,
using the reasoning density of Opus for planning and the throughput of
Sonnet and Haiku for execution.

Second, **Context Sovereignty**: the use of hierarchical subagents and
active compaction mechanisms is necessary to prevent context bloat and
ensure that models maintain focus over long-horizon tasks.

Third, **Standardized Interoperability**: the adoption of protocols like
MCP and A2A ensures that the agent is not a brittle, monolithic script,
but a modular system capable of interacting with a diverse and evolving
environment.

Furthermore, the transition from bash-scripted parallelism to native
swarms using the TeammateTool allows for a more nuanced coordination of
labor, where agents can engage in adversarial debates to disprove faulty
hypotheses. By grounding these agents in a "Transparent Memory"
framework, where state is maintained in accessible files like PROGRESS.md
and through clean Git commit logs, developers can ensure that their
agents remain auditable and robust. As these systems move toward the
"narrow waist" of standardized communication protocols, the potential for
collaborative AI to handle the full software development lifecycle will
continue to expand, eventually rivaling human-level expertise in complex,
engineering-oriented tasks.


# Works cited

1. A Survey on Code Generation with LLM-based Agents - arXiv.org,
   accessed March 13, 2026,
   https://arxiv.org/html/2508.00083v1
2. Skill Issue: Harness Engineering for Coding Agents | HumanLayer Blog,
   accessed March 13, 2026,
   https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents
3. Claude AI Available Models: Supported Models, Version Differences,
   Capability Comparison, and Access Conditions - Data Studios, accessed
   March 13, 2026,
   https://www.datastudios.org/post/claude-ai-available-models-supported-models-version-differences-capability-comparison-and-access
4. Claude AI Models 2025: Opus, Sonnet, or Haiku - Which Should You
   Choose?, accessed March 13, 2026,
   https://www.firstaimovers.com/p/claude-ai-models-opus-sonnet-haiku-2025
5. Claude Opus vs Sonnet vs Haiku: Coding, Speed, Pricing Test - Dextra
   Labs, accessed March 13, 2026,
   https://dextralabs.com/blog/claude-opus-vs-sonnet-vs-haiku/
6. Which Claude Model Is Best for Coding: Opus vs Sonnet vs Haiku -
   DataAnnotation, accessed March 13, 2026,
   https://www.dataannotation.tech/developers/which-claude-model-is-best-for-coding
7. What is Anthropic Claude 4.5 and What Makes It Different - MindStudio,
   accessed March 13, 2026,
   https://www.mindstudio.ai/blog/claude-4-1
8. Context Length Management in LLM Applications by cbarkinozer |
   Softtech, accessed March 13, 2026,
   https://medium.com/softtechas/context-length-management-in-llm-applications-89bfc210489f
9. Designing Multi-Agent Intelligence - Microsoft for Developers,
   accessed March 13, 2026,
   https://developer.microsoft.com/blog/designing-multi-agent-intelligence
10. How we built our multi-agent research system - Anthropic, accessed
    March 13, 2026,
    https://www.anthropic.com/engineering/multi-agent-research-system
11. Multi-Agent Architecture Guide (March 2026) - Openlayer, accessed
    March 13, 2026,
    https://www.openlayer.com/blog/post/multi-agent-system-architecture-guide
12. Multi-Agent Systems - Agility at Scale, accessed March 13, 2026,
    https://agility-at-scale.com/ai/agents/multi-agent-systems/
13. Hierarchical Multi-Agent Systems: Concepts and Operational
    Considerations - Over Coffee, accessed March 13, 2026,
    https://overcoffee.medium.com/hierarchical-multi-agent-systems-concepts-and-operational-considerations-e06fff0bea8c
14. Effective context engineering for AI agents - Anthropic, accessed
    March 13, 2026,
    https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
15. Multi-agent system: Frameworks & step-by-step tutorial - n8n Blog,
    accessed March 13, 2026,
    https://blog.n8n.io/multi-agent-systems/
16. Orchestrating Subagents & Claude Skills = Much Better Code &
    Projects? : r/vibecoding - Reddit, accessed March 13, 2026,
    https://www.reddit.com/r/vibecoding/comments/1pg1y75/orchestrating_subagents_claude_skills_much_better/
17. Claude Code Swarms - Addy Osmani, accessed March 13, 2026,
    https://addyosmani.com/blog/claude-code-agent-teams/
18. Context Engineering - LangChain Blog, accessed March 13, 2026,
    https://blog.langchain.com/context-engineering-for-agents/
19. The Fundamentals of Context Management and Compaction in LLMs | by
    Isaac Kargar, accessed March 13, 2026,
    https://kargarisaac.medium.com/the-fundamentals-of-context-management-and-compaction-in-llms-171ea31741a2
20. LLM Context Pruning: A Developer's Guide to Better RAG and Agentic
    AI Results - Milvus, accessed March 13, 2026,
    https://milvus.io/blog/llm-context-pruning-a-developers-guide-to-better-rag-and-agentic-ai-results.md
21. AI Agent Memory Management - When Markdown Files Are All You Need? -
    Dev.to, accessed March 13, 2026,
    https://dev.to/imaginex/ai-agent-memory-management-when-markdown-files-are-all-you-need-5ekk
22. Memory Management & State in Google ADK: Practical Patterns for ...,
    accessed March 13, 2026,
    https://medium.com/@purusharthyadav.py/memory-management-state-in-google-adk-practical-patterns-for-real-world-ai-agents-e62953ba71e5
23. Persistent Memory for AI Agents: Comparing PAG, MEMORY.md, and
    SQLite - Sparkco, accessed March 13, 2026,
    https://sparkco.ai/blog/persistent-memory-for-ai-agents-comparing-pag-memorymd-and-sqlite-approaches
24. Effective harnesses for long-running agents - Anthropic, accessed
    March 13, 2026,
    https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
25. Understanding AI Agent Protocols: MCP, A2A, and ACP Explained -
    AnswerRocket, accessed March 13, 2026,
    https://answerrocket.com/understanding-ai-agent-protocols-mcp-a2a-and-acp-explained/
26. Comparative Analysis of Open-Source Agent Communication Protocols:
    MCP, ANP, Agora, agents.json, LMOS, and AITP, accessed March 13,
    2026,
    https://agent-network-protocol.com/blogs/posts/agent-communication-protocols-comparison.html
27. Guide to AI Agent Protocols: MCP, A2A, ACP & More - GetStream.io,
    accessed March 13, 2026,
    https://getstream.io/blog/ai-agent-protocols/
28. Introducing the Model Context Protocol - Anthropic, accessed March
    13, 2026,
    https://www.anthropic.com/news/model-context-protocol
29. LLM Agent Communication Protocol (LACP) Requires Urgent
    Standardization: A Telecom-Inspired Protocol is Necessary - arXiv,
    accessed March 13, 2026,
    https://arxiv.org/html/2510.13821v1
30. LLM Agent Communication Protocol (LACP) Requires Urgent
    Standardization: A Telecom-Inspired Protocol is Necessary -
    OpenReview, accessed March 13, 2026,
    https://openreview.net/pdf?id=oM9ibtZWV
31. OpenHands vs SWE-Agent: Best AI Coding Agent 2026 | Local AI ...,
    accessed March 13, 2026,
    https://localaimaster.com/blog/openhands-vs-swe-agent
32. Illuminating LLM Coding Agents: Visual Analytics for Deeper
    Understanding and Enhancement - arXiv.org, accessed March 13, 2026,
    https://arxiv.org/html/2508.12555v1
33. Writing effective tools for AI agents - Anthropic, accessed March 13,
    2026,
    https://www.anthropic.com/engineering/writing-tools-for-agents
