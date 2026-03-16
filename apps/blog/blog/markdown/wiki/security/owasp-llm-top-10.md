---
title: "OWASP Top 10 for LLM Applications (2025)"
summary: "Complete OWASP LLM Top 10 (2025) reference with descriptions, applicability to this project, and which controls currently address each risk."
keywords:
  - owasp
  - llm-top-10
  - security
  - prompt-injection
  - excessive-agency
  - sensitive-information
  - supply-chain
  - agent-security
related:
  - wiki/security
  - wiki/security/confidential-data-policy
  - ai-security-toolkit
scope: "Documents all 10 OWASP LLM risks with applicability analysis for Kyle's agent system. Does not reproduce the full OWASP specification text."
last_verified: 2026-03-15
---


The OWASP Top 10 for LLM Applications (2025) is the primary risk
framework for AI/LLM security. This page documents each entry with
a description, how it applies to this project, and what controls
are in place.

Source: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/)


## Quick Reference

| ID | Name | Applies Here | Current Controls |
|----|------|-------------|-----------------|
| LLM01 | Prompt Injection | Yes | Security Auditor agent |
| LLM02 | Sensitive Information Disclosure | Yes | Security Auditor agent, confidential data policy |
| LLM03 | Supply Chain | Yes | Trivy, semgrep, pinned dependencies |
| LLM04 | Data and Model Poisoning | No | N/A (not training models) |
| LLM05 | Improper Output Handling | Yes | Security Auditor agent |
| LLM06 | Excessive Agency | Yes | Security Auditor agent, scoped tool lists |
| LLM07 | System Prompt Leakage | Partially | Not yet covered |
| LLM08 | Vector and Embedding Weaknesses | No | N/A (no RAG/embedding pipeline) |
| LLM09 | Misinformation | Yes | Reviewer agent (fact-checking, sourcing) |
| LLM10 | Unbounded Consumption | Partially | Claude Code permission model |


## LLM01:2025 Prompt Injection

Manipulating LLMs via crafted inputs to override instructions,
bypass safety controls, or exfiltrate data. Includes both direct
injection (user prompt) and indirect injection (injected into
content the LLM processes, like wiki pages or web results).

**Applicability**: High. Agents consume wiki pages, blog content,
and external web content. Any of these could contain injection
attempts.

**Controls**:
- Security Auditor scans agent-facing content for override
  instructions, hidden directives, and exfiltration attempts
- Claude Code's permission model requires human approval for
  dangerous operations
- Agent tool lists are scoped to minimum required permissions


## LLM02:2025 Sensitive Information Disclosure

LLM outputs inadvertently expose confidential data: PII, API keys,
internal metrics, financial data, or authenticated API responses.
This includes both training data leakage and runtime disclosure
where the model has access to sensitive context.

**Applicability**: High. Agents have access to analytics (GA4),
project management (Linear), and infrastructure tools. Any of this
data could leak into blog posts or public content.

**Controls**:
- Security Auditor has a detailed confidential data checklist
- Core rule: "if you would need to log in to see it, it's private"
- Separate confidential data policy document
- See [Confidential Data Policy](/wiki/security/confidential-data-policy.html)


## LLM03:2025 Supply Chain

Risks from compromised third-party components: model weights,
training data, plugins, packages, and base images. In an agent
context, this includes MCP servers, npm packages, Docker base
images, and any dependency the agent system relies on.

**Applicability**: Yes, but handled outside the agent layer.
Dependencies flow through npm (blog), pip (tools), and Docker
base images (security toolkit).

**Controls**:
- Trivy scans `package-lock.json` for known CVEs
- Trivy scans Docker images for OS-level vulnerabilities
- Semgrep runs static analysis on all code
- Pre-commit hooks block commits with new findings
- Zero-vuln policy for active projects
- See CLAUDE.md "Security Scanning" section for scan commands


## LLM04:2025 Data and Model Poisoning

Tampering with training data or fine-tuning data to introduce
backdoors, biases, or vulnerabilities into the model itself.

**Applicability**: None. This project uses Claude via API. No
custom training, fine-tuning, or model hosting is involved.

**Controls**: N/A


## LLM05:2025 Improper Output Handling

Failing to validate, sanitize, or escape LLM-generated output
before passing it to downstream systems. This includes executing
agent-generated shell commands without review, using LLM output
in SQL queries, or rendering it as HTML without sanitization.

**Applicability**: Yes. Agents generate markdown that becomes
HTML, and could potentially generate shell commands.

**Controls**:
- Security Auditor flags patterns where agent output feeds
  directly into `bash`, `eval`, or system commands
- Blog uses DOMPurify for HTML sanitization
- Claude Code requires human approval before executing commands
  (unless auto-approved)


## LLM06:2025 Excessive Agency

Granting LLMs too many capabilities, too much autonomy, or
insufficient access controls. The risk is that the model takes
actions beyond what its role requires, whether through overly
broad tool access, missing permission boundaries, or lack of
human oversight.

**Applicability**: High. The agent system has multiple agents
with different tool sets. Over-provisioning tools is a real risk.

**Controls**:
- Security Auditor flags agent definitions that grant Write/Edit
  without a clear scoped reason
- Security Auditor flags unnecessary Bash access
- Agent definitions use explicit tool allowlists
- Read-only agents (Researcher, Reviewer, Security Auditor) have
  no write tools
- Publisher has write tools but operates under human review


## LLM07:2025 System Prompt Leakage

System prompts, agent definitions, or internal instructions
being exposed to end users or appearing in public output. This
can reveal business logic, security controls, internal tool
configurations, or sensitive operational details.

**Applicability**: Partial. Agent definitions live in
`.claude/agents/` and are checked into the public repo, so the
definitions themselves are not secret. The risk is more about
internal operational details (like specific API configurations
or internal URLs) leaking into blog post content.

**Controls**:
- Not currently covered by the Security Auditor
- Agent definitions are intentionally public (open-source repo)
- Confidential data policy covers some overlap (internal configs)

**Gap**: Could add a check to the Security Auditor for internal
tool configurations or `.claude/` content appearing in blog output.


## LLM08:2025 Vector and Embedding Weaknesses

Vulnerabilities in RAG (Retrieval-Augmented Generation) pipelines
and embedding stores: poisoned embeddings, retrieval of stale or
manipulated context, adversarial document injection into the
vector store.

**Applicability**: None currently. The wiki-rag system uses
keyword-based retrieval, not vector embeddings. If a vector
database is added later, this becomes relevant.

**Controls**: N/A


## LLM09:2025 Misinformation

LLMs generating false, misleading, or fabricated content.
Includes hallucinated facts, fabricated citations, invented
personal anecdotes, and confidently stated inaccuracies.

**Applicability**: High. The blog publishes technical content
where accuracy matters. Agent-written posts could contain
hallucinated commands, wrong version numbers, or fabricated
benchmarks.

**Controls**:
- Reviewer agent checks sourcing and fact accuracy
- Style guide requires honesty: no fabricated anecdotes, no
  embellishment, state what happened plainly
- Researcher agent gathers sourced facts before writing
- Human review before publishing


## LLM10:2025 Unbounded Consumption

Unrestricted resource usage leading to denial of service,
excessive costs, or resource exhaustion. Includes runaway token
generation, recursive agent loops, and API cost explosions.

**Applicability**: Partial. Agents run locally via Claude Code
with usage-based billing. Runaway loops or excessive tool calls
could drive up API costs.

**Controls**:
- Claude Code has built-in context limits and conversation
  management
- No automated agent loops without human oversight (yet)
- OpenRouter usage tracking available via MCP

**Gap**: No hard spending caps or automated circuit breakers
for agent API costs. Worth addressing as automation increases.
