---
title: "Daily Digest: 2026-04-04"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-04-04
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-04-04
---

## AI Tooling

- [VentureBeat](https://venturebeat.com/technology/anthropic-cuts-off-the-ability-to-use-claude-subscriptions-with-openclaw-and) Anthropic ended support for using Claude subscriptions with third-party agent tools such as OpenClaw, effective April 4 at 12 PM PT. Users can continue using Claude in OpenClaw but must now pay via API or Extra Usage billing rather than subscription limits. Anthropic cited unsustainable demand patterns from third-party harnesses; a one-time credit equal to one month's subscription is available through April 17, with up to 30% discounts on pre-purchased usage bundles.

- [Claude Code Changelog](https://code.claude.com/docs/en/changelog) Claude Code v2.1.91 shipped with MCP tool result persistence: the `_meta["anthropic/maxResultSizeChars"]` annotation now accepts up to 500K characters, letting large outputs such as database schemas pass through without truncation. MCP server descriptions are now capped at 2KB to prevent context bloat, and locally configured MCP servers take precedence over claude.ai connector duplicates.

- [Microsoft Copilot Blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/new-and-improved-multi-agent-orchestration-connected-experiences-and-faster-prompt-iteration/) Microsoft Copilot Studio multi-agent orchestration reached general availability in April. Features now GA include coordination with Microsoft Fabric agents, the Microsoft 365 Agents SDK, and open Agent-to-Agent (A2A) protocol support.

## Security

- [The Hacker News](https://thehackernews.com/2026/04/hackers-exploit-cve-2025-55182-to.html) Attackers exploited CVE-2025-55182 (CVSS 10.0, React Server Components deserialization RCE) to breach 766 Next.js hosts in 24 hours, stealing AWS credentials, Stripe keys, SSH keys, GitHub tokens, and database passwords. The campaign was attributed to threat group UAT-10608 using an automated credential harvester called NEXUS Listener.

## Geopolitics

- [CNN](https://edition.cnn.com/2026/04/04/world/live-news/iran-war-us-trump-oil) An F-15E Strike Eagle was shot down over Iran on April 3, the first U.S. aircraft downed by enemy fire since the conflict began. The pilot was rescued; a search for the weapons system officer continues April 4. An A-10 and two rescue helicopters were also hit during the recovery operation; all damaged aircraft crew were recovered.

## Local

- [CTV News Toronto](https://www.ctvnews.ca/toronto/) A Toronto police officer will not face criminal charges in the fatal shooting of a 32-year-old man at Danforth GO station, the Special Investigations Unit confirmed.
- [CBC Toronto](https://www.cbc.ca/news/canada/toronto/) Parents in a Toronto Catholic District School Board international language program are challenging the board's decision to cut the program for budget reasons starting next year.

## Weather

- Whitby: 6°C high, 6°C overnight low. Chance of showers throughout the day. Yellow rainfall warning active from Environment Canada: 20–40 mm expected this evening and overnight. Ground saturation from recent rainfall limits absorption; avoid low-lying areas near waterways. Heavy rain continues into Saturday.

## Just for You

- [The Hacker News](https://thehackernews.com/2026/04/hackers-exploit-cve-2025-55182-to.html) The CVE-2025-55182 Next.js breach campaign is directly relevant to the blog's Next.js infrastructure. The attack targets React Server Components in the App Router; any self-hosted Next.js deployment should verify it is patched and audit environment variable exposure.
