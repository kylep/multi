---
title: "Daily Digest: 2026-06-24"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-06-24
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-06-24
---

## AI Tooling

- [Anthropic / Releasebot](https://releasebot.io/updates/anthropic) Claude Code 2.1.186 ships MCP CLI authentication: `claude mcp login <name>` and `claude mcp logout <name>` authenticate against MCP servers without the interactive menu. Also adds workflow status filtering in the `/workflows` agent detail view and automatic Claude reactions to `!` bash commands.

- [GitHub / Releasebot](https://releasebot.io/updates/github) GitHub Copilot enterprise usage metrics API now exposes per-user AI credit consumption with daily and 28-day reports alongside existing Copilot usage data, supporting usage-based billing planning.

## Security

- [NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-48027) CVE-2026-48027 (CVSS 9.8): a malicious version of Nx Console (v18.95.0) was published to VS Marketplace on May 19 for 18 minutes before removal. The compromised extension harvested credentials from approximately 6,000 developers. Upgrade to v18.100.0 to remediate.

- [Apache / OpenCVE](https://app.opencve.io/cve/?vendor=apache&product=apache_apisix) CVE-2026-49230: Apache APISIX versions 3.8.0 through 3.16.0 are vulnerable to authentication bypass via the jwe-decrypt plugin under default configuration. Published June 19; patch by upgrading beyond 3.16.0.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/06/22/keir-starmer-resigns-uk-prime-minister.html) UK Prime Minister Keir Starmer resigned June 22 after losing the confidence of Labour MPs, less than two years after the party's landslide election win. Greater Manchester Mayor Andy Burnham is the likely successor; a new leader is expected before Parliament returns in September.

- [Washington Post](https://www.washingtonpost.com/politics/2026/06/24/trump-nato-mark-rutte-iran/a08d61f0-6f81-11f1-8730-e7fd0e2a6404_story.html) NATO Secretary-General Mark Rutte met Trump at the White House on June 24 to ease tensions ahead of the July NATO summit in Ankara. The Pentagon is reviewing the size of the US military footprint in Europe; Trump has threatened troop reductions over defense spending disputes.

## Local

- [Town of Whitby](https://www.whitby.ca/news/) Whitby council voted June 24 to declare two parcels of Downtown Whitby land as surplus and convey them to Habitat for Humanity Greater Toronto Area for construction of approximately 40 affordable housing units, supporting commitments under the federal Housing Accelerator Fund.

- [TTC](https://www.ttc.ca/about-the-ttc/Making-TTC-a-Diverse-and-Inclusive-Organization/Toronto-Pride-2026) Toronto Pride 2026 festival runs June 25–28, with the Pride Parade on June 28. TTC service diversions apply June 26–28; the 94 Wellesley route will operate Pride-branded buses. The festival overlaps with ongoing FIFA World Cup matches at BMO Field through July 2.

## Weather

- Whitby: 25°C high, 15°C overnight low, sunny becoming a mix of sun and cloud this afternoon. 30% chance of showers overnight. Northwest 20 km/h shifting to southwest 20 km/h. UV index 8 (very high). No alerts. (Source: Environment Canada)

## Just for You

- [Cloudflare / Releasebot](https://releasebot.io/updates/cloudflare) Cloudflare R2 SQL adds major analytical query support: window functions (ROW_NUMBER, RANK, DENSE_RANK), SELECT DISTINCT, set operations (UNION, INTERSECT, EXCEPT), and new aggregates MEDIAN and PERCENTILE_CONT.

- [Cloudflare / Releasebot](https://releasebot.io/updates/cloudflare) Cloudflare WAF adds managed protection for CVE-2026-10520 (Ivanti Sentry OS command injection). Detection for CVE-2026-39813 (Fortinet FortiSandbox path traversal) scheduled to deploy June 29.

- [Cloudflare / Releasebot](https://releasebot.io/updates/cloudflare) Cloudflare Workflows rollback handlers now receive full step context (name, count, attempt, configuration) enabling customized recovery logic when downstream systems fail.

## GitHub Trending

mattpocock/skills debuts at #1 with 11,784 weekly stars, bumping Agent-Reach from #1 to #4. NVIDIA/SkillSpector and OpenCut-app/OpenCut drop off the list. penpot/penpot enters at #8 with 3,423 weekly stars. Agent skills collections and real-world coding tooling dominate the top five for a second week running.
