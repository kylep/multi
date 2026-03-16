---
title: "Confidential Data Policy"
summary: "Rules for what data agents must never include in blog posts or public content. Core principle: if you need to log in to see it, it's private."
keywords:
  - confidential-data
  - privacy
  - data-leakage
  - agent-policy
  - security
related:
  - wiki/security
  - wiki/security/owasp-llm-top-10
scope: "Defines what agents must flag or redact in public-facing content. Does not cover internal data handling or storage."
last_verified: 2026-03-15
---


Core principle: **if you would need to log in to see it, it's private.**

This is a hard rule with no exceptions. If data was retrieved by any
tool or API that required authentication (OAuth, API keys, login
credentials), it must not appear in public content. Do not reason
about whether the data is independently discoverable.

This policy maps to [LLM02:2025 Sensitive Information Disclosure](/wiki/security/owasp-llm-top-10.html).


## Must Flag (REDACT or BLOCK)

- **Authenticated API output**: any data from an API that required
  OAuth, API keys, or login. Zone details, DNS records from dashboards,
  account metadata, usage stats, resource lists, nameservers from
  account views, project/workspace details.
- **Analytics data**: GA4 sessions, pageviews, traffic sources, bounce
  rates, user counts, conversion metrics.
- **Financial data**: spend amounts, credit balances, billing details,
  budget numbers, pricing from private accounts.
- **Secrets**: API keys, tokens, passwords, connection strings.
- **Linear details**: specific issue counts, velocity metrics, sprint
  data. Public-facing issue titles are OK.
- **Personal information**: emails, names (other than Kyle's),
  addresses, phone numbers.
- **Infrastructure internals**: internal IPs, hostnames, private
  configs, database connection details.


## OK to Publish

- Tool names, product names, endpoint URLs from public docs
- General descriptions of what an API can do
- Placeholder examples (`G-XXXXXXXXXX`, `example.com`, `203.0.113.1`)
- Architecture diagrams and setup steps
- The fact that a service is used (but not account details)
- Open-source code, public documentation quotes, RFC references


## Severity Levels

| Level | Meaning | Examples |
|-------|---------|---------|
| BLOCK | Must remove before publishing | Secrets, API keys, PII, active prompt injection |
| REDACT | Replace with general language | Specific numbers (spend, sessions, issue counts), authenticated API output |
| OK | Safe for public content | Public info, architecture, tool names, general patterns |
