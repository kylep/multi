---
title: "Daily Digest: 2026-03-28"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-03-28
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-03-28
---

## AI Industry

- [Yahoo Finance](https://finance.yahoo.com/news/anthropic-arr-surges-19-billion-151028403.html) Anthropic annualized revenue surged to $19 billion in March 2026, up from $9 billion at the end of 2025. Claude Code accounts for $2.5 billion of that run rate, having grown from zero in ten months; enterprise customers now represent more than half of Claude Code revenue.

- [NVIDIA Newsroom](https://nvidianews.nvidia.com/news/meta-builds-ai-infrastructure-with-nvidia) NVIDIA and Meta announced a multiyear partnership to deploy millions of Blackwell and Rubin GPUs across Meta's hyperscale training and inference data centers, along with NVIDIA Spectrum-X Ethernet networking and Confidential Computing for privacy.

## AI Tooling

- [Claude Release Notes](https://support.claude.com/en/articles/12138966-release-notes) Anthropic shipped AutoDream for Claude Code — a background memory agent that consolidates, prunes, and re-indexes memory files automatically after 24 hours or five sessions. The `/dream` command triggers it manually; it converts relative dates to absolute dates and removes contradicted facts to prevent context drift.

- [CNBC](https://www.cnbc.com/2026/03/24/anthropic-claude-ai-agent-use-computer-finish-tasks.html) Claude Computer Use entered research preview for Pro and Max subscribers on Mac. Users send a task from a phone via Dispatch and Claude opens apps, navigates browsers, and fills spreadsheets; it falls back to screen navigation when no direct integration exists. Windows and Linux are not yet supported.

## Security

- [The Hacker News](https://thehackernews.com/2026/03/critical-telnetd-flaw-cve-2026-32746.html) CVE-2026-32746 (CVSS 9.8): pre-authentication stack buffer overflow in the GNU InetUtils telnetd SLC suboption handler allows unauthenticated root RCE over port 23. Affects FreeBSD, NetBSD, Citrix NetScaler, TrueNAS Core, and others. No patch is available until April 1; block port 23 at the perimeter or migrate to SSH now.

## Geopolitics

- [NBC News](https://www.nbcnews.com/world/iran/live-blog/live-updates-iran-war-trump-hormuz-markets-israel-tehran-rcna265440) Iranian missile fire wounded US service members at a Saudi air base on March 28, the latest escalation as the conflict enters its fifth week. Separately, 22 nations signed a pledge to coordinate a post-conflict Hormuz clearance mission; Brent crude remains above $100/barrel.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto) Toronto council voted to join a Supreme Court challenge against the Ford government's Ontario Place redevelopment, reversing Mayor Olivia Chow's earlier commitment to drop the city's opposition to the project.

## Weather

- Whitby: 3°C high, -7°C overnight. 40% chance of flurries throughout the day. No alerts. [(Environment Canada)](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939)

---

## Update — 18:00 UTC

## AI Tooling

- [Google Blog](https://blog.google/innovation-and-ai/products/gemini-app/gemini-drop-updates-march-2026/) Google's March 2026 Gemini Drop makes Personal Intelligence free for all US Gemini users, connecting Gmail, Google Photos, and YouTube to surface personalized help. The feature was previously paywalled for paid subscribers.

## Open Source

- [Releasebot](https://releasebot.io/updates/openclaw) OpenClaw 2026.3.24 ships a new public plugin SDK replacing the previous extension-api, a Matrix messaging channel backed by the official matrix-js-sdk, and bundled web-search plugins (Exa, Tavily, Firecrawl). ClawHub is now the primary install path for all plugins.

## Just for You

- [AWS Dev Blog](https://dev.to/devops_descent/march-2026-aws-highlights-4jmb) March AWS highlights: Lambda Managed Instances adds Rust support, bringing native-performance serverless to the runtime. Amazon MSK adds Graviton3 support for Kafka in the Africa (Cape Town) region, expanding low-cost streaming to emerging-region deployments.

---

## Update — 22:00 UTC

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/03/28/anthropics-claude-popularity-with-paying-consumers-is-skyrocketing/) Analysis of anonymized credit card transactions from 28 million US consumers shows Claude gaining paid subscribers at a record rate in March 2026. Claude reached 9 million daily active users; ChatGPT still leads at 440 million DAU and is also still adding subscribers.

## Security

- [Help Net Security](https://www.helpnetsecurity.com/2026/03/28/big-ip-apm-vulnerability-cve-2025-53521-exploited/) CVE-2025-53521 in F5 BIG-IP Access Policy Manager was re-classified from denial-of-service to unauthenticated RCE (CVSS 9.8) after new exploitation evidence emerged in March 2026. Active exploitation confirmed; CISA ordered federal agencies to assess and mitigate by March 30. The October 2025 patch resolves the issue.

- [Socket Security](https://socket.dev/blog/malicious-telnyx-packages-supply-chain-attack) The Telnyx Python SDK was compromised on PyPI on March 27 by threat actor TeamPCP: versions 4.87.1 and 4.87.2 contain credential-harvesting code concealed inside a bundled WAV file. Downgrade to 4.87.0 immediately; the PyPI project is currently quarantined.

## Geopolitics

- [CNN](https://www.cnn.com/2026/03/28/world/live-news/iran-war-us-israel-trump) Iran launched a missile strike on a commercial street in Tel Aviv on March 28, killing at least one person and wounding several others. Yemen's Houthis warned they will enter the conflict if attacks on Iran continue. Israel expanded ground operations in Lebanon toward the Litani River; an Israeli airstrike killed three journalists in southern Lebanon.
