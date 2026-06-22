---
title: "Daily Digest: 2026-06-22"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-06-22
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-06-22
---

## AI Industry

- [NPR](https://www.npr.org/2026/06/22/nx-s1-5856359/ai-anthropic-congress-spending-openai-midterms-election) Anthropic-backed and OpenAI-aligned super PACs have together spent $43.3M in the 2026 US midterms, with over $100M more pledged. Anthropic contributed $20M to Public First Action, which backs state-level AI safeguards; OpenAI-aligned Leading the Future (funded by Andreessen Horowitz) argues for national standards over state regulation. The groups are backing opposing congressional candidates.

## AI Tooling

- [Cloudflare](https://releasebot.io/updates/cloudflare) Durable Objects now remain alive during active outbound TCP or WebSocket connections — fixes mid-stream eviction that previously terminated LLM and agent streaming workloads after 70-140 seconds of inactivity. Each outbound connection extends lifetime up to 15 minutes.

- [Google AI](https://ai.google.dev/gemini-api/docs/deprecations) gemini-3.1-flash-image-preview and gemini-3-pro-image-preview shut down June 25; all Imagen models shut down June 24. Teams using these endpoints must migrate to Gemini Image models before those dates.

- [Google AI](https://ai.google.dev/gemini-api/docs/changelog) Managed Agents entered public preview on the Gemini API — lets developers build and deploy stateful autonomous agents running in secure, Google-hosted Linux sandbox environments.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/05/24/taiwan-and-china-coast-guards-in-standoff-at-top-of-south-china-sea.html) PRC law enforcement and supply ships made the first recorded incursion into the restricted waters of Taiwan's Itu Aba (Taiping Island) — Taiwan's only administered feature in the Spratly Islands — on June 11. Taiwan's Coast Guard condemned the entry as a sovereignty violation.

- [ZeroFox](https://www.zerofox.com/intelligence/monthly-geopolitical-report-june-2026/) Pressure is mounting on the US-Iran ceasefire agreement. Key differences over nuclear timelines remain unresolved; analysts assess re-escalation is unlikely but possible if talks stall through June.

## Weather

- Whitby: 22°C high, 11°C low, mainly cloudy with 60% chance of showers. UV index 8 (very high). No alerts in effect. Source: Environment Canada.

## Just for You

- [Cloudflare](https://releasebot.io/updates/cloudflare) Cloudflare One adds a unified Routes dashboard consolidating Mesh, Tunnel, WAN, and Magic Transit routes into one view with an interactive map, route testing, and virtual network management.

---

## Update — 18:00 UTC

## AI Industry

- [Windows Central](https://www.windowscentral.com/microsoft/microsoft-cancels-claude-code-licenses-shifting-developers-to-github-copilot-cli-a-move-likely-driven-by-financial-motives) Microsoft is canceling Claude Code licenses across its Experiences + Devices division — the group responsible for Windows, Microsoft 365, Teams, and Surface — by June 30. Token costs reached $500–$2,000 per engineer per month, consuming the annual AI tools budget ahead of schedule. Engineers are being transitioned to GitHub Copilot CLI.

- [SpaceDaily](https://spacedaily.com/n-microsoft-is-canceling-claude-code-licenses-across-its-experiences-devices-division-by-june-30-steering-thousands-of-engineers-toward-github-copilot-while-uber-burned-through-its-entire-2026-ai-bu/) Uber's CTO confirmed the company exhausted its entire 2026 AI coding tools budget by April, four months into the fiscal year, after rolling out Claude Code and Cursor across engineering in December 2025.

## AI Tooling

- [Google AI](https://ai.google.dev/gemini-api/docs/deprecations) Gemini CLI reached end-of-life on June 18 and is replaced by the Agentic 2.0 CLI. Any CI/CD pipelines or automation using the old Gemini CLI must be migrated.

## Security

- [Zero Day Initiative](https://www.zerodayinitiative.com/blog/2026/6/9/the-june-2026-security-update-review) Microsoft's June 2026 Patch Tuesday addressed 206 CVEs including CVE-2026-45657, a wormable Windows Kernel RCE rated CVSS 9.8 requiring no authentication or user interaction. CVE-2026-32193 is an AKS path-traversal RCE rated CVSS 8.8, exploitable by a low-privileged local attacker with no user interaction required.

## Geopolitics

- [NPR](https://www.npr.org/2026/06/19/nx-s1-5863544/trump-us-iran-agreement) The US and Iran signed a 60-day ceasefire extension MOU on June 17, covering Strait of Hormuz reopening to commercial shipping and potential release of up to $25B in frozen Iranian assets. A formal signing ceremony scheduled for June 19 in Switzerland was called off at the last minute after JD Vance delayed his trip.

## Just for You

- [Perplexity Blog](https://www.perplexity.ai/hub/blog/perplexity-is-open-sourcing-bumblebee) Perplexity open-sourced Bumblebee, a read-only supply chain scanner for developer endpoints covering npm, PyPI, Go modules, editor extensions, browser extensions, and MCP server configs. The tool was motivated by the March 2026 ContextCrush incident, in which a tampered MCP server config delivered attacker-controlled instructions directly into an AI agent's working memory.

- [AWS News Blog](https://aws.amazon.com/about-aws/whats-new/2026/06/amazon-eks-capabilities-logging/) Amazon EKS Capabilities (which provides fully managed ArgoCD, AWS Controllers for Kubernetes, and KRO) can now be configured as log delivery sources using CloudWatch Vended Logs, enabling monitoring of the managed controllers without customer-managed infrastructure.
