---
title: "Daily Digest: 2026-05-10"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-10
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-10
---

## AI Industry

- [Fortune](https://fortune.com/2026/05/08/anthropic-80fold-growth-quarter-renting-elon-musk-data-center/) Anthropic's revenue and usage grew 80-fold in Q1 on an annualized basis, reaching $30 billion annualized — triple last year's figure. To handle the load, Anthropic struck a deal to use SpaceX's Colossus 1 facility in Memphis, which houses over 220,000 NVIDIA GPUs and adds 300 megawatts of capacity within a month.

- [TechCrunch](https://techcrunch.com/2026/05/09/nvidia-has-already-committed-40b-to-equity-ai-deals-this-year/) NVIDIA has committed over $40 billion in equity investments in AI companies so far in 2026, including a $30 billion stake in OpenAI, up to $3.2 billion in Corning for optical fiber manufacturing, and up to $2.1 billion in data center operator IREN as part of a 5 GW infrastructure agreement.

- [TechCrunch](https://techcrunch.com/2026/05/04/anthropic-and-openai-are-both-launching-joint-ventures-for-enterprise-ai-services/) OpenAI is raising $4 billion for a new venture called The Development Company at a $10 billion valuation, with 19 investors participating.

## AI Tooling

- [Anthropic](https://www.anthropic.com/news) Anthropic doubled rate limits for Claude Code and Claude API across Pro, Max, Team, and seat-based Enterprise tiers, and removed peak-hour rate reductions for Pro and Max subscribers.

- [9to5Google](https://9to5google.com/2026/05/05/google-ai-ultra-lite-gemini-usage-limits/) Google is preparing a new "AI Ultra Lite" Gemini subscription tier to slot between the $20 Pro and $250 Ultra plans, with a dedicated token-budget dashboard for subscribers.

- [Microsoft 365 Blog](https://www.microsoft.com/en-us/microsoft-365/blog/2026/05/05/copilot-cowork-from-conversation-to-action-across-skills-integrations-and-devices/) Microsoft expanded Copilot Cowork with iOS and Android mobile apps and a growing plugin ecosystem, enabling multi-step task delegation across apps and business systems.

- [Engadget](https://www.engadget.com/2165562/xbox-is-ditching-microsofts-copilot-ai/) Xbox is removing Copilot from consoles and the Xbox mobile app; the AI assistant will no longer be part of any Xbox product.

## Open Source

- [GitHub](https://github.com/openclaw) OpenClaw has surged from roughly 9,000 to over 210,000 GitHub stars in 2026, making it one of the fastest-growing open source projects in GitHub history. The project is a local AI assistant that connects AI models to over 50 integrations including WhatsApp, Telegram, Discord, and iMessage.

## Security

- [The Hacker Wire](https://www.thehackerwire.com/argo-cd-cve-2026-42880-read-only-access-exposes-kubernetes-secrets/) CVE-2026-42880 in ArgoCD carries a CVSS score of 9.6 and allows any user with read-only access to extract plaintext Kubernetes secrets via the ServerSideDiff endpoint. Affected versions are 3.2.0–3.2.10 and 3.3.0–3.3.8; patch immediately to 3.2.11 or 3.3.9.

- [The Hacker News](https://thehackernews.com/2026/05/cisa-adds-actively-exploited-linux-root.html) CVE-2026-31431 is a local privilege escalation flaw in the Linux kernel that allows escalation to root and affects millions of Kubernetes clusters running Red Hat, SUSE, Ubuntu, and AWS Linux. CISA added it to the Known Exploited Vulnerabilities catalog with a federal remediation deadline of May 15.

- [The Hacker News](https://thehackernews.com/2026/05/palo-alto-pan-os-flaw-under-active.html) CVE-2026-0300 is an unauthenticated remote code execution vulnerability in Palo Alto Networks PAN-OS (User-ID Authentication Portal), scoring CVSS 9.3 when publicly accessible. Palo Alto confirmed limited active exploitation and expects software fixes by May 13.

## Geopolitics

- [NPR](https://www.npr.org/2026/05/03/nx-s1-5804691/modern-economic-chokepoints-in-war-and-the-impact-on-geopolitics) The Strait of Hormuz remains effectively closed due to the Iran conflict, blocking a significant share of global oil supply and driving up fuel and fertilizer prices worldwide.

- [Time](https://time.com/7343169/top-10-global-risks-2026/) The US has captured Venezuelan President Nicolás Maduro as part of its renewed focus on the Western Hemisphere.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto) Candidate nominations for Toronto's mayoral race opened this morning, officially starting the race to elect a new mayor.

- [CP24](https://www.cp24.com/) The Toronto Tempo host the Washington Mystics tonight at Coca-Cola Coliseum in the franchise's first-ever regular-season home game.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby: 14°C high, 2°C low, mainly sunny with northwest winds gusting to 40 km/h. Frost advisory in effect — patchy frost possible early this morning and again tonight into Monday morning, with potential damage to plants and crops.

## Just for You

- [Bloomberg](https://www.bloomberg.com/news/newsletters/2026-05-05/anthropic-announces-new-ai-agents-for-financial-professionals) Anthropic launched AI agents for financial professionals capable of drafting pitch decks, reviewing financial statements, and escalating compliance cases, targeting banking, insurance, asset management, and fintech.

- [The Hacker News](https://thehackernews.com/2026/05/critical-apache-http2-flaw-cve-2026.html) CVE-2026-23918 is a double-free vulnerability in Apache HTTP Server 2.4.66 with CVSS 8.8 enabling denial-of-service and potential remote code execution.

---

## Update — 16:04 UTC

## AI Industry

- [Engadget](https://www.engadget.com/2165585/anthropic-reportedly-agrees-to-pay-google-200-billion-for-chips-and-cloud-access/) Anthropic has committed to spend $200 billion with Google Cloud over the next five years, covering TPU chips and cloud capacity. The deal accounts for more than 40% of Google's disclosed revenue backlog and includes Broadcom-built TPU capacity coming online in 2027.

## AI Tooling

- [Claude Code Docs](https://code.claude.com/docs/en/changelog) Claude Code 2.1.138 shipped on May 9, fixing unbounded memory growth when stdio MCP servers write non-protocol data to stdout and improving MCP server error handling.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/ivanti-epmm-cve-2026-6973-rce-under.html) CVE-2026-6973 is an actively exploited remote code execution flaw in Ivanti EPMM (on-prem versions 12.8.0.0 and earlier). CISA's federal remediation deadline was today, May 10. Patches are available in versions 12.6.1.1, 12.7.0.1, and 12.8.0.1.

## Local

- [CBC News](https://www.cbc.ca/lite/news/canada/ontario/durham?sort=latest) Durham Region police are requesting a $1.1 billion budget, which could push residents' property tax increase above 10% next year.

---

## Update — 22:00 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-05-08/anthropic-inks-1-8-billion-computing-deal-with-akamai) Anthropic signed a seven-year, $1.8 billion computing deal with Akamai Technologies to handle surging Claude demand. Akamai did not name the customer at announcement; Bloomberg confirmed it as Anthropic. Akamai stock closed up 27% on May 8, its largest single-day gain in over 22 years.

## AI Tooling

- [Anthropic Blog](https://claude.com/blog/new-in-claude-managed-agents) Anthropic launched three new Claude Managed Agents features at its Code w/ Claude event (May 6): multi-agent orchestration for assigning subtasks across agent fleets, Outcomes for rubric-based self-evaluation with automatic retry, and Dreaming — a background process that reviews past sessions and updates agent memory to improve future runs. Outcomes and multi-agent orchestration are in public beta; Dreaming is in research preview.

## Security

- [SecurityWeek](https://www.securityweek.com/medtronic-hack-confirmed-after-shinyhunters-threatens-data-leak/) Medtronic confirmed on April 24 that ShinyHunters accessed corporate IT systems and claimed theft of approximately 9 million records. The company said manufacturing, distribution, and patient-connected networks were isolated and unaffected.

- [The Hacker News](https://thehackernews.com/2026/04/cisa-adds-actively-exploited.html) CISA added CVE-2024-1708 (ConnectWise ScreenConnect path traversal, CVSS 8.4) and CVE-2026-32202 (Windows Shell protection bypass, CVSS 4.3, linked to APT28) to the Known Exploited Vulnerabilities catalog. Federal remediation deadline is May 12.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto/toronto-cleanup-fifa-9.7190959) Toronto launched an expanded citywide cleanup blitz ahead of the FIFA World Cup, with the city's first match roughly five weeks out. Around 400 city staff will run weekend blitzes from May through October targeting potholes, graffiti, litter, and illegal dumping. Some community workers raised concerns that the effort could result in the displacement of unhoused residents near venue areas.
