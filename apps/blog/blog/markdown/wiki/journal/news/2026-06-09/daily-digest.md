---
title: "Daily Digest: 2026-06-09"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-06-09
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-06-09
---

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/06/08/following-anthropic-openai-files-confidentially-for-ipo/) OpenAI filed a draft S-1 with the SEC on June 8 for a proposed IPO, following Anthropic's confidential filing on June 1. OpenAI was last valued at $852 billion.

- [TechCrunch](https://techcrunch.com/2026/06/01/nvidia-chases-200b-cpu-market-with-ai-agent-pcs-from-microsoft-dell-and-hp/) NVIDIA announced RTX Spark, a new PC CPU developed with MediaTek targeting the $200B consumer market. Windows PCs from ASUS, Dell, HP, Lenovo, Microsoft Surface, and MSI ship later this fall.

- [Cybernews](https://cybernews.com/ai-news/claude-outage-resolved-anthropic-opus-model-errors/) Anthropic is investigating unconfirmed claims of a customer data leak tied to a roughly two-hour outage on Friday that disrupted Opus 4.7 and 4.8 models. The service has since recovered.

## AI Tooling

- [Windows Central](https://www.windowscentral.com/microsoft/microsoft-cancels-claude-code-licenses-shifting-developers-to-github-copilot-cli-a-move-likely-driven-by-financial-motives) Microsoft is cancelling Claude Code licenses across its Experiences + Devices division by June 30, redirecting thousands of engineers to GitHub Copilot CLI before the end of the fiscal year.

- [Releasebot](https://releasebot.io/updates/anthropic/claude-code) Claude Code shipped a dynamic workflows research preview with end-to-end parallel task handling across codebases, migrations, and complex engineering work, including built-in verification and saved progress across CLI, Desktop, VS Code, API, and major cloud platforms.

- [Releasebot](https://releasebot.io/updates/anthropic/claude) Claude adds a Foundation Models Swift package for Apple developers, enabling typed Swift outputs to hand off to Claude for multi-step reasoning, code generation, web search, code execution, and streaming responses in SwiftUI.

- [Releasebot](https://releasebot.io/updates/openclaw) OpenClaw 2026.6.5-beta.2 ships parallel web search as a bundled provider, tightens MCP tool result handling to prevent Anthropic 400 errors, and fixes QQBot leaking model reasoning content into channel replies.

- [GitHub](https://github.com/features/copilot) GitHub Copilot flex billing went live June 1, switching from request-based to usage-based AI Credits billing. Prices hold at $10 Pro, $39 Pro+, $19/user Business, and $39/user Enterprise.

## Security

- [Help Net Security](https://www.helpnetsecurity.com/2026/06/05/cisco-sd-wan-cve-2026-20245-0-day-exploited/) A zero-day in Cisco Catalyst SD-WAN Manager (CVE-2026-20245) is actively being exploited to execute arbitrary commands as root. Cisco disclosed the flaw on June 5 with no patch yet available.

- [The Cyber Express](https://thecyberexpress.com/cve-2025-48595-android-june-2026/) Google's June 2026 Android security update addresses 124 vulnerabilities including an actively exploited integer overflow zero-day (CVE-2025-48595) in the Android Framework that allows local privilege escalation without user interaction.

## Geopolitics

- [WEF](https://www.weforum.org/stories/2026/05/blockade-diplomacy-and-other-geopolitical-stories-to-know-this-month/) Iran and Israel are in ceasefire negotiations after a recent missile exchange escalation. The US is tightening pressure on Iranian ports while Iran continues to threaten Strait of Hormuz shipping.

- [FIFA / AP](https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/usa-mexico-canada2026) The 2026 FIFA World Cup opens June 11 across the United States, Canada, and Mexico — the first co-hosted by three nations and the first to feature 48 teams.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto) The federal government launched consultations on the future of Toronto's Billy Bishop airport as the Ford government pursues expansion to accommodate higher passenger volumes and jet service.

- [CTV News Toronto](https://www.ctvnews.ca/toronto/) Toronto Fire Services responded to 41% more calls than usual over the past 24 hours. No single incident has been cited; heat and pre-World Cup activity are factors.

- [CBC News](https://www.cbc.ca/news/canada/toronto) With the FIFA World Cup days away, Toronto authorities issued warnings about the elevated risk of human trafficking targeting young people amid the expected surge in international visitors.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby: 26°C high, 19°C low tonight. Sunny this morning, clouds building by noon, 40% chance of showers afternoon with risk of thunderstorms. Evening amounts 10-15mm. Humidex 33, UV index 9 (very high). No alerts in effect.

## Just for You

- [Cloudflare Blog](https://blog.cloudflare.com/) Cloudflare One now routes Workers with a VPC Network binding through Cloudflare Gateway for public Internet destinations, extending Zero Trust DNS, HTTP, Network, and egress policies with full Gateway logs for Worker traffic.

---

## Update — 16:04 UTC

## Open Source

- [MiniMax Blog](https://www.minimax.io/blog/minimax-m3) MiniMax released M3 on June 1, an open-weight model combining a 1-million-token context window, native multimodal input (text, image, video), and computer use capability built on a new Sparse Attention architecture. It scores 59% on SWE-Bench Pro, edging past GPT-5.5 and Gemini 3.1 Pro. Weights and a technical report are open-sourced; training code is not included.

## Security

- [Bleeping Computer](https://www.bleepingcomputer.com/news/security/critical-everest-forms-pro-flaw-exploited-to-take-over-wordpress-sites/) A critical PHP eval() injection flaw in the Everest Forms Pro WordPress plugin (CVE-2026-3300, CVSS 9.8) is being actively exploited to achieve unauthenticated remote code execution on sites using the Complex Calculation feature. Wordfence has blocked over 29,300 exploit attempts; patched in version 1.9.13.

## Geopolitics

- [NPR](https://www.npr.org/2026/06/09/nx-s1-5851482/trump-pilots-us-helicopter-crash) A US Army Apache helicopter crashed into the sea near the Strait of Hormuz early June 9 while patrolling off the coast of Oman during the Iran conflict. Both crew members were rescued within two hours by a sea drone in the first such US military sea-drone rescue operation; the cause is under investigation.

## Just for You

- [Cloudflare Changelog](https://developers.cloudflare.com/changelog/post/2026-06-05-saga-rollbacks/) Cloudflare Workflows added saga-style rollback support on June 5, letting each step define compensating logic that runs in reverse order on failure. Rollback outcomes are now exposed in instance status and in analytics for production debugging.

---

## Update — 21:00 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-fable-5-mythos-5) Anthropic released Claude Fable 5 on June 9, its first public Mythos-class model. It scores 80.3% on SWE-Bench Pro (vs 69.2% for Opus 4.8) and is the first model to exceed 90% on Hex's analytical benchmark. Available immediately on Claude API, Claude Platform, Claude Code, AWS, Google Cloud, and Microsoft Foundry. Through June 22, included in Pro, Max, Team, and Enterprise plans; usage-credits pricing of $10/M input and $50/M output takes effect June 23. Mythos 5, the same model with some safeguards lifted, was simultaneously deployed to approved organizations via Project Glasswing in collaboration with the US government.

## Security

- [Bleeping Computer](https://www.bleepingcomputer.com/news/security/meta-ai-support-data-breach-affects-20-000-instagram-accounts/) Attackers exploited a flaw in Meta's High Touch Support AI recovery tool to hijack 20,225 Instagram accounts between April 17 and May 31, 2026. The tool issued password reset links without verifying the requester's email matched the target account. Meta shut down the system, invalidated all generated links, and reset affected accounts.

- [SecurityWeek](https://www.securityweek.com/openssl-patches-high-severity-vulnerability-found-with-ai/) OpenSSL patched CVE-2026-45447 on June 9, a heap use-after-free in PKCS7_verify() that can be triggered by a crafted PKCS#7 or S/MIME message and may lead to remote code execution. Fixed in OpenSSL 3.6. The flaw was discovered by a researcher working with Claude AI.

- [Help Net Security](https://www.helpnetsecurity.com/2026/06/08/cisa-patch-actively-exploited-solarwinds-serv-u-dos-vulnerability-cve-2026-28318/) CISA added CVE-2026-28318 to its Known Exploited Vulnerabilities catalog on June 5. The flaw in SolarWinds Serv-U allows unauthenticated attackers to crash the service via a malformed POST request using the Content-Encoding: deflate header. Federal agencies must patch by June 19; hotfix available in Serv-U 15.5.4 Hotfix 1.
