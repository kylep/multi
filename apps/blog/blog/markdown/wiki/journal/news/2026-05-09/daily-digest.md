---
title: "Daily Digest: 2026-05-09"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-09
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-09
---

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/04/29/sources-anthropic-could-raise-a-new-50b-round-at-a-valuation-of-900b/) Anthropic is exploring a $50 billion funding round at a $900 billion valuation, which would put it ahead of OpenAI's $852 billion March valuation. Anthropic's annualized revenue run rate recently crossed $30 billion, up from roughly $9 billion at end of 2025, and is now tracking closer to $40 billion. A close is expected within weeks.

## AI Tooling

- [9to5Google](https://9to5google.com/2026/05/05/google-ai-ultra-lite-gemini-usage-limits/) Google is preparing a new "AI Ultra Lite" subscription tier for Gemini, codenamed Neon, to slot between the $20 Pro and $250 Ultra plans. A new usage dashboard showing remaining token budgets is also in development. Google I/O on May 19 is the likely reveal venue.

- [PCSofter](https://www.pcsofter.com/news/anthropic-ai-models-coming-to-microsoft-word-via-microsoft-365-copilot-in-late-may-2026.html) Anthropic Claude models are coming to Microsoft 365 Copilot in Word starting late May 2026, giving Premium users an alternative model for document drafting and editing alongside Microsoft's existing AI.

## Open Source

- [GitHub](https://github.com/anthropics/financial-services) anthropics/financial-services entered the weekly GitHub trending list at 5,848 stars this week, offering reference implementations and agent examples for financial services use cases.

- [GitHub](https://github.com/mattpocock/skills) mattpocock/skills holds the GitHub trending top spot for a third consecutive week with 14,928 stars this week and 67,343 total, providing reusable .claude skill configs for engineers.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/critical-apache-http2-flaw-cve-2026.html) A critical flaw in Apache HTTP Server 2.4.66 (CVE-2026-23918) was disclosed this week. The double-free vulnerability in HTTP/2 protocol handling can cause denial of service and potentially remote code execution. Operators running Apache 2.4.66 should patch immediately.

## Geopolitics

- [PBS NewsHour](https://www.pbs.org/newshour/world/iran-wars-fragile-ceasefire-tested-in-u-s-attempt-to-open-the-strait-of-hormuz) The U.S.-Iran ceasefire remains technically in effect but fragile after Iran launched missiles at the UAE this week. Trump paused Operation Project Freedom on May 6, citing progress toward an agreement, but the Strait of Hormuz remains effectively closed with no ships passing freely.

- [The Diplomat](https://thediplomat.com/2026/05/a-year-after-operation-sindoor-rising-risks-and-deepening-instability/) One year after India's Operation Sindoor, analysts warn the India-Pakistan ceasefire is holding structurally but that underlying drivers of conflict remain unresolved. Pakistan's military renewed warnings this week of a strong response to any attack.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto/candidates-2026-elections-toronto-9.7183285) Toronto's 2026 municipal election nomination period is underway, with the October 26 election taking shape. Councillor Brad Bradford filed as a mayoral candidate; Mayor Olivia Chow has not formally declared but signals she will seek a first full term.

- [CP24](https://www.cp24.com/) Former U.S. president Barack Obama is in Toronto to deliver a keynote at the Canada 2020 gala at the Fairmont Royal York.

## Weather

- Whitby, ON: High 16°C, low 3°C overnight. 40% chance of showers through the day. Yellow Frost Advisory in effect — near-freezing temperatures early this morning. Source: [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939)

## Just for You

- [Yahoo Tech](https://tech.yahoo.com/ai/gemini/articles/fact-check-google-chrome-may-110000895.html) Google Chrome silently installed a 4 GB Gemini Nano on-device model on users' machines, and the model reinstalls itself if deleted. The model is used for Chrome's "Help me write" and on-device scam detection features.

---

## Update — 16:02 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/higher-limits-spacex) Anthropic signed a deal to use all compute capacity at SpaceX's Colossus 1 facility in Memphis — over 220,000 NVIDIA GPUs and 300 MW of capacity — available within the month. The company also expressed interest in partnering with SpaceX on future orbital AI compute.

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-05-08/anthropic-inks-1-8-billion-computing-deal-with-akamai) Anthropic separately signed a $1.8 billion computing deal with Akamai Technologies to meet demand for Claude. This is distinct from the SpaceX arrangement and expands Anthropic's cloud infrastructure footprint.

- [Fortune](https://fortune.com/2026/05/08/anthropic-80fold-growth-quarter-renting-elon-musk-data-center/) Anthropic is launching a dedicated enterprise AI services company alongside Blackstone, Hellman & Friedman, and Goldman Sachs. The firm will embed Anthropic engineers directly with mid-sized clients to build custom Claude deployments.

- [Motley Fool](https://www.fool.com/investing/2026/04/30/meta-platforms-just-delivered-great-news-for-nvidi/) Meta raised its 2026 capital expenditure forecast to $125-145 billion, up from the prior $115-135 billion range, following its May 8 earnings report. Spending is directed at data centers, GPUs, and custom chips for AI.

## AI Tooling

- [Anthropic](https://www.anthropic.com/news/higher-limits-spacex) Claude Code's five-hour rate limit is now doubled for Pro, Max, Team, and Enterprise plans. Peak-hour restrictions for Pro and Max plans have been removed. Claude Opus API token limits rose more than 10x — tier 1 input tokens per minute go from 30k to 500k.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/palo-alto-pan-os-flaw-under-active.html) CVE-2026-0300 in Palo Alto PAN-OS (CVSS 9.3) is under active exploitation by a suspected state-sponsored group. The unauthenticated buffer overflow in the Captive Portal service enables root-level RCE. CISA set a federal remediation deadline of today; vendor patches are not expected until May 13.

- [SecurityWeek](https://www.securityweek.com/critical-github-vulnerability-exposed-millions-of-repositories/) CVE-2026-3854 allowed any authenticated GitHub user to execute arbitrary commands on GitHub's backend servers with a single git push, exposing millions of public and private repositories due to multi-tenant storage sharing. Wiz Research discovered and reported it; GitHub patched within hours. No evidence of exploitation in the wild. GHES users should upgrade to 3.19.3.

## Just for You

- [GitLab Security Advisory](https://advisories.gitlab.com/golang/github.com/argoproj/argo-cd/v3/CVE-2026-42880/) ArgoCD CVE-2026-42880 disclosed May 7: a missing authorization flaw in the ServerSideDiff endpoint lets read-only users extract plaintext Kubernetes Secret values via the API server's dry-run mechanism. Upgrade to ArgoCD 3.2.11, 3.3.9 or later.

---

## Update — 22:05 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-05-04/openai-finalizes-10-billion-joint-venture-with-pe-firms-to-deploy-ai) OpenAI finalized a $4 billion raise for a new joint venture called The Deployment Company, backed by TPG, Brookfield, Bain Capital, Dragoneer, and SoftBank, among 19 investors. The venture is valued at $10 billion and will embed teams with enterprises adopting OpenAI's AI software. This mirrors Anthropic's similar partnership with Blackstone, H&F, and Goldman Sachs announced the same week.

- [Gizmodo](https://gizmodo.com/openais-cfo-reportedly-wants-to-delay-the-ipo-from-2026-to-2027-2000753760) OpenAI CFO Sarah Friar is reportedly pushing to delay the company's IPO from late 2026 to 2027, citing missed user growth targets and roughly $600 billion in future infrastructure commitments. CEO Sam Altman is pushing for a Q4 2026 listing. Separately, Anthropic's annualized revenue ($30 billion) has reportedly surpassed OpenAI's ($25 billion).

## AI Tooling

- [OpenAI](https://openai.com/index/gpt-5-5-instant/) GPT-5.5 Instant is rolling out today to all ChatGPT users as the new default model, replacing GPT-5.3 Instant. It also replaces GPT-5.3 as `chat-latest` in the API. Paid users retain access to GPT-5.3 Instant for three months before retirement.

- [OpenAI](https://openai.com/news/) ChatGPT for Excel and Google Sheets is now globally available, adding a sidebar integration that lets users build, update, and explain spreadsheets directly within either application.

- [Claude Code Changelog](https://code.claude.com/docs/en/changelog) Claude Code shipped v2.1.136 today with stricter auto mode controls (a new `settings.autoMode.hard_deny` field for unconditional action blocking), enterprise feedback survey support via OpenTelemetry, MCP server persistence across `/clear`, and WSL2 image paste via PowerShell fallback. Same-day hotfixes v2.1.137 and v2.1.138 resolved a Windows VS Code extension activation failure and elevated errors on Claude Opus 4.1 respectively.
