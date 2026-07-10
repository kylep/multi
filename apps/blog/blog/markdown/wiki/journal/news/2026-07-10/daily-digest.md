---
title: "Daily Digest: 2026-07-10"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-10
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-10
---

## AI Industry

- [CGTN](https://news.cgtn.com/news/2026-07-10/OpenAI-unveils-super-app-as-rivalry-with-Anthropic-intensifies-1OF7nrvaglG/p.html) OpenAI launched ChatGPT Work on July 10 — a combined ChatGPT and Codex product for creating documents, presentations, and websites. Powered by GPT-5.6; rolling out to Pro, Enterprise, and Edu users first, with Plus and Business following within days.

- [Anthropic](https://www.anthropic.com/news) Claude Cowork expanded to mobile and web, letting sessions and files persist across devices. New capabilities include background work, scheduled tasks, shared chats and projects, and mobile approvals.

- [NVIDIA Newsroom](https://nvidianews.nvidia.com/news/meta-builds-ai-infrastructure-with-nvidia) Meta's custom AI chip "Iris," co-developed with Broadcom and manufactured by TSMC, begins production in September. Meta plans to deploy 7 GW of AI compute this year, doubling to 14 GW in 2027, with up to $145B in infrastructure spend.

## AI Tooling

- [LogRocket Blog](https://blog.logrocket.com/ai-dev-tool-power-rankings/) Moonshot AI's K2.7 Code model is now available in the GitHub Copilot model roster.

- [Lushbinary](https://lushbinary.com/blog/ai-coding-agents-comparison-cursor-windsurf-claude-copilot-kiro-2026/) Cursor Teams now includes MCP server support, letting teams connect external data sources and tools directly from the Cursor IDE.

## Security

- [CISA](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) CVE-2026-56290 (CVSS 10.0): Langflow authorization bypass reached its CISA KEV federal remediation deadline today. This is separate from CVE-2025-3248 that the JADEPUFFER ransomware agent exploited earlier this month.

- [CloudNativePG](https://cloudnative-pg.io/releases/) CloudNativePG 1.29.1 patches CVE-2026-44477 (CVSS 9.4) in the Prometheus metrics exporter, plus additional Go runtime CVEs and a data-safety bug in the HA failover path. Affects PostgreSQL operators running on Kubernetes.

## Geopolitics

- [CSIS](https://www.csis.org/programs/latest-analysis-war-iran) China deployed a 352-meter floating barrier in the South China Sea this week, widening the territorial dispute with US-aligned neighbors and highlighting unresolved gaps in US-China strategic posture.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto) A fire at a North York apartment building early Thursday morning displaced multiple seniors; two women were hospitalized for smoke inhalation.

- [todocanada](https://www.todocanada.ca/things-to-do-in-toronto-this-weekend/) The IMSA WeatherTech SportsCar Championship makes its only Canadian stop at Toronto July 10–12 as part of the Chevrolet Grand Prix, featuring prototype and GT machinery.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby: 25°C high, 19°C low, 80% chance of rain. Severe thunderstorm watch in effect for the southern Durham Region — wind gusts up to 90 km/h and localized rainfall up to 60 mm possible.

## Just for You

- [GitHub](https://github.com/alibaba/page-agent) alibaba/page-agent enters the weekly top 8 (4,459 stars this week, 25,670 total) — a JavaScript in-page GUI agent that controls web interfaces via natural language prompts.

- [GitHub](https://github.com/stablyai/orca) stablyai/orca enters the weekly top 8 (4,111 stars this week, 15,598 total) — a desktop and mobile app for running fleets of parallel coding agents on your own subscriptions.

---

## Update — 16:02 UTC

## AI Industry

- [BigGo Finance](https://finance.biggo.com/news/6f0c6bb2-795f-4c57-9d09-6db691d7638a) Google DeepMind postponed Gemini 3.5 Pro to July 17, scrapping the existing architecture for a ground-up rebuild. The new model targets a 2M token context window, a Deep Think reasoning layer, and improved SVG and image quality to compete with GPT-5.6 and Fable 5.

- [CNBC](https://www.cnbc.com/2026/07/01/meta-stock-cloud-ai-compute.html) Meta is launching Meta Compute, a cloud infrastructure unit selling spare AI compute capacity to external customers. The move puts Meta in direct competition with AWS, Azure, and Google Cloud.

- [Mezha](https://mezha.net/eng/bukvy/e43b4ad9_openai_confirms_gpt-5-6/) Microsoft 365 Copilot now offers Claude as a selectable model alongside its own options, following a broader July update wave. Microsoft also confirmed GPT-5.6 powers the Copilot suite as M365 Copilot reaches 20 million paid seats.

- [MacRumors](https://www.macrumors.com/2026/07/09/openai-chatgpt-work/) OpenAI's GPT-5.6 family ships three tiers: Sol (flagship), Terra (balanced for routine workloads), and Luna (fastest, lowest cost). Free users get Terra; Plus, Pro, Business, and Enterprise get Sol.

## AI Tooling

- [Anthropic Releasebot](https://releasebot.io/updates/anthropic/claude-code) Claude Code sets Claude Sonnet 5 as the default model, with a native 1M-token context window and promotional pricing of $2/$10 per Mtok through August 31. Version 2.1.206 also adds smarter navigation, login expiry warnings, and worktree safety improvements.

- [Anthropic Releasebot](https://releasebot.io/updates/anthropic/claude) Claude Reflect launched July 9 in beta across Free, Pro, and Max plans — a monthly recap at Settings > Reflect showing topics worked on, peak hours, and most active days, plus break reminders and quiet hours controls.

- [Anthropic Releasebot](https://releasebot.io/updates/anthropic/claude) Claude's Microsoft 365 connector now includes write access: users can draft and send email, manage calendar events, update OneDrive and SharePoint files. Teams access remains read-only.

- [Anthropic Releasebot](https://releasebot.io/updates/anthropic/claude) Claude Enterprise added an Analytics API for exporting usage data to platforms like Datadog, model-level entitlements for role-based model access, and spend alerts at 75% and 90% of configured limits.

- [MacRumors](https://www.macrumors.com/2026/07/10/openais-chatgpt-atlas-browser-shutting-down/) OpenAI is shutting down its ChatGPT Atlas browser. Deprecation takes effect August 9.

## Security

- [The Hacker News](https://thehackernews.com/2026/07/unpatched-argo-cd-repo-server-flaw.html) Synacktiv disclosed an unpatched flaw in ArgoCD's repo-server (reported January 2025, still no CVE or patch). An attacker with internal network access can execute arbitrary commands via a kustomize flag, retrieve the Redis password, and inject malicious manifests into auto-syncing clusters. Mitigation: enforce Kubernetes network policies to isolate repo-server and Redis ports.

- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) CVE-2026-48282 (CVSS 10.0): Adobe ColdFusion path traversal vulnerability enabling arbitrary code execution, added to CISA's Known Exploited Vulnerabilities catalog on July 8. Federal agencies must remediate immediately.

## Local

- [INdurham](https://durham.insauga.com/region/whitby/) Whitby Ribfest runs July 10–12 at Victoria Fields — ribs, live entertainment, and family activities.

- [CTV News](https://www.ctvnews.ca/toronto/local/durham/article/second-toddler-attacked-by-coyote-in-whitby-left-with-serious-injuries/) Durham police issued a public warning after a second toddler was bitten in the face by a coyote in Whitby, leaving the child with serious injuries. Residents are advised to keep children close and avoid leaving pets unattended outdoors.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby update 16:00 UTC: 28°C high, 19°C low, 30% chance of afternoon showers with a risk of thunderstorms. Severe thunderstorm watch from this morning has cleared — no active alerts.

---

## Update — 20:00 UTC

## AI Tooling

- [GitHub Changelog](https://github.blog/changelog/2026-07-09-openais-gpt-5-6-sol-terra-and-luna-are-now-available-in-github-copilot/) GitHub Copilot now offers all three GPT-5.6 tiers: Sol for complex reasoning over large codebases (Pro+, Max, Business, Enterprise only), Terra as the default for everyday coding, and Luna as the lightweight low-cost option. All three are billed at provider list pricing under Usage Based Billing.

## Security

- [JetBrains](https://www.jetbrains.com/privacy-security/issues-fixed/) JetBrains patched three vulnerabilities on July 10: CVE-2026-59792 (CVSS 9.6) in IntelliJ IDEA before 2026.1.4 enables remote code execution via path traversal in project workspace ID handling; CVE-2026-59793 allows arbitrary file access in TeamCity via a Perforce VCS integration flaw; CVE-2026-59794 is a stored XSS in TeamCity. All three are fixed in the latest releases.

## Geopolitics

- [Washington Post](https://www.washingtonpost.com/world/2026/07/10/trump-says-us-iran-will-keep-talking-declares-ceasefire-over/) Trump declared the US-Iran ceasefire "OVER" on Friday while leaving diplomatic talks open, saying the US will not adhere to the ceasefire terms. The announcement followed fresh US strikes on Iranian targets and retaliatory Iranian strikes on Bahrain and Kuwait at the NATO Ankara summit close.

- [Al Jazeera](https://www.aljazeera.com/video/newsfeed/2026/7/7/ukrainian-drones-hit-russian-fuel-tankers) Ukraine's drone campaign against Russia's shadow tanker fleet reached what commanders described as an "industrial scale" — 36 vessels struck in four days across the Black Sea and Sea of Azov, including 32 oil tankers, causing fuel shortages and emergency rationing in Crimea and driving Moscow to ban diesel exports.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby update 20:00 UTC: 26°C, partly cloudy this evening with a 30% chance of showers and risk of thunderstorm overnight, low 17°C. No active alerts.
