---
title: "Daily Digest: 2026-05-06"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-06
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-06
---

## AI Industry

- [9to5Google](https://9to5google.com/2026/05/05/google-ai-ultra-lite-gemini-usage-limits/) Google is preparing a new "AI Ultra Lite" subscription tier to slot between the $20 Gemini Pro and $250 Ultra plans, and will add a dashboard showing subscribers their remaining token budget.

- [Build Fast With AI](https://www.buildfastwithai.com/blogs/gemini-3-2-flash-release-2026) Gemini 3.2 Flash appeared without announcement inside the iOS Gemini app and Google AI Studio, priced at $0.25 per million input tokens and reportedly faster than Gemini 3.1 Pro ahead of Google I/O on May 19.

- [TechnoSports](https://technosports.co.in/openai-anthropic-india/) OpenAI and Anthropic both launched enterprise AI services in India on May 5, targeting research partnerships and large-scale business deployment.

## AI Tooling

- [Releasebot](https://releasebot.io/updates/anthropic/claude-code) Claude Code v2.1.128 (May 5) adds plugin support for .zip archives, random session colors via /color, smarter MCP and model handling, and fixes for image handling and parallel shell commands.

- [Anthropic](https://code.claude.com/docs/en/changelog) Claude adds Memory for Managed Agents in public beta, giving agents filesystem-based cross-session memory that persists and accumulates learnings across conversations.

- [GitHub Community](https://github.com/orgs/community/discussions/192948) GitHub Copilot is switching to usage-based billing starting June 1, replacing PRUs with AI Credits priced on actual token consumption per model. Reviewing a pull request with Copilot will also count against included Actions minutes.

- [AfterDawn](https://www.afterdawn.com/news/article.cfm/2026/05/05/microsoft-kicks-copilot-out-of-xbox) Microsoft is removing Copilot from Xbox entirely, ending further development of the AI assistant for the gaming platform.

## Open Source

- [GitHub](https://github.com/warpdotdev/warp) warpdotdev/warp jumped to #1 on GitHub weekly trending with 28,493 stars this week, overtaking mattpocock/skills. Warp is an agentic development environment built around a terminal-first workflow.

- [GitHub](https://github.com/AIDC-AI/Pixelle-Video) AIDC-AI/Pixelle-Video is a new entry in the top 8 weekly trending repos with 4,201 stars this week, billed as an AI-driven fully automated short video engine.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/cisa-adds-actively-exploited-linux-root.html) CVE-2026-41940, an authentication bypass in cPanel and WebHost Manager, has come under active exploitation. No patch details were available at time of writing; cPanel administrators should review vendor advisories.

## Geopolitics

- [Al Jazeera](https://www.aljazeera.com/news/2026/5/1/turbulent-and-dangerous-how-shipping-is-the-new-global-battleground) The Strait of Hormuz remains effectively closed as US-Iran attacks continue, keeping oil above $100 per barrel. The IMF shifted to its "adverse scenario" projection, citing a conflict now expected to last years rather than weeks.

- [Modern Diplomacy](https://moderndiplomacy.eu/2026/05/05/financial-brief-a-weekly-roundup-on-the-geopolitics-of-money-may-05/) The UAE formally exited OPEC, becoming the third member to leave the cartel in seven years.

## Local

- [Durham Radio News](https://www.durhamradionews.com/archives/198625) Ontario's Privacy Commissioner completed an investigation into Lakeridge Health, finding the hospital network repeatedly failed to protect patient health information as staff inappropriately accessed files on multiple occasions.

## Weather

- Whitby: 12°C high, 2°C low overnight, mainly cloudy with 40% chance of showers. Risk of frost tonight. No alerts in effect. (Source: Environment Canada)

## Just for You

- [GitHub](https://github.com/Alishahryar1/free-claude-code) free-claude-code holds the #7 spot on weekly GitHub trending (4,510 stars this week) — the project enables Claude Code access through the terminal, VSCode, or Discord in a manner compatible with OpenClaw.

---

## Update — 16:00 UTC

## AI Industry

- [Hoodline](https://hoodline.com/2026/05/springfield-showdown-openai-anthropic-brawl-over-illinois-ai-shield-law/) OpenAI backs Illinois SB3444, which would shield AI developers from civil liability in mass-casualty events involving weapons of mass destruction. Anthropic opposes it and supports SB3261 instead, a competing bill requiring public safety disclosures and an incident reporting system. The two companies are publicly on opposite sides of state AI liability legislation.

## AI Tooling

- [Eastern Herald](https://easternherald.com/2026/05/06/google-home-gemini-3-1-update-smart-home-ai/) Google Home received a Gemini 3.1 upgrade enabling multi-step voice command processing in a single utterance, Nest Cam contextual insights, and smarter automation rules. The update is rolling out to existing Google Home devices.

## Security

- [Help Net Security](https://www.helpnetsecurity.com/2026/05/06/palo-alto-firewalls-vulnerability-exploited-cve-2026-0300/) CVE-2026-0300 (CVSS 9.3): A buffer overflow in the PAN-OS User-ID Authentication Portal allows unauthenticated remote code execution with root privileges on PA-Series and VM-Series firewalls. Actively exploited in the wild; patches are not expected until May 13–28. Mitigation: restrict portal access to trusted internal IPs or disable it if unused.

- [Cyberpress](https://cyberpress.org/critical-argo-cd-vulnerability/) CVE-2026-42880 (CVSS 9.6): A missing authorization flaw in ArgoCD's ServerSideDiff API endpoint lets authenticated users extract unmasked Kubernetes Secrets — including service account tokens, database credentials, API keys, and TLS certificates. Check the ArgoCD security advisories page for patch status.
