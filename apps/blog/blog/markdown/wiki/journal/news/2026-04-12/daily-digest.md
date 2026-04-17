---
title: "Daily Digest: 2026-04-12"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-04-12
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-04-12
---

## AI Industry

- [SaaStr](https://www.saastr.com/anthropic-just-passed-openai-in-revenue-while-spending-4x-less-to-train-their-models/) Anthropic hit $30B ARR in April, passing OpenAI at $25B — the first time Anthropic has outearned its rival. Revenue grew from $9B at end-2025; 80% of it comes from enterprise customers, with the number of accounts spending over $1M/year doubling to 1,000 in under two months.

## AI Tooling

- [GitHub Changelog](https://github.blog/changelog/2026-04-07-copilot-cli-now-supports-byok-and-local-models/) GitHub Copilot CLI now supports bring-your-own-key and fully local models — connect Anthropic, Azure OpenAI, or any OpenAI-compatible endpoint including Ollama and vLLM. Shipped in the April 7 update; v1.0.23 (April 10) adds --mode, --autopilot, and --plan flags to start the CLI directly in a specific agent mode.

## Open Source

- [Claw Code](https://claw-code.codes/) Claw Code, an open-source Python and Rust clean-room rewrite of the Claude Code agent architecture, crossed 72,000 GitHub stars within days of its April 2 launch. The project provides multi-agent orchestration, tool-calling, and terminal-native AI development under an open license.

## Security

- [SecurityWeek](https://www.securityweek.com/cisa-flags-critical-ptc-vulnerability-that-had-german-police-mobilized/) CISA and Germany's BSI jointly flagged CVE-2026-4681, a critical deserialization RCE in PTC Windchill and FlexPLM used by manufacturers worldwide. German federal police physically visited affected companies — including some late at night — to deliver the warning. No patch is available yet; vendor-recommended mitigation is to block the affected servlet path at the web server layer.

## Geopolitics

- [Al Jazeera](https://www.aljazeera.com/news/2026/4/12/us-and-iran-fail-to-reach-peace-deal-after-marathon-talks-in-pakistan) US-Iran talks in Islamabad ended without a deal after 21 hours of negotiations. VP Vance said Iran had not committed to abandoning nuclear weapons development; Iran's foreign ministry cited a "gap in viewpoints" on two or three key issues but called diplomacy "never-ending."
- [Reuters](https://www.reuters.com) Hungary holds parliamentary elections today — Orban faces challenger Peter Magyar, whose party held a significant lead in recent polls, in a vote watched closely given US and Russian governments' open support for Orban.

## Weather

- Whitby: 7°C high, 8°C overnight (warming trend). Periods of rain through the afternoon, 5–10 mm expected, east wind 20 km/h developing late morning. No alerts. [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.864,-78.971)

## Just for You

- [GitHub](https://github.com/microsoft/markitdown) microsoft/markitdown enters GitHub trending at #3 with 8,202 stars this week and 103k total — a Python tool for converting Office documents, PDFs, and other files to Markdown. Relevant to blog build pipelines and Python tooling topics.
- [multica-ai/multica](https://github.com/multica-ai/multica) multica holds #6 on GitHub trending for a second week (5,362 stars this week, 8.5k total) — open-source managed agents platform that lets coding agents be assigned tasks, track progress, and compound skills, directly relevant to Claude/OpenClaw agent orchestration topics.

---

## Update — 16:03 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/glasswing) Anthropic launched Project Glasswing, giving Claude Mythos Preview to 12 named partners — including AWS, Apple, Google, Microsoft, Cisco, CrowdStrike, and NVIDIA — plus over 40 critical infrastructure organizations. The model will not be publicly released due to its demonstrated ability to discover thousands of zero-day vulnerabilities; Anthropic is dedicating $100M in usage credits and donating $4M to open-source security orgs including Alpha-Omega, OpenSSF, and the Apache Software Foundation.

- [Japan Times](https://www.japantimes.co.jp/business/2026/04/07/tech/openai-anthropic-google-china-copy/) OpenAI, Anthropic, and Google announced they are sharing threat intelligence through the Frontier Model Forum to stop Chinese AI companies from stealing model capabilities via adversarial distillation. Three firms were named: DeepSeek, Moonshot AI, and MiniMax. Anthropic says those three generated over 16 million exchanges with Claude via roughly 24,000 fraudulent accounts.

## AI Tooling

- [9to5Google](https://9to5google.com/2026/04/11/google-ai-pro-ultra-features/) Google renamed its AI subscription tiers: Google One AI Premium becomes "Google AI Pro" (still $19.99/month in the US), and a new higher-tier "Google AI Ultra" was introduced. The rebrand affects Gemini Advanced access across personal and Workspace accounts.

- [Google Blog](https://nationaltoday.com/us/ca/san-francisco/news/2026/04/11/google-gemini-ai-now-generates-presentations-instantly/) Gemini Canvas can now generate full slide presentations from uploaded source material or a provided topic, rolling out to both personal and Workspace accounts.

- [Google DeepMind](https://deepmind.google/models/gemma/gemma-4/) NotebookLM is now integrated directly into the Gemini chatbot interface, letting users upload PDFs, documents, YouTube links, and URLs through Gemini's side panel to build searchable information repositories.

## Open Source

- [Google Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/) Google released Gemma 4 on April 2 — four model sizes under Apache 2.0, with multimodal capability (text and image across all sizes, audio on edge variants) and context windows up to 256K tokens. Models are optimized to run on-device from Raspberry Pi to high-end GPUs.

## Security

- [Bleeping Computer](https://www.bleepingcomputer.com/news/security/smart-slider-updates-hijacked-to-push-malicious-wordpress-joomla-versions/) Nextend's update servers were compromised on April 7, pushing a backdoored Smart Slider 3 Pro version (3.5.1.35) to WordPress and Joomla sites for roughly 6 hours. The malicious update installs a remote access toolkit and persists across plugin removal by writing backdoors to three additional locations. Over 800,000 active installations use the plugin; only the Pro edition was affected. Update to 3.5.1.36 or restore from a backup dated April 5 or earlier.

- [SecurityWeek](https://www.securityweek.com/) Adobe released emergency patches on April 12 for CVE-2026-34621, a critical vulnerability (CVSS 8.6) in Acrobat Reader that is actively exploited in the wild. Users should update immediately.

## Geopolitics

- [Al Jazeera](https://www.aljazeera.com/news/2026/4/12/hungarians-vote-as-pm-orban-faces-toughest-election-challenge-in-years) Hungary's election is producing record-breaking turnout — 65% of voters had cast ballots by 3pm local time versus 52.75% at the same point in 2022. Pre-election polling showed opposition leader Péter Magyar's Tisza party leading Orbán's Fidesz by 7 to 9 points. First results are expected after polls close at 7pm local.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto/ontario-municipalities-funding-gap-9.7150596) Ontario municipalities including Whitby are calling on the Ford government to fill what they describe as a $4 billion annual funding gap created by downloading of provincial responsibilities onto local governments. Whitby's mayor says the town has been forced to delay park development and road repairs for years to cover costs she says are the province's responsibility; the group is meeting with the finance minister in coming weeks.

- [CTV News Toronto](https://www.ctvnews.ca/toronto/) Mayor Olivia Chow and Coun. Brad Bradford presented competing plans for the long-delayed Scarborough LRT, bringing a simmering transit dispute into public view. No vote has been scheduled yet.
