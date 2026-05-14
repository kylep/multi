---
title: "Daily Digest: 2026-05-14"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-14
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-14
---

## AI Industry

- [GuruFocus](https://www.gurufocus.com/news/8851344/nvidia-nvda-surges-to-record-high-amid-ai-chip-production-news) NVIDIA stock reached a record high of $223.75 on May 12, pushing market cap past $5.4 trillion. The move followed confirmation that Vera Rubin chip production is finalized, with trial runs beginning in June and initial shipments to AWS, Google Cloud, and Microsoft expected in July.

## AI Tooling

- [Axios](https://www.axios.com/2026/05/14/anthropic-claude-price-openai-tokens) Anthropic introduced a separate monthly credit meter for agent tool usage on paid Claude plans, effective June 15. Subscribers accessing Claude through third-party harnesses like OpenClaw will draw from a dedicated credit pool rather than their existing plan limits. The change drew immediate backlash on social media, with some users threatening to switch to Codex.

- [Anthropic](https://www.anthropic.com/news/higher-limits-spacex) Claude Code weekly limits increased by 50% through July 13 for Pro, Max, Team, and Enterprise users. The bump is framed as a competitive response to OpenAI's Codex push and is enabled by the Colossus 1 compute deal.

- [OpenAI](https://openai.com/index/introducing-the-codex-app/) Sam Altman announced two months of free enterprise Codex access for companies that sign up within 30 days, explicitly targeting developers affected by Anthropic's new agent credit meter.

## Security

- [GitLab Docs](https://docs.gitlab.com/releases/patches/patch-release-gitlab-18-11-3-released/) GitLab released security patches 18.11.3, 18.10.6, and 18.9.7 on May 13. The critical fix blocks an authenticated developer from executing arbitrary JavaScript in other users' browsers via improper input sanitization. Self-managed instances should upgrade immediately; GitLab.com is already patched.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/05/14/trump-xi-beijing-summit-trade-taiwan-ai-iran-rare-earths-tariffs.html) Trump and Xi held a two-hour session in Beijing on Day 1 of their summit. Xi reserved sharpest language for Taiwan, calling it the "most important issue" and warning that mishandling it risks collision. Both sides agreed the Strait of Hormuz must remain open; Xi expressed interest in purchasing more American oil to reduce dependence on the Strait.

- [Al Jazeera](https://www.aljazeera.com/news/liveblog/2026/5/14/trump-xi-summit-live-us-china-leaders-to-hold-talks-on-trade-tech-iran) The two leaders agreed to pursue a "constructive China-U.S. relationship of strategic stability." A state banquet is scheduled for Thursday evening; the summit continues Friday.

## Local

- [City of Toronto](https://www.toronto.ca/news/city-of-toronto-to-announce-winning-names-of-new-electric-ferries/) Toronto announced the winning names for its two new electric ferries at the Jack Layton Ferry Terminal this morning, accompanied by a media tour of infrastructure upgrades led by CreateTO.

- [CBC News](https://www.cbc.ca/news/canada/toronto) CBC Investigations reported a rise in home invasions targeting houses in Toronto's wealthiest neighborhoods, raising public safety concerns ahead of the FIFA World Cup.

## Weather

- Whitby: 13°C high, 7°C low. Cloudy with 40% chance of showers; wind becoming northwest 20 km/h through the morning. No alerts. Source: Environment Canada.

## Just for You

- [Phemex News](https://phemex.com/news/article/openai-offers-two-months-free-codex-access-amid-anthropic-changes-81350) The Anthropic credit meter change specifically affects OpenClaw and other third-party Claude agent harnesses — placing programmatic agent usage behind a separate billing track starting June 15.

---

## Update — 16:30 UTC

## AI Tooling

- [Eastern Herald](https://easternherald.com/2026/05/14/microsoft-edge-copilot-ai-tabs-update-2026/) Microsoft Edge shipped a Copilot update today that reads and summarizes content across all open tabs simultaneously. New capabilities include cross-tab comparison, converting tabs into a podcast, quiz generation from webpages, and long-term memory that persists context across sessions. The new tab page now consolidates chat, search, and browsing history into a single hub.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/cisa-adds-actively-exploited-linux-root.html) CISA added CVE-2026-31431 ("Copy Fail") to its Known Exploited Vulnerabilities catalog, with a federal patch deadline of May 15. The flaw is a Linux kernel logic bug in the authentication cryptographic template that lets an unprivileged local user reach root via a 732-byte Python exploit. Docker, LXC, and Kubernetes environments are particularly exposed because they grant container processes access to the AF_ALG subsystem by default. Fixes are in Linux kernel 6.18.22, 6.19.12, and 7.0.

- [The Hacker News](https://thehackernews.com/2026/05/critical-apache-http2-flaw-cve-2026.html) CVE-2026-23918 is a double-free vulnerability in Apache HTTP Server 2.4.66 affecting mod_http2. One unauthenticated request can crash worker processes (trivial DoS); on Debian-derived systems with the default mmap allocator, the same bug can be escalated to remote code execution. The fix is Apache HTTP Server 2.4.67.

## Local

- [Durham Radio News](https://www.durhamradionews.com/archives/212264) Students organized by Durham Students 4 Education protested outside Whitby MPP Lorne Coe's office at Whitby Town Square on May 14, pressing for restoration of 85% OSAP grants. Coe voted against a provincial motion to restore the grants earlier this session.

---

## Update — 21:00 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-05-12/anthropic-in-talks-to-raise-30-billion-at-900-billion-valuation) Anthropic is in talks to raise $30 billion at a valuation between $900 billion and $950 billion, which would surpass OpenAI's $854 billion post-money valuation. The round is expected to close within weeks and is likely the company's last private raise before an IPO. Annual revenue run rate has crossed $30 billion.

## AI Tooling

- [9to5Mac](https://9to5mac.com/2026/05/14/openai-brings-codex-control-to-chatgpt-for-iphone-and-android/) OpenAI added remote Codex control to the ChatGPT mobile app, rolling out today in preview on iOS and Android across all plans including Free. Users can review outputs, approve commands, switch models, and start new threads from their phone while the actual Codex environment runs on a Mac or remote server.

- [9to5Google](https://9to5google.com/2026/05/14/gemini-spark-insight/) Google is introducing Gemini Spark, a new autonomous agent inside the Gemini app. Users can create tasks and schedule them to run at specified times; the feature is visible in Gemini app beta 17.23.

## Security

- [BleepingComputer](https://www.bleepingcomputer.com/news/microsoft/microsoft-may-2026-patch-tuesday-fixes-120-flaws-no-zero-days/) Microsoft's May 2026 Patch Tuesday released fixes for 120 flaws across 20 product families, including 29 rated Critical. No zero-days are exploited in the wild this cycle — the first clean Patch Tuesday in nearly two years. Two unauthenticated vulnerabilities, CVE-2026-41089 and CVE-2026-41096, carry CVSS 9.8; one SSO plugin flaw scores 9.1.
