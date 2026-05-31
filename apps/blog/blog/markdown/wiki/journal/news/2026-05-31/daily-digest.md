---
title: "Daily Digest: 2026-05-31"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-31
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-31
---

## AI Industry

- [Anthropic](https://red.anthropic.com/2026/mythos-preview/) Claude Mythos Preview released via Project Glasswing to a limited group of critical industry partners and open-source developers. The model autonomously identified thousands of high and critical-severity vulnerabilities across major operating systems and browsers — including a 27-year-old OpenBSD flaw and a 16-year-old FFmpeg bug — and wrote multi-stage exploits (ROP chains, JIT heap sprays) that previously required weeks of expert work. Anthropic expects Mythos-level capabilities to become broadly available within 6–12 months.

- [CGTN / IISS](https://news.cgtn.com/news/2026-05-31/Shangri-La-Dialogue-2026-What-key-messages-has-China-sent--1NACM80opeU/p.html) The 23rd Shangri-La Dialogue concluded in Singapore today with 44 nations in attendance. Key outcomes: broad acceptance that countries must raise their own defense spending; China proposed a nuclear no-first-use treaty among nuclear-armed states; US Defense Secretary Hegseth's comments on reduced US security commitments drew significant attention.

- [Sources.news / Google](https://sources.news/p/google-about-to-release-new-gemini) Google DeepMind acquired more than 20 researchers from Contextual AI under an $80–$90M licensing deal, adding specialized talent to its research workforce.

## Security

- [Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2026/05/01/cve-2026-31431-copy-fail-vulnerability-enables-linux-root-privilege-escalation/) CVE-2026-31431 ("Copy Fail"), a CVSS 7.8 local privilege escalation in the Linux kernel's algif_aead crypto module, affects virtually all distributions shipping kernels from 2017 onward — including Ubuntu, Amazon Linux 2023, RHEL, and SUSE. A 732-byte proof-of-concept achieves root; in Kubernetes and multi-tenant cloud environments the flaw can enable container breakout and lateral movement. Patches available in upstream stable branches; interim mitigation is disabling the algif_aead module.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/05/31/takeways-from-the-2026-shangri-la-dialogue-.html) Shangri-La Dialogue wrapped with defense spending and China's Indo-Pacific posture as dominant themes. Covered above under AI Industry for fuller context.

- [Rio Times Online](https://www.riotimesonline.com/colombia-presidential-election-first-round-may-2026/) Colombia held the first round of its presidential election today, with 41.4 million eligible voters. Left-wing candidate Iván Cepeda led pre-election polling at 44.6%; center-right Abelardo de la Espriella at 31.6%. A runoff is scheduled for June 21 if no candidate clears 50%.

## Weather

- Whitby: 24°C high, 10°C low, sunny, north winds gusting to 40 km/h. UV index 8 (very high). No precipitation. No alerts.

## Just for You

- [Microsoft / PyPI](https://github.com/microsoft/markitdown) microsoft/markitdown, a Python tool for converting Office documents, PDFs, and other files to Markdown, entered the GitHub weekly trending top 8 at #7 with 6,652 stars this week (133,481 total). Relevant for Python tooling and blog/content pipeline readers.

---

## Update — 18:00 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-opus-4-8) Anthropic raised $65B in a Series H round at a $965B valuation, led by Altimeter Capital, Dragoneer, Greenoaks, and Sequoia. The company reports a $47B annual revenue run rate. Separately, Anthropic released Claude Opus 4.8 on May 28 — the model improves on agentic coding (64.3% to 69.2%) and multidisciplinary reasoning, and ships with user-controlled effort levels.

- [9to5Google](https://9to5google.com/2026/05/19/google-io-2026-news/) Google launched Gemini 3.5 Flash at Google I/O 2026 on May 19, now generally available at $1.50/$9.00 per million tokens — roughly 40% cheaper than Gemini 3.1 Pro. Google also cut the Ultra subscription from $250 to $200/month and added a new $100/month Developer tier. Gemini 3.5 Pro is slated for June.

## AI Tooling

- [Anthropic](https://www.anthropic.com/news/claude-opus-4-8) Claude Opus 4.8 ships a "dynamic workflows" feature in Claude Code that lets the tool break very large-scale engineering tasks into automatically structured sub-steps. Fast mode is now three times cheaper than in Opus 4.7.

- [GitHub Changelog](https://github.blog/changelog/) GitHub Copilot is switching from flat-rate to usage-based billing on June 1. Copilot Pro and Pro+ new sign-ups were paused ahead of the transition.

## Open Source

- [GitHub Blog](https://github.blog/changelog/2026-05-21-github-copilot-for-eclipse-is-open-source/) GitHub Copilot for Eclipse was open-sourced under the MIT license on May 21.

## Security

- [BleepingComputer](https://www.bleepingcomputer.com/news/security/hackers-exploit-forticlient-ems-flaw-to-push-infostealer-malware/) CVE-2026-35616 (CVSS 9.1) is a critical pre-authentication API bypass in FortiClient EMS affecting versions 7.4.5–7.4.6, confirmed exploited by CISA and Fortinet. Attackers are delivering the EKZ infostealer disguised as a legitimate Fortinet update via PowerShell, harvesting browser credentials from Chrome and Firefox.

- [CloudLinux Blog](https://blog.cloudlinux.com/dirty-frag-mitigation-and-kernel-update) "Dirty Frag" (CVE-2026-43284, CVE-2026-43500) is a second Linux kernel local privilege escalation disclosed by researcher Hyunwoo Kim, who also found Copy Fail. The flaw is in the ESP4/ESP6/rxrpc in-place decryption path; a public proof-of-concept grants root to any local user. Temporary mitigation is blacklisting the affected modules — do not apply on systems running IPsec tunnels.

## Priority Watchlist

- [Apache Kafka](https://kafka.apache.org/blog/releases/) Apache Kafka 4.3 released May 22. Separately, Strimzi Kafka Operator 1.0.0 ships with support for Kafka 4.1.2, HTTPS on the bridge, and in-place pod resizing for brokers and controllers — it now only supports v1 CRD APIs.

- [GitHub](https://github.com/argoproj/argo-cd/releases) ArgoCD v3.1 reached end of life on May 6. Users still on v3.1 should upgrade to v3.2, v3.3, or v3.4.

## Local

- [City of Toronto](https://www.toronto.ca/news/) Toronto held a ribbon-cutting ceremony on May 31 to mark the reopening of the Amsterdam Bridge, a steel cable footbridge originally gifted by the Mayor of Amsterdam in 1974. The bridge underwent full rehabilitation before returning to Harbourfront Centre.

- [CP24](https://www.cp24.com/politics/toronto-city-hall/2026/05/25/olivia-chow-confirms-she-is-running-for-second-term-as-toronto-mayor/) Toronto Mayor Olivia Chow announced on May 25 she is running for a second term. The 2026 Toronto mayoral election is scheduled for October 26.

## Just for You

- [Help Net Security](https://www.helpnetsecurity.com/2026/05/29/forticlient-ems-vulnerability-infostealer/) CVE-2026-27771 (CVSS 8.2) in Gitea allows unauthenticated remote users to pull private container images without credentials, affecting all versions prior to 1.26.2 and estimated to impact more than 30,000 deployments across 30+ countries. The flaw went undetected for close to four years. Relevant for Docker/container security.

---

## Update — 22:00 UTC

## AI Industry

- [Build Fast with AI](https://www.buildfastwithai.com/blogs/ai-news-today-may-31-2026) Microsoft will unveil a suite of in-house AI models at Build 2026 (June 2–3, San Francisco), including a coding-focused model to strengthen GitHub Copilot and additional models for transcription, reasoning, speech, and images. Reuters and The Information reported the move is a direct response to Anthropic's Claude Code overtaking Copilot in enterprise developer adoption and reduces Microsoft's dependence on OpenAI.

## Geopolitics

- [CBS News](https://www.cbsnews.com/live-updates/iran-war-us-trump-vance-ceasefire-strait-of-hormuz-deal-close/) The US and Iran are in active talks on a memorandum of understanding that would extend their ceasefire by 60 days, reopen shipping through the Strait of Hormuz, end the US blockade of Iranian ports, and launch nuclear negotiations. The strait has been largely closed since February 28 when the US and Israel began air operations against Iran, cutting roughly 25% of global seaborne oil trade. A CNBC analysis published May 30 notes tanker traffic through the strait may recover to only 60–70% of pre-war levels even if a deal is reached.

## Priority Watchlist

- [InfoQ](https://www.infoq.com/news/2026/05/cloudflare-workflows-v2-release/) Cloudflare Workflows V2 ships with deterministic replayable execution, improved observability, and support for 50,000 concurrent workflow instances and 2 million queued workflows — a significant scaling upgrade for the Workers platform.
