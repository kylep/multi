---
title: "Daily Digest: 2026-05-03"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-03
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-03
---

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/04/30/anthropic-potential-900b-valuation-round-could-happen-within-two-weeks/) Anthropic is in talks for a new funding round that would value the company at over $900B, which would surpass OpenAI's $852B post-money valuation from earlier this year. The round is expected within two weeks.

- [CNN Business](https://www.cnn.com/2026/05/01/tech/pentagon-ai-anthropic) The Pentagon signed AI deals with seven companies — OpenAI, Google, Microsoft, NVIDIA, Amazon Web Services, SpaceX, and Reflection — covering classified network access. Anthropic was excluded after the company insisted on safety guardrails for AI use in warfare.

- [The Register](https://www.theregister.com/2026/04/30/openai_anthropic_top_lines_research_counterpoint/) Anthropic held a 31.4% share of global LLM revenue in Q1 2026, narrowly ahead of OpenAI at 29%, despite having far fewer users. Anthropic's annual run rate has surpassed $30B and is reportedly closer to $40B.

- [Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/) Microsoft Agent 365 is now generally available. It extends Entra network controls to Copilot Studio agents, enables registry sync with AWS Bedrock and Google Cloud, and adds automatic agent inventory across platforms.

- [FX Leaders](https://www.fxleaders.com/news/2026/05/02/microsoft-stock-forecast-may-3-2026-azure-and-copilot-drive-ai-growth-even-as-capital-spending-rises/) Microsoft Q3 2026 earnings came in at $82.9B revenue, beating expectations. The AI business reached a $37B annual run rate and Microsoft 365 Copilot passed 20M paid seats, up from 15M in January.

## AI Tooling

- [Releasebot / Anthropic](https://releasebot.io/updates/anthropic) Claude Opus 4.7 is now generally available at the same $5/$25 per MTok pricing as Opus 4.6. It adds higher-resolution vision and improvements to software engineering and long-running coding tasks.

- [Claude Code Changelog](https://releasebot.io/updates/anthropic/claude-code) Claude Code ships a broad update covering smarter model picking (now reading from gateway's /v1/models endpoint), a new `claude project purge` command, Bedrock service tier selection via `ANTHROPIC_BEDROCK_SERVICE_TIER`, expanded OpenTelemetry logging, improved OAuth login, and Windows/PowerShell fixes.

- [Anthropic Labs](https://releasebot.io/updates/anthropic) Claude Design launches from Anthropic Labs as a design exploration tool that lets Claude visualize software interface options, iterate on feedback, and export to tools starting with Canva.

- [Havoptic](https://www.havoptic.com/tools/github-copilot) GitHub Copilot v1.0.40 shipped May 1, fixing PR branch decoration and resetting slash command features.

## Open Source

- [GitHub / Lukilabs](https://github.com/lukilabs/craft-agents-oss) Lukilabs released Craft Agents OSS on May 2 under Apache 2.0. The agent framework includes multi-session inbox, streaming responses with tool visualization, multi-LLM connections, and integration with 32+ Craft document tools via MCP.

## Security

- [The Hacker News](https://thehackernews.com/2026/04/new-linux-copy-fail-vulnerability.html) CVE-2026-31431, codenamed "Copy Fail" (CVSS 7.8), enables local privilege escalation to root via a 732-byte exploit on Linux distributions shipped since 2017, including Amazon Linux, RHEL, SUSE, and Ubuntu.

- [SecurityWeek](https://www.securityweek.com/critical-github-vulnerability-exposed-millions-of-repositories/) CVE-2026-3854 is a critical RCE in GitHub's internal Git infrastructure discovered by Wiz. Any authenticated user could execute arbitrary commands on GitHub's backend servers with a single `git push`. A patch has been deployed.

- [The Hacker News](https://thehackernews.com/2026/04/cisa-adds-4-exploited-flaws-to-kev-sets.html) CISA added four actively exploited CVEs to its KEV catalog, including a CVSS 9.9 flaw in SimpleHelp and vulnerabilities in Samsung MagicINFO 9 Server and D-Link DIR-823X routers. Federal agencies must apply mitigations by May 8, 2026.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/04/13/trump-threatens-50percent-tariffs-on-china-as-report-suggests-plans-for-arms-shipment-to-iran.html) President Trump is scheduled to meet with Chinese President Xi Jinping in Beijing on May 14–15 for a summit that may advance trade discussions. The US and China currently operate under a tariff reduction agreement holding mutual tariffs at 10%, in effect through November 2026.

## Local

- [Toronto Police Service](https://www.tps.ca/media-centre/news-releases/65747/) The 2026 Toronto Marathon runs today with full, half, 10km, and 5km races starting from 7:30 a.m., causing significant road closures across downtown Toronto.

- [City of Toronto](https://www.toronto.ca/news/) Mayor Olivia Chow and Deputy Mayor Ausma Malik launched the second annual Keep Toronto Beautiful campaign on May 2, with targeted cleaning blitzes aimed at high-need public spaces ahead of the FIFA World Cup 2026.

## Weather

- Whitby: 14°C high, 8°C low. Mix of sun and cloud, winds becoming southwest 20 km/h gusting to 40 near noon. 70% chance of showers tonight. Yellow Frost Advisory in effect — patchy frost expected early morning. Source: [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939)

## Just for You

- [GitHub / Alishahryar1](https://github.com/Alishahryar1/free-claude-code) free-claude-code is trending strongly at 9,364 stars this week (20,418 total). It enables Claude Code use at no cost via terminal, VSCode extension, or Discord, similar in spirit to OpenClaw.

---

## Update — 17:00 UTC

## AI Industry

- [Quartz](https://qz.com/anthropic-trillion-dollar-valuation-secondary-markets-openai-052626) Anthropic crossed a $1 trillion implied valuation on secondary market platform Forge Global this week, surpassing OpenAI at $880B on the same platform. The milestone follows a 233% jump in annualized revenue to $30B in Q1 2026, driven primarily by Claude Code and enterprise API adoption.

- [Meta Investor Relations](https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-First-Quarter-2026-Results/default.aspx) Meta Q1 2026 revenue rose 33% to $56.31B, beating analyst estimates of $55.52B. The company raised its full-year capex guidance to $125–145B (up from $115–135B) to fund AI infrastructure expansion including large-scale NVIDIA GPU deployments.

## AI Tooling

- [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/next-generation-gemini-deep-research/) Google launched Deep Research and Deep Research Max, both built on Gemini 3.1 Pro. The Max tier adds MCP support for connecting to custom and professional data sources, native chart generation, and extended test-time compute for background workflows. Deep Research Max scores 93.3% on DeepSearchQA, up from 66.1% for the prior release. Both are available in public preview via paid Gemini API tiers.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/cisa-adds-actively-exploited-linux-root.html) CISA added CVE-2026-31431 ("Copy Fail") to its KEV catalog today after confirming active exploitation in the wild. The Linux privilege escalation flaw (CVSS 7.8) poses elevated risk in containerized environments, as the exploit can breach container isolation to gain control of the host machine.

- [CyberScoop](https://cyberscoop.com/cpanel-authentication-bypass-vulnerability-cve-2026-41940-exploited/) CVE-2026-41940 is a CVSS 9.8 pre-authentication bypass in cPanel & WHM, added to CISA's KEV catalog April 30. Approximately 1.5 million cPanel instances are internet-exposed. Exploitation was active for roughly two months before an emergency patch shipped April 28; federal agencies must remediate by May 21.

## Local

- [CP24](https://www.cp24.com/news/canada/2026/05/01/toronto-mayoral-candidate-nominations-to-open-friday/) Toronto's 2026 municipal election is underway with candidate nominations open as of May 1. Early entrants include Councillor Brad Bradford, former deputy mayor Ana Bailão, and Councillor Gord Perks. Incumbent mayor Olivia Chow has not confirmed whether she will seek a full term. Election day is October 26, 2026.
