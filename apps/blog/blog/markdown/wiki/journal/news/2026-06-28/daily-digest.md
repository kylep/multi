---
title: "Daily Digest: 2026-06-28"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-06-28
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-06-28
---

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-06-28/google-caps-meta-s-use-of-gemini-ai-financial-times-reports) Google told Meta around March it could not fulfill the volume of Gemini API capacity Meta had sought to purchase, disrupting and delaying some of Meta's internal AI projects. Staff were directed to use AI tokens more efficiently. Several other Google clients are affected, though Meta's demand was exceptionally large.

## AI Tooling

- [Anthropic](https://releasebot.io/updates/anthropic/claude-code) Claude Code v2.1.191–2.1.195 (June 27): `/rewind` now lets users resume conversations before a `/clear`, streaming CPU usage cut by ~37% via text coalescence, live bash file-path autocomplete added, MCP servers now auto-retry transient network errors, and a new `autoMode.classifyAllShell` setting routes all shell commands through safety classification instead of pattern matching.

- [Anthropic](https://www.anthropic.com/news) Claude Trusted Devices launched for Team and Enterprise: admins can now require device verification before staff can view or steer local Claude Code sessions remotely.

- [Anthropic](https://releasebot.io/updates/anthropic/claude) Claude Opus 4.7 fast mode will be removed July 24, 2026. Developers using it must migrate to Opus 4.8 fast mode before that date.

## Geopolitics

- [RFE/RL](https://www.rferl.org/a/iran-war-us-hormuz-oil-blockade-gulf-israel/33640284.html) Iran's IRGC launched missile and drone strikes at US-linked sites early June 28, with Kuwait and Bahrain reporting incoming projectiles. The IRGC stated any ceasefire violations would halt diplomatic processes. US Central Command had struck Iranian targets on June 27 in response to commercial shipping attacks.

## Local

- [NOW Toronto](https://nowtoronto.com/news/toronto-pride-parade-weekend-live-updates/) Toronto Pride Parade runs today June 28, 2–6 p.m. down Yonge Street from Bloor to Bay and Queen. More than 250 groups and 25,000 marchers are participating, with hundreds of thousands of spectators expected in what marks the festival's 45th year.

- [CTV News](https://vancouverisland.ctvnews.ca/toronto/local/durham/article/24-year-old-man-dead-after-crash-at-hwy-401-and-hwy-412/) A 24-year-old man died after a single-vehicle crash on the Highway 412 ramp to Highway 401 in Whitby early Sunday morning. The driver was taken to hospital with serious injuries. OPP is investigating.

## Weather

- Whitby: 28°C high, 16°C low, sunny with morning fog patches clearing. Humidex 31, UV index 9. No alerts.

---

## Update — 16:04 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-corps) Anthropic launched Claude Corps, a national fellowship program committing $150 million to place 1,000 early-career fellows at US nonprofits for one-year paid positions. Fellows earn $85,000 and receive Claude API access; applications for the first cohort of 100 close July 17, with the program starting October 2026.

## AI Tooling

- [OpenClaw](https://github.com/openclaw/openclaw/releases/tag/v2026.6.10) OpenClaw 2026.6.10 stable shipped June 26, adding automatic fast mode for short conversational turns that reverts to normal mode for longer work, improved channel progress handling, tighter Zai model synthesis and Zhipu GLM failover, and stronger trusted tool policies.

## Just for You

- [Cloudflare Blog](https://blog.cloudflare.com/rollbacks-for-workflows/) Cloudflare Workflows now supports saga-pattern rollbacks: developers pass a `rollback` function alongside each `step.do()` call, and if a later step fails the engine executes compensating actions in reverse order automatically.

---

## Update — 22:02 UTC

## Security

- [CISA](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) Today is the federal patching deadline for two actively exploited CVEs: CVE-2026-12569, an improper access control flaw in Ubiquiti UniFi OS that lets a local-network attacker make unauthorized system changes without credentials, and CVE-2026-20230, an improper input validation bug in PTC Windchill and FlexPLM that allows an unauthenticated remote attacker to execute arbitrary code via a malicious network request.

## Just for You

- [Anthropic](https://www.anthropic.com/news) Anthropic is hosting "The Briefing: AI for Science" on June 30 at 10 a.m. PST, featuring Claude leadership and pharmaceutical partnership announcements. Nobel laureate John Jumper is expected to make his first public appearance alongside the company. The event covers biotech research infrastructure applications.
