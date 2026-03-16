---
title: "Security Auditor"
summary: "Scans content for confidential data, prompt injection, and OWASP LLM Top 10 concerns."
keywords:
  - security-auditor
  - agent
  - security
  - owasp
related:
  - wiki/agent-team/index.html
scope: "Security Auditor agent: role, what it scans, output format."
last_verified: 2026-03-15
---

## Role

The Security Auditor scans content before it ships to catch confidential
data leaks, prompt injection risks, and OWASP LLM Top 10 concerns.
Read-only. Returns a report but does not edit files.

## Identity

![Security Auditor avatar](/images/agent-security-auditor.png)

- **Model**: Opus
- **Animal totem**: Pangolin (natural armor, defensive posture)

## What it scans

- **Confidential data**: authenticated API output, analytics, financials,
  secrets, Linear details, PII, infrastructure details
- **Prompt injection**: override instructions, hidden directives, data
  exfiltration attempts, permission escalation
- **OWASP LLM06 (Excessive Agency)**: agents with more tools than needed
- **OWASP LLM05 (Improper Output Handling)**: agent output piped to shell/eval
- **OWASP LLM01 (Prompt Injection)**: injection vectors in agent-consumed content
- **Secrets in code blocks**: hardcoded keys, real IPs, account IDs

## Severity levels

| Level | Examples |
|-------|---------|
| BLOCK | Secrets, API keys, PII, active prompt injection |
| REDACT | Spend amounts, session counts, authenticated API output |
| OK | Public info, architecture descriptions, tool names |

## Invocation

Subagent only. Called by Publisher via the Agent tool:

```
Agent(subagent_type="security-auditor", prompt="...", description="...")
```

## Agent definition

Source: `.claude/agents/security-auditor.md`
