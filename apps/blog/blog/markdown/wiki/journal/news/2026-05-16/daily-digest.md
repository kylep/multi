---
title: "Daily Digest: 2026-05-16"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-16
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-16
---

## AI Industry

- [The Decoder](https://the-decoder.com/microsoft-pulls-claude-code-licenses-and-pushes-developers-back-toward-its-own-ai-tool/) Microsoft is revoking Claude Code licenses from its Experiences & Devices division (Windows, Microsoft 365, Outlook, Teams, Surface) by June 30, 2026 — the fiscal year-end cutoff. Internal sources say cost savings are the primary driver; affected developers will be pushed to GitHub Copilot CLI instead.

- [Ramp / VentureBeat](https://ramp.com/leading-indicators/ai-index-may-2026) For the first time, Anthropic's Claude leads OpenAI's ChatGPT in US business adoption, with Claude reaching 34.4% of companies surveyed versus 32.3% for ChatGPT. Anthropic quadrupled its share over the past year while OpenAI grew by 0.3%.

- [Anthropic](https://www.anthropic.com/news/gates-foundation-partnership) Anthropic and the Gates Foundation announced a four-year, $200M initiative covering grant funding, Claude usage credits, and technical support for programs in global health, life sciences, education, and economic mobility.

- [Google Blog](https://blog.google/products-and-platforms/platforms/android/gemini-intelligence/) Google announced Gemini Intelligence for Android, rolling out agentic capabilities including multi-step task execution (building shopping carts, booking reservations, form filling) and summarizing web content. Initial availability on select Samsung and Google phones this summer.

## AI Tooling

- [Axios](https://www.axios.com/2026/05/14/anthropic-claude-price-openai-tokens) Anthropic re-enabled third-party agent tool integrations on paid Claude plans but placed the usage behind a separate credit meter. Previously these integrations were included in subscription limits.

- [Havoptic](https://www.havoptic.com/tools/github-copilot) GitHub Copilot moves to usage-based AI Credits billing on June 1, 2026. New sign-ups for Copilot Pro and Pro+ are paused in the interim. GitHub Copilot CLI v1.0.48 (May 14) shows actual token prices in the model picker instead of dot indicators.

- [Microsoft 365 Blog](https://www.microsoft.com/en-us/microsoft-365/blog/2026/05/05/copilot-cowork-from-conversation-to-action-across-skills-integrations-and-devices/) Microsoft launched Copilot Cowork through its Frontier program, shifting Copilot from a chat assistant to an execution layer that can accept delegated tasks and complete them autonomously across Microsoft 365 apps.

## Open Source

- [PostgreSQL](https://www.postgresql.org/about/news/) PostgreSQL 18.4 shipped on May 11, 2026, alongside maintenance releases 17.10, 16.14, 15.18, and 14.23. Users on PostgreSQL 14 should note it reaches end-of-life later this year.

## Security

- [NVD / Picus Security](https://nvd.nist.gov/vuln/detail/CVE-2026-42945) CVE-2026-42945 (NGINX Rift, CVSS 9.2): an 18-year-old heap buffer overflow in nginx's rewrite module allows unauthenticated attackers to crash worker processes and, on systems with ASLR disabled, execute arbitrary code. Affects nginx 0.6.27 through 1.30.0 and NGINX Plus R32–R36. A public PoC is available. Upgrade to nginx 1.31.0 or 1.30.1 immediately.

- [The Hacker News](https://thehackernews.com/2026/05/cisa-adds-actively-exploited-linux-root.html) CVE-2026-31431 (CVSS 7.8): a locally exploitable Linux privilege escalation flaw added to CISA's Known Exploited Vulnerabilities catalog. The bug impacts a significant share of cloud Linux workloads and millions of Kubernetes clusters. No remote access needed — any unprivileged local user can reach root.

## Geopolitics

- [WEF](https://www.weforum.org/stories/2026/05/blockade-diplomacy-and-other-geopolitical-stories-to-know-this-month/) Hungary's national elections ended Viktor Orbán's 16-year rule, with incoming Prime Minister Péter Magyar pledging to deepen EU ties and reset Hungary's relationship with Brussels.

- [WEF](https://www.weforum.org/stories/2026/05/blockade-diplomacy-and-other-geopolitical-stories-to-know-this-month/) China announced new incentives for Taiwan, including resuming direct flights and expanding Taiwanese media access on the mainland, following a KMT opposition leader's visit to Beijing.

## Local

- [CP24](https://www.cp24.com/) TTC and the union representing roughly 700 maintenance workers have not reached a contract agreement, raising the prospect of service disruptions during Toronto's FIFA World Cup games. Negotiations are ongoing.

- [City of Toronto](https://www.toronto.ca/news/) Toronto is releasing the second batch of free tickets today for its official FIFA World Cup fan festival, which will host public screenings across the city during the tournament.

- [Ontario](https://www.ontario.ca/) Ontario lowered its recommended colorectal cancer screening age from 50 to 45, bringing provincial guidelines in line with updated Canadian Cancer Society recommendations.

## Weather

- Whitby: 20°C high, 11°C low, 40% chance of showers in the afternoon with risk of a thunderstorm. Winds turning west 30 km/h gusting to 50 late morning. No alerts. Source: Environment Canada.

## Just for You

- [endoflife.date / GitHub](https://endoflife.date/argo-cd) ArgoCD 3.1 reached end-of-life on May 6 and will no longer receive bug or security fixes. Version 3.3.10 was released May 12 and is the recommended upgrade target; supported branches are v3.2, v3.3, and v3.4.

- [Cloudflare Release Notes](https://releasebot.io/updates/cloudflare) Cloudflare R2 SQL now supports joining multiple Iceberg tables in a single query, enabling cross-table analytics without exporting data. The Developer Platform also added a Domains tab in the Workers dashboard for buying and managing Worker routing.
