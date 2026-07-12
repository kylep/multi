---
title: "Daily Digest: 2026-07-12"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-12
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-12
---

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-corps) Anthropic launched Claude Corps, a $150M paid fellowship placing 1,000 early-career professionals at US nonprofits for 12 months at $85,000 each. Applications for the October 2026 cohort close July 17.

- [AI Weekly](https://aiweekly.co/alerts/openai-files-confidential-ipo-with-goldman-morgan-stanley) OpenAI filed a confidential S-1 with the SEC on May 22, targeting a Q4 2026 listing at $850B–$1T with Goldman Sachs and Morgan Stanley leading. Reuters reported in late June the company is weighing a delay to 2027, citing a ~$9B net loss on $13.1B in 2025 revenue.

- [BigGo Finance](https://finance.biggo.com/news/6f0c6bb2-795f-4c57-9d09-6db691d7638a) Gemini 3.5 Pro is confirmed for general availability July 17. Built on a new pretraining run rather than adapted from 2.5 Pro, the model ships a 2M-token context window; Deep Think extended reasoning is gated behind the $250/month Ultra subscription.

## AI Tooling

- [GitHub Changelog](https://github.blog/changelog/) GitHub Copilot's vision capabilities moved from beta to general availability as of July 4, allowing images and screenshots to be referenced directly in Copilot Chat and inline coding suggestions.

## Security

- [Bleeping Computer](https://www.bleepingcomputer.com/news/security/ubiquiti-warns-of-new-max-severity-unifi-os-vulnerability/) Ubiquiti patched CVE-2026-50746 (CVSS 10.0) in UniFi Connect — unauthenticated command injection exploitable over the network with no user interaction required. Six additional critical CVEs cover UniFi Talk, Access, Protect, and OS Server. Censys tracks over 100,000 UniFi OS instances exposed to the internet; update to Connect 3.4.20 or later.

## Local

- [CTV News](https://www.ctvnews.ca/toronto/local/durham/article/second-toddler-attacked-by-coyote-in-whitby-left-with-serious-injuries/) A second toddler was bitten in the face by a coyote in Whitby on July 6, the second unprovoked attack within two weeks. Durham Regional Police issued a public warning and advise keeping children under direct supervision outdoors.

## Weather

- Whitby: 29°C high, 15°C low, sunny throughout the day with clear skies overnight. No alerts.

## Just for You

- [Cloudflare Changelog](https://developers.cloudflare.com/changelog/post/2026-07-07-wrangler-deploy-upload-dependencies-metadata/) Cloudflare Wrangler now collects npm dependency metadata (name, declared version range, exact installed version) during `wrangler deploy`, enabling future supply chain vulnerability alerting for Workers. Opt out via `dependencies_instrumentation.enabled = false` in wrangler config.

- [GitHub](https://github.com/bradautomates/claude-video) bradautomates/claude-video enters the weekly top 8 (4,399 new stars, 7,672 total) — a Claude Code skill that downloads any video, extracts frames, transcribes audio, and passes all of it to Claude via a `/watch` command.

---

## Update — 18:00 UTC

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/07/10/apple-sues-openai-over-alleged-trade-secret-theft/) Apple filed suit against OpenAI on July 10 in Northern District of California, alleging trade secret theft. The complaint names OpenAI hardware chief Tang Tan, a former Apple VP, who is accused of directing job candidates to bring physical Apple device components to interviews as "show and tell." Apple also alleges OpenAI coached departing employees on evading exit security procedures.

- [TechCrunch](https://techcrunch.com/2026/07/09/openai-launches-its-new-family-of-models-with-gpt-5-6/) OpenAI released GPT-5.6 on July 9 after a government safety review by the Department of Commerce cleared a wider rollout. The model ships as a three-variant family: Luna (speed), Terra (balanced), and Sol (most capable, 54% more token-efficient on coding tasks than previous versions).

## AI Tooling

- [Anthropic](https://www.anthropic.com/news/claude-sonnet-5) Claude Sonnet 5 launched June 30 and became the default model for all Free and Pro users on July 1, replacing Sonnet 4.6. The model ships with a 1M-token context window and near-Opus performance at introductory pricing of $2/$10 per million input/output tokens through August 31.

- [Cursor](https://www.havoptic.com/tools/cursor) Cursor v3.11 ships side chats and conversation search, allowing users to run parallel conversations and locate past exchanges by keyword.

## Security

- [The Hacker News](https://thehackernews.com/2026/06/attackers-exploit-simplehelp-cve-2026.html) CVE-2026-48558 (CVSS 10.0) in SimpleHelp RMM allows unauthenticated attackers to forge OIDC tokens, create admin-privileged technician accounts, and bypass MFA. CISA added it to the Known Exploited Vulnerabilities catalog June 29; attackers are actively deploying Djinn Stealer through compromised instances. Approximately 14,000 SimpleHelp servers are exposed to the internet. Upgrade to 5.5.16 or 6.0 RC2.

## Geopolitics

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-07-08/us-military-launches-strikes-on-iran-for-second-straight-day) A mid-June US-Iran memorandum of understanding has effectively collapsed. The US struck more than 80 targets in Iran on July 7–8 following Iranian attacks on commercial vessels in the Strait of Hormuz; Iran launched missiles and drones at 85 US military sites in Bahrain and Kuwait in response. President Trump told reporters at the NATO summit in Ankara the MoU is "over" and reimposed oil sanctions.

- [CNN](https://www.cnn.com/2026/07/06/china/china-tests-submarine-launched-ballistic-missile-intl-hnk-ml) China conducted its first-ever submarine-launched ballistic missile test into international Pacific waters on July 6, drawing condemnation from the US, Japan, Australia, and New Zealand. The People's Liberation Army Navy launched the missile from a nuclear-powered submarine and released a statement calling the test routine and legal under international practice.

## Just for You

- [Kubernetes Blog](https://kubernetes.io/blog/) etcd v3.7.0 released July 8 — the first minor release of the distributed key-value store that underpins Kubernetes. Key addition is RangeStream, which allows clients to stream large range query results instead of receiving them as a single in-memory payload.

---

## Update — 20:00 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/redeploying-fable-5) Anthropic restored Claude Fable 5 access on July 1 after a 19-day suspension triggered by a June 12 export control directive that gave the company no reliable way to verify user nationality in real time. The reinstatement followed a narrowed Commerce Department directive and the deployment of a new safety classifier — developed in coordination with Amazon, Microsoft, and Google — that blocks the reported jailbreak technique in more than 99% of cases.

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-07-09/meta-starts-charging-for-ai-with-muse-spark-1-1-agentic-model) Meta released Muse Spark 1.1 on July 9, its first paid AI model API. The agentic, multimodal reasoning model carries a 1M-token context window and is priced at $1.25 per million input tokens and $4.25 per million output tokens, with $20 in free credits. This marks the first time Meta has charged businesses for model access.

## AI Tooling

- [OpenAI](https://openai.com/index/how-agents-are-transforming-work/) OpenAI launched ChatGPT Work on July 9, an agentic product that merges Codex into the ChatGPT desktop app under a unified Chat, Work, and Codex interface available on all plans including Free. Work takes a high-level goal, gathers context across connected apps, and executes multi-step tasks over hours. The Atlas browser is deprecated as of July 9 and stops working August 9.

- [VS Code](https://code.visualstudio.com/updates/v1_128) VS Code 1.128 shipped July 8 with multi-chat Claude agent sessions — several related conversations can run in parallel within one session to compare approaches or branch from earlier turns. Copilot Vision (images and PDFs in chat) reached general availability in the same release.

## Geopolitics

- [Euronews](https://www.euronews.com/video/2026/07/12/latest-news-bulletin-july-12th-2026-morning) The US-Iran conflict has escalated further since the July 7–8 strikes: CENTCOM struck more than 90 targets in a second night of operations, Iran subsequently hit military targets in Kuwait, Bahrain, and Qatar, and the US launched a third round of strikes in response. The conflict has now spread beyond the Strait of Hormuz to US installations across the Gulf.

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-07-07/le-pen-faces-french-court-verdict-on-presidential-run-ban) A French appeals court on July 7 cleared Marine Le Pen to run in the April 2027 presidential election after reducing her ineligibility ban from 60 to 45 months (30 suspended). The court upheld her embezzlement conviction and added an ankle bracelet condition for a one-year sentence.

## Local

- [todocanada.ca](https://www.todocanada.ca/things-to-do-in-toronto-this-weekend/) Whitby Ribfest returned this weekend (July 10–12) with more than 50,000 expected attendees, live entertainment, and multiple competitive rib vendors at Iroquois Park.

## Just for You

- [Windows Forum](https://windowsforum.com/threads/dataverse-expands-coding-agent-plugin-to-claude-cursor-and-copilot-with-mcp-governance.435235/) Microsoft Dataverse expanded its coding-agent plugin to Claude, Cursor, and GitHub Copilot on July 6, adding MCP certification, governance controls, and broader MCP support across the Microsoft AI stack.
