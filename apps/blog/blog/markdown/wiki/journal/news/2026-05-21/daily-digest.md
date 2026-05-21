---
title: "Daily Digest: 2026-05-21"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-21
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-21
---

## AI Industry

- [Windows Central](https://www.windowscentral.com/microsoft/microsoft-cancels-claude-code-licenses-shifting-developers-to-github-copilot-cli-a-move-likely-driven-by-financial-motives) Microsoft is canceling Claude Code licenses for its Experiences and Devices division (Windows, M365, Outlook, Teams, Surface) by June 30, directing those teams to GitHub Copilot CLI instead. Claude models remain accessible through Copilot CLI; the removal is specific to the Claude Code interface. Financial year-end timing and internal product strategy were cited in an executive memo.

## AI Tooling

- [Cursor Blog](https://cursor.com/blog/composer-2-5) Cursor launched Composer 2.5 on May 18, built on the Moonshot Kimi K2.5 open-source checkpoint with 25x more synthetic training tasks than its predecessor. It matches Claude Opus 4.7 on several coding benchmarks at roughly one-tenth the cost ($0.50 per million input tokens vs $15). Cursor disclosed the Kimi base model lineage at launch, acknowledging it was a miss not to do so when Composer 2 shipped in March.

- [GitHub Blog](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) GitHub Copilot transitions all plans to AI Credits-based flex billing on June 1. One credit equals $0.01 USD; usage is calculated from token consumption. Pro gets 1,500 credits per month (1,000 base plus 500 flex allotment); a new Max plan at $100 per month includes 20,000 credits. Flex allotments can adjust as model pricing changes.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/18-year-old-nginx-rewrite-module-flaw.html) CVE-2026-42945 "NGINX Rift" is a heap buffer overflow in ngx_http_rewrite_module with a CVSS 9.2 score, affecting all NGINX Open Source and Plus versions from 0.6.27 through 1.30.0 — a span of 18 years of releases. Active exploitation began three days after disclosure; patches are in NGINX Plus R36 P4, R37, and open source versions 1.30.1 and 1.31.0.

- [Qualys Blog](https://blog.qualys.com/vulnerabilities-threat-research/2026/05/20/cve-2026-46333-local-root-privilege-escalation-and-credential-disclosure-in-the-linux-kernel-ptrace-path) CVE-2026-46333 "ssh-keysign-pwn" is a Linux kernel ptrace logic flaw disclosed by Qualys on May 20 that lets any unprivileged local user read SSH host private keys and /etc/shadow on default installs of Debian, Fedora, and Ubuntu. The bug has been present since November 2016; Linus Torvalds committed the upstream fix on May 14. A public proof-of-concept is available on GitHub; distro patches are shipping now.

## Geopolitics

- [Al Jazeera](https://www.aljazeera.com/news/2026/5/16/two-presidential-campaign-staffers-killed-in-colombia-as-elections-near) Colombia's May 31 presidential election is proceeding under severe security conditions: 48 massacres and 249 deaths in the first four months of 2026, the highest pre-electoral toll in a decade. Two campaign staffers were killed last week in Meta department; at least three candidates have received death threats and are operating with heavy security.

## Weather

- Whitby: 15°C high, 2°C low, sunny with north winds 20 km/h gusting to 40 becoming light by mid-morning. UV index 8 (very high). Risk of frost overnight. No active alerts. (Environment Canada)

## Just for You

- [GitHub](https://github.com/colbymchenry/codegraph) colbymchenry/codegraph enters the GitHub weekly trending top 8 with 6,731 stars this week and 11,554 total. The project pre-indexes a codebase into a knowledge graph for Claude Code, Codex, Cursor, and OpenCode — reducing token usage and tool call count by letting agents query the graph rather than reading files directly.

---

## Update — 16:02 UTC

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/05/19/openai-co-founder-andrej-karpathy-joins-anthropics-pre-training-team/) Andrej Karpathy, OpenAI co-founder and former head of Tesla Autopilot, joined Anthropic on May 19 to work on pre-training under team lead Nick Joseph. He will start a new team that uses Claude to accelerate pre-training research.

- [Google Blog](https://blog.google/innovation-and-ai/technology/ai/google-io-2026-all-our-announcements/) At Google I/O 2026 (May 19-20), Google launched Gemini 3.5 Flash — generally available via Google AI Studio and Vertex AI, outperforming Gemini 3.1 Pro on coding and agentic benchmarks at Flash speeds. Google also announced Gemini Spark, a general-purpose agent that takes actions across connected apps on the user's behalf; it begins rolling out to AI Ultra subscribers in the US next week.

- [Axios](https://www.axios.com/2026/05/21/ai-news-cycle-openai-anthropic-spacex) Anthropic reported it is on track for $10.9 billion in Q2 revenue and a $559 million operating profit — its first profitable quarter, arriving two years ahead of internal projections. Separately, OpenAI announced one of its reasoning models independently solved a geometry problem that had remained open for 80 years.

## AI Tooling

- [Google Developers Blog](https://developers.googleblog.com/all-the-news-from-the-google-io-2026-developer-keynote/) Google Antigravity 2.0 shipped at I/O 2026 with multi-agent orchestration, a built-in Chromium browser, dynamic subagents, and scheduled background tasks. Gemini 3.5 Flash is the default model powering it from launch day.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/compromised-nx-console-18950-targeted.html) The Nx Console VS Code extension (nrwl.angular-console, 2.2M installs) was compromised on May 18: version 18.95.0 was live for roughly 11 minutes and deployed an obfuscated credential-stealer harvesting GitHub tokens, AWS keys, HashiCorp Vault secrets, Kubernetes credentials, 1Password data, and Claude Code configuration files. The attack originated from a stolen contributor token and is linked to a group called TeamPCP; approximately 3,800 repositories were exfiltrated. The malicious version has been pulled.

- [The Hacker News](https://thehackernews.com/2026/05/highly-critical-drupal-core-flaw.html) CVE-2026-9082 is a SQL injection flaw in Drupal Core's database abstraction API affecting sites backed by PostgreSQL, allowing anonymous users to achieve remote code execution, privilege escalation, or information disclosure. Drupal released patches on May 20; all sites running Drupal 8 or later on PostgreSQL should upgrade to at least 10.6 immediately.

## Local

- [CP24](https://www.cp24.com/) A Toronto council committee heard Tuesday that expanding the island airport would create severe traffic congestion in the downtown core, with transportation modelling showing gridlock effects extending to the Gardiner Expressway.

---

## Update — 22:01 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-05-21/anthropic-in-talks-to-use-microsoft-ai-chips-information-says) Anthropic is in early talks to rent Microsoft AI server chips, which would give it an additional source of compute to run Claude models beyond its existing AWS and SpaceX Colossus agreements.

- [TechCrunch](https://techcrunch.com/2026/05/21/trump-delays-ai-security-executive-order-i-dont-want-to-get-in-the-way-of-that-leading/) Trump postponed the signing of an AI executive order at the last minute on May 21, saying he pulled it because he did not want to impede US AI competitiveness. The order would have updated cybersecurity information-sharing programs to include AI companies and established voluntary government testing of frontier models; no new signing date was announced.

- [NVIDIA Newsroom](https://nvidianews.nvidia.com/news/meta-builds-ai-infrastructure-with-nvidia) NVIDIA and Meta announced a multiyear, multigenerational chip partnership valued at an estimated $35–67 billion, covering millions of Blackwell and Rubin GPUs, Grace CPUs, and Spectrum-X Ethernet switches for Meta's AI infrastructure across on-premises and cloud deployments.

- [NVIDIA Investor Relations](https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-First-Quarter-Fiscal-2027/default.aspx) NVIDIA posted record Q1 FY27 revenue of $81.6 billion, up 85% year over year, beating analyst estimates of $79.2 billion. Data Center revenue reached $75.2 billion, up 92% year over year. NVIDIA also announced an $80 billion share repurchase authorization and raised its quarterly dividend from $0.01 to $0.25 per share.

## Security

- [Help Net Security](https://www.helpnetsecurity.com/2026/05/21/microsoft-defender-vulnerabilities-cve-2026-41091-cve-2026-45498/) CISA added two actively exploited Microsoft Defender zero-days to its KEV catalog: CVE-2026-41091 (CVSS 7.8, local privilege escalation to SYSTEM via improper link resolution in the Malware Protection Engine) and CVE-2026-45498 (CVSS 4.0, denial-of-service disabling Defender). Both are patched in Defender Antimalware Platform versions 1.1.26040.8 and 4.18.26040.7; FCEB agencies must apply fixes by June 3.
