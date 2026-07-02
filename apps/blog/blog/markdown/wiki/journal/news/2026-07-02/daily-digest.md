---
title: "Daily Digest: 2026-07-02"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-02
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-02
---

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-sonnet-5) Claude Sonnet 5 launched June 30 and became the default model on all tiers July 1. It scores 80.4% on Terminal-Bench 2.1 versus Sonnet 4.6's 67.0%, approaches Opus 4.8 quality on professional tasks, and is priced at $2 per million input tokens and $10 per million output tokens through August 31.

- [Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/z-ai-free-glm-5-2-tops-the-open-weight-ai-rankings-on-all-huawei-silicon) Z.ai's GLM-5.2 now tops open-weight AI rankings under an MIT license with no usage restrictions. The model uses a 744B parameter mixture-of-experts architecture with a 1M-token context window, was trained entirely on Huawei Ascend 910B chips, and costs roughly $1.40/$4.40 per million input/output tokens through OpenRouter. Z.ai has been on the US Entity List since January 2025.

## AI Tooling

- [Cursor Blog](https://cursor.com/blog/teams-pricing-june-2026) Cursor Teams pricing restructures effective July 1 for renewals. Standard seats move to $32/seat/month annually, splitting usage into separate Cursor-model and third-party API pools. A new Premium tier at $96/seat/month offers 5x usage headroom for teams running agents continuously.

## Security

- [CloudNativePG](https://cloudnative-pg.io/releases/cloudnative-pg-1-29.1-released/) CVE-2026-44477 (CVSS 9.4) in CloudNativePG's metrics exporter allows any low-privilege database user to escalate to PostgreSQL superuser and execute OS-level commands inside the primary pod. Patched in versions 1.28.3 and 1.29.1; all users should upgrade immediately.

## Local

- [Town of Whitby](https://www.whitby.ca/news/posts/things-to-do-in-whitby-this-july-2026/) Whitby Ribfest returns July 10-12 at Victoria Fields. Friday includes a free public rib zone; Saturday and Sunday are free admission. Over 50,000 guests expected.

## Weather

- Whitby: 35°C high, 21-25°C low, 40% chance of showers. Orange heat warning remains active through July 3 — up to 37°C possible in some areas.

## Just for You

- [GitHub](https://github.com/DeusData/codebase-memory-mcp) codebase-memory-mcp holds at #2 on GitHub trending with 9,697 weekly stars. It is a single-binary MCP server that indexes any codebase into a persistent knowledge graph across 158 languages with sub-millisecond query latency and no external dependencies.

---

## Update — 15:00 UTC

## AI Industry

- [Fortune](https://fortune.com/2026/07/02/sam-altman-new-world-order-ai-openai-google-anthropic/) ChatGPT's share of generative AI traffic fell below 50% for the first time in May. Anthropic has overtaken OpenAI in business subscriptions and projects $47B in annualized revenue versus OpenAI's $25-33B range.

- [Fortune](https://fortune.com/2026/07/02/sam-altman-new-world-order-ai-openai-google-anthropic/) Sam Altman called for a U.S.-led international AI governance forum modeled on aviation safety standards and the IAEA, citing OpenAI's weakening competitive position as context for the proposal.

## AI Tooling

- [GitHub](https://releasebot.io/updates/github) GitHub Copilot added Claude Sonnet 5 as a generally available model on June 30 for Pro, Pro+, Max, Business, and Enterprise tiers across VS Code, JetBrains, and GitHub.com — all under Zero Data Retention. Claude Opus 4.8 fast mode also entered preview.

- [TechCrunch](https://techcrunch.com/2026/07/01/gemini-spark-googles-agentic-assistant-is-now-available-on-mac/) Gemini Spark, Google's background AI agent, is now available in the Mac desktop Gemini app for Google AI Ultra subscribers in the U.S. It can track topics in real time and connect to Google Tasks and Google Keep.

## Security

- [The Hacker News](https://thehackernews.com/2026/07/sharepoint-rce-cve-2026-45659-added-to.html) CISA added CVE-2026-45659 (CVSS 8.8) to its Known Exploited Vulnerabilities catalog after active exploitation in the wild. The SharePoint deserialization flaw affects Server 2016, 2019, and Subscription Edition; any user with Site Member permissions can exploit it remotely. Microsoft patched it in May; U.S. agencies must apply the fix by July 4. Threat actor Storm-2603 has previously used SharePoint flaws to deploy Warlock ransomware.

- [The Hacker News](https://thehackernews.com/2026/07/unpatched-argo-cd-repo-server-flaw.html) An unpatched flaw in Argo CD's repo-server (no CVE assigned) lets unauthenticated attackers on the internal network execute arbitrary code by abusing the kustomize `--helm-command` option via a malicious Git repository. Exploitation can lead to full Kubernetes cluster takeover. No patched release exists; network policies isolating the repo-server port are the primary mitigation. Researchers reported the issue to maintainers in January 2025.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto/toronto-two-weather-alerts-canada-day-9.7255415) FIFA World Cup 2026 brings Portugal versus Croatia to Toronto Stadium on July 2. The City cancelled all public match screenings at Nathan Phillips Square due to the ongoing orange heat warning, with temperatures reaching 34-37°C.
