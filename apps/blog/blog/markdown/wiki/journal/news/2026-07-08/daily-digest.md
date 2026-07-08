---
title: "Daily Digest: 2026-07-08"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-08
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-08
---

## AI Industry

- [Bloomberg](https://finance.yahoo.com/technology/ai/articles/microsoft-replaces-openai-anthropic-own-161946596.html) Microsoft is routing tens of thousands of weekly AI prompts in Excel and Outlook through its internally built MAI models, reducing reliance on OpenAI and Anthropic. Microsoft AI chief Mustafa Suleyman said the goal is to "ultimately eliminate" external model spend; the next targets are GitHub Copilot and Teams.

- [SiliconAngle](https://siliconangle.com/2026/07/06/anthropic-inks-19b-ai-data-center-lease-terawulf/) Anthropic signed a 20-year, $19B data center lease with TeraWulf at its Justified Data campus in Hawesville, Kentucky, covering 401 MW of critical IT load. Initial capacity comes online in late 2027, with full capacity by early 2028.

- [UN News](https://news.un.org/en/story/2026/07/1167862) The 44-member UN AI governance commission held its first formal session in Geneva on July 8. Members include Jensen Huang, Andy Jassy, Brad Smith, Jack Clark of Anthropic, and Aidan Gomez of Cohere, alongside heads of state from Estonia, Iceland, Kazakhstan, Namibia, Saudi Arabia, Singapore, and Nigeria.

## AI Tooling

- [Android Headlines](https://www.androidheadlines.com/2026/07/claude-fable-5-drops-subscriptions-pay-per-use-credits.html) Claude Fable 5 moved to usage-based billing effective July 8 — $10 per million input tokens and $50 per million output, on top of subscription costs, across Pro, Max, Team, and Enterprise tiers. Anthropic's Persona ID verification requirement for Fable 5 access also took effect today.

- [Releasebot](https://releasebot.io/updates/anthropic/claude-code) Claude Code v2.1.200 (released July 3) switched the default permission mode from Auto to Manual across the CLI, VS Code extension, and JetBrains plugin. Every file write, shell command, and network call now requires explicit user approval; Auto mode requires opt-in. Anthropic cited JADEPUFFER-class autonomous attack chains as the direct security motivation.

- [BigGo Finance](https://finance.biggo.com/news/6f0c6bb2-795f-4c57-9d09-6db691d7638a) Google pushed Gemini 3.5 Pro to a July 17 target after scrapping the existing 2.5 Pro architecture for a complete rebuild. The redesigned model targets improvements in math reasoning, SVG scene generation, and long-horizon agentic tasks, with a 2-million-token context window and a Deep Think reasoning layer.

## Security

- [Sysdig](https://www.sysdig.com/blog/jadepuffer-agentic-ransomware-for-automated-database-extortion) Sysdig documented JADEPUFFER, the first confirmed fully autonomous AI ransomware operation. An LLM agent exploited CVE-2025-3248 in Langflow, then chained reconnaissance through encryption across 600+ adaptive payloads without any human direction, ultimately encrypting 1,342 Nacos service configurations. The encryption key was generated once, printed, and never stored or transmitted.

- [The Hacker News](https://thehackernews.com/2026/06/attackers-exploit-simplehelp-cve-2026.html) CVE-2026-48558 (CVSS 10.0) in SimpleHelp RMM is under active exploitation via an unsigned OIDC token bypass that grants unauthenticated technician-level access. Threat actors are using it to deploy TaskWeaver and Djinn Stealer across managed-service-provider environments. CISA added it to KEV with a July 2 remediation deadline. Patch: SimpleHelp 5.5.16 or 6.0 RC2.

- [Bleeping Computer](https://www.bleepingcomputer.com/news/security/new-oracle-e-business-suite-flaw-now-exploited-in-attacks/) CVE-2026-46817 (CVSS 9.8) in Oracle E-Business Suite's Payments File Transmission module is under active attack since June 27, with approximately 950 internet-facing instances exposed. The unauthenticated HTTP exploit targets the ibytransmit endpoint directly; Oracle patched in May. Treat any unpatched instance as potentially compromised.

## Geopolitics

- [Ukrainska Pravda](https://www.pravda.com.ua/eng/news/2026/07/7/8042815/) Trump and Zelenskyy met on the sidelines of the NATO Ankara Summit on July 8 — the first direct bilateral meeting since January — with the primary agenda focused on a US-brokered ceasefire framework for Ukraine.

## Weather

- Whitby: 30°C high, 19°C overnight low. Mainly sunny becoming a mix of sun and cloud, 30% chance of afternoon and evening showers. Humidex 36, UV index 9 (very high). No alerts. Source: Environment Canada.

## Just for You

- [GitHub](https://github.com/asgeirtj/system_prompts_leaks) asgeirtj/system_prompts_leaks enters the GitHub weekly top 8 at #7 (5,337 new stars this week, 53,512 total) — regularly updated repository of extracted system prompts from Claude Fable 5, Opus 4.8, Claude Code, ChatGPT 5.5, Codex, Gemini 3.5, Grok, Cursor, Copilot, VS Code, and Perplexity.

- [GitHub](https://github.com/MadsLorentzen/ai-job-search) MadsLorentzen/ai-job-search enters the weekly top 8 at #6 (5,363 new stars this week, 12,946 total) — Claude Code-based job application framework that evaluates listings, tailors CVs, writes cover letters, and prepares interview answers from a personal profile.

---

## Update — 16:03 UTC

## AI Industry

- [OpenAI](https://openai.com/index/previewing-gpt-5-6-sol/) OpenAI confirmed the full public launch of GPT-5.6 Sol, Terra, and Luna for Thursday July 9, following the limited-preview release on June 26. Sol runs on Cerebras hardware at up to 750 tokens per second; a new "ultra mode" delegates sub-tasks to specialized agents for complex multi-step work.

## AI Tooling

- [Anthropic](https://www.anthropic.com/news/claude-sonnet-5) Claude Sonnet 5 is now the default model in Claude Code, replacing Sonnet 4.6. It ships with a native 1M-token context window, 128k max output, and adaptive thinking. Introductory API pricing is $2/$10 per million input/output tokens through August 31, rising to $3/$15 afterward.

## Local

- [Whitby Ribfest](https://whitbyribfest.com/) Whitby Ribfest runs July 10–12 at Victoria Fields, organized by the Rotary Club of Whitby Sunrise. The Trews headline a Friday night concert July 10; Saturday and Sunday are free. With Oshawa Ribfest on pause this year, this is the only local event of its kind in the region.

---

## Update — 20:15 UTC

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/07/08/spacexai-releases-grok-4-5-which-elon-describes-as-an-opus-class-model/) SpaceXAI released Grok 4.5 on July 8, a 1.5-trillion-parameter model trained across tens of thousands of NVIDIA GB300 GPUs. Elon Musk describes it as "Opus-class," targeting coding, agentic tasks, and knowledge work. Priced at $2/$6 per million input/output tokens; EU availability expected mid-July.

## Security

- [Bleeping Computer](https://www.bleepingcomputer.com/news/security/max-severity-adobe-coldfusion-flaw-now-exploited-in-attacks/) CVE-2026-48282 (CVSS 10.0) in Adobe ColdFusion is under active exploitation via a path traversal flaw in the RDS component that allows unauthenticated RCE. Exploitation began July 2, within minutes of a public technical writeup. CISA added it to KEV with a July 10 federal patch deadline. Approximately 750 internet-facing ColdFusion servers are currently tracked by Shadowserver. Patch: ColdFusion 2025 Update 10 or ColdFusion 2023 Update 21.

## Geopolitics

- [Washington Post](https://www.washingtonpost.com/world/2026/07/07/tanker-fire-after-being-struck-strait-hormuz-british-military-says/) Iran's IRGC attacked three commercial vessels in the Strait of Hormuz on July 7–8, prompting the US to reinstate oil sanctions and launch strikes on over 80 Iranian military sites via CENTCOM. Iran counterattacked US bases in Bahrain and Kuwait. Trump declared the ceasefire — signed under the Islamabad Memorandum — is over.

## Local

- [CTV News](https://www.ctvnews.ca/toronto/local/durham/article/second-toddler-attacked-by-coyote-in-whitby-left-with-serious-injuries/) A 2-year-old was bitten in the face by a coyote at Vanier Park playground in Whitby on July 6 in an unprovoked attack, the second such incident in Whitby in under a month. The child was treated for serious but non-life-threatening injuries. The town's dashboard shows 96 coyote sightings in the last 30 days.

## Just for You

- [The Hacker News](https://thehackernews.com/2026/07/unpatched-argo-cd-repo-server-flaw.html) An unpatched flaw in Argo CD's repo-server gRPC endpoint allows an attacker with internal network access to retrieve the Redis password, manipulate cached deployment data, and push malicious manifests to production — no CVE assigned. Synacktiv disclosed it July 1 after reporting it to maintainers 18 months prior. Network policies that would block the attack vector are not enabled by default in Helm chart deployments.
