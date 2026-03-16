---
title: "Anthropic Guidance on Building Agents"
summary: "Key findings from 7 Anthropic publications on agent design, context engineering, tool use, multi-agent systems, and autonomy measurement."
keywords:
  - anthropic
  - agents
  - context-engineering
  - tool-design
  - multi-agent
  - subagents
related:
  - wiki/research
  - wiki/research/coding-agent-best-practices
  - wiki/agent-team
scope: "Extracted findings from Anthropic's published guidance on building effective agents. One section per source page."
last_verified: 2026-03-15
---

Bullet-point findings extracted from 7 Anthropic publications.
These are first-party recommendations from the team that builds
Claude, not third-party research. Used as inputs alongside
[Deep Research reports](/wiki/research/coding-agent-best-practices.html)
for agent definition improvements.

## Building Effective Agents

Source: [anthropic.com/research/building-effective-agents](https://www.anthropic.com/research/building-effective-agents)

- Start with the simplest pattern possible. Add complexity only
  when measurable improvements justify the cost.
- Five composable workflow patterns: chaining, routing,
  parallelization, orchestrator-worker, evaluator-optimizer.
- Orchestrator-worker fits coding tasks best because subtasks
  can't be predefined. A central LLM dynamically decomposes
  and delegates.
- Evaluator-optimizer: generator + evaluator in an iterative
  loop. PwC reports 7x accuracy improvement (10% to 70%).
- Framework abstraction is an anti-pattern. Many patterns need
  only a few lines of direct API code. Frameworks obscure
  prompts and make debugging harder.
- Tool design is a primary failure mode. SWE-bench teams found
  switching from relative to absolute file paths eliminated a
  whole class of errors.
- Treat tool documentation with the same rigor as system
  prompts: parameter descriptions, example usage, edge cases,
  and explicit boundaries between similar tools.
- Code is well-suited for agents because automated tests
  provide objective verification.

## Effective Harnesses for Long-Running Agents

Source: [anthropic.com/engineering/effective-harnesses-for-long-running-agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

- Long-running agents lose context across sessions. Each new
  window starts with no memory of prior work.
- Two-agent architecture: an Initializer creates environment
  scripts and progress files; a Coding agent reads those
  artifacts and works one feature at a time.
- Agents try to complete everything at once and exhaust context
  mid-feature. Constraining to one feature per session prevents
  this.
- Use JSON (not Markdown) for feature lists and test status to
  prevent agents from misinterpreting or corrupting them.
- Start each session with verification: read progress, select
  next feature, run integration test before writing new code.
- Explicit instruction: never remove or edit tests. Agents will
  delete failing tests to mark features complete.
- Browser automation (Playwright/Puppeteer) dramatically
  improved bug detection over unit tests alone. Agents without
  it declared completion on half-working features.
- Git commit history provides verifiable work logs and
  checkpoints restorable between sessions.

## Claude Code Best Practices

Source: [code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)
(Note: original URL redirected; findings from live equivalent pages)

- Be explicit about actions. "Can you suggest changes?" causes
  Claude to suggest only. "Change this function" causes it to
  act.
- Parallel tool calling: instruct Claude to call independent
  tools simultaneously for reduced latency.
- If your harness compacts context, tell Claude in the system
  prompt so it doesn't prematurely wrap up work.
- Multi-context window strategy: first window writes tests and
  setup scripts; subsequent windows iterate on a todo list.
- Opus tends to overengineer. Explicitly instruct: "Only make
  changes directly requested. Keep solutions simple."
- Models may hard-code values to pass tests rather than
  implement correct logic. Prompt: "Write a general-purpose
  solution."
- Instruct Claude to never speculate about code it hasn't read.
- Use adaptive thinking for agentic workloads instead of manual
  thinking budget tuning.
- Plan mode (`--permission-mode plan`) for safe codebase
  exploration before making changes.
- Git worktrees (`--worktree`) for parallel sessions with
  isolated branches.

## Writing Tools for Agents

Source: [anthropic.com/engineering/writing-tools-for-agents](https://www.anthropic.com/engineering/writing-tools-for-agents)

- Tools bridge deterministic and non-deterministic systems.
  Agents may skip tools, hallucinate them, or use them in
  unexpected ways. Design for this uncertainty.
- Fewer, well-designed tools beat many overlapping ones.
  Consolidate related operations.
- Namespace tool names with consistent prefixes to reduce
  agent confusion.
- Return high-signal data: human-readable names over UUIDs.
- Allow agents to request output verbosity via a
  `response_format` parameter to manage their own context
  budget.
- Treat tool descriptions like onboarding documentation. Make
  implicit knowledge explicit. Precise description adjustments
  produced state-of-the-art SWE-bench results.
- Measure beyond accuracy: track call volume, redundant calls,
  error patterns, token consumption.
- Error messages must guide better tool use, not return raw
  tracebacks.
- Evaluation-driven development: prototype, test with 50+
  realistic tasks grounded in real workflows, analyze reasoning
  not just accuracy, iterate.

## Effective Context Engineering for AI Agents

Source: [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

- Context rot is real. Model accuracy declines as context grows.
  Treat context as a finite resource regardless of window size.
- System prompt altitude: avoid overly rigid (hardcoded
  conditional logic) and overly vague. Use XML tags or Markdown
  headers to structure prompts. Start minimal, iterate based on
  failure modes.
- If engineers can't decide which tool applies, agents won't
  either. Overlapping tools waste tokens and cause confusion.
- Just-in-time context loading: store lightweight identifiers
  (file paths, queries, links) rather than full objects. Agents
  retrieve context dynamically during execution.
- Hybrid retrieval: combine upfront loading (CLAUDE.md at start)
  with autonomous exploration (grep/glob at runtime).
- Compaction: summarize conversation history before limits hit.
  Maximize recall first, then iterate for precision.
- Agentic memory: maintain persistent external files consulted
  across context resets for multi-hour task progress and
  architectural decisions.
- Sub-agent architecture for context efficiency: specialized
  agents handle focused tasks with clean windows, return
  condensed 1,000-2,000 token summaries.
- Anti-patterns: assuming LLMs handle long contexts efficiently,
  pre-loading all potential data upfront, overly aggressive
  compaction causing information loss.

## Multi-Agent Research System

Source: [anthropic.com/engineering/multi-agent-research-system](https://www.anthropic.com/engineering/multi-agent-research-system)

- Multi-agent (Opus lead + Sonnet subagents) outperformed
  single-agent Opus by 90.2% on research tasks. Parallelism
  reduces research time by up to 90%.
- Token economics: multi-agent uses ~15x more tokens than chat;
  single agents use ~4x. High-value tasks required to justify
  cost.
- Think like your agents: build simulations with exact prompts
  and tools to observe failure modes step-by-step.
- Teach delegation: give subagents clear objectives, output
  formats, tool guidance, and task boundaries. Vague
  instructions cause duplicate work and missed information.
- Scale effort to complexity: simple fact-finding uses 1 agent
  with 3-10 calls; complex research uses 10+ subagents.
- Start wide, then narrow: begin with broad queries, evaluate,
  progressively narrow. Mirrors expert human research.
- Parallel execution targets: 3-5 subagents in parallel, 3+
  parallel tool calls per subagent.
- Anti-patterns: spawning excessive subagents for simple
  queries, overly verbose search queries, pursuing nonexistent
  information indefinitely.

## Measuring Agent Autonomy

Source: [anthropic.com/research/measuring-agent-autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)

- Claude Code's longest sessions nearly doubled from under 25
  minutes to over 45 minutes between October 2025 and January
  2026.
- Deployment overhang: METR estimates Claude can handle 5-hour
  tasks at 50% success. Actual median session is 45 seconds.
  Users underutilize the model's capability.
- New users auto-approve ~20% of the time; experienced users
  reach 40%+. But experienced users also interrupt more often
  (5% to 9% of turns), shifting from approving everything to
  strategic monitoring and intervention.
- Agents self-limit more than users do: agents ask for
  clarification more than twice as often on complex tasks
  compared to human interruptions.
- Mandating exhaustive pre-approval workflows is
  counterproductive. Experienced users develop better instincts
  through monitoring.
- 80% of tool calls have safeguards; 73% involve human
  oversight; only 0.8% are irreversible actions.
