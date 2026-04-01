---
title: "Daily Digest: 2026-04-01"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-04-01
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-04-01
---

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-03-31/openai-valued-at-852-billion-after-completing-122-billion-round) OpenAI closed a $122 billion funding round at an $852 billion valuation. Amazon contributed $50 billion contingent on an IPO or AGI milestone; SoftBank, Nvidia, and a16z co-led the round alongside over a dozen institutional investors. The company raised an additional $3 billion from individual investors — a first.

- [Google DeepMind Blog](https://deepmind.google/blog/accelerating-mathematical-and-scientific-discovery-with-gemini-deep-think/) Google launched a major upgrade to Gemini 3 Deep Think, scoring 48.4% on Humanity's Last Exam and 84.6% on ARC-AGI-2. The upgraded model is live for Google AI Ultra subscribers and available via the Gemini API in early access for researchers and enterprises.

- [CNN Business](https://www.cnn.com/2026/03/26/business/anthropic-pentagon-injunction-supply-chain-risk) U.S. District Judge Rita Lin indefinitely blocked the Pentagon from enforcing its supply chain risk designation against Anthropic, ruling the designation was arbitrary, capricious, and violated Anthropic's constitutional rights. The ruling, issued March 26, prevents defense contractors from being required to certify non-use of Anthropic products pending further proceedings.

## Security

- [Security Online](https://securityonline.info/vim-rce-vulnerability-cve-2026-34982-modeline-bypass/) CVE-2026-34982 (CVSS 8.2): high-severity RCE in Vim via a modeline sandbox bypass — an attacker can execute arbitrary commands when a user opens a crafted text file. Update to the latest Vim release.

- [Broadcom Advisory](https://www.vmware.com/security/advisories/) CVE-2026-22719: unauthenticated command injection in VMware Aria Operations allows remote code execution. Broadcom has confirmed exploitation in the wild. Apply the vendor patch immediately.

- [Google Chrome Releases](https://chromereleases.googleblog.com/) CVE-2026-5281: emergency patch issued for an actively exploited zero-day in Chrome's Dawn component (WebGPU). Distinct from the V8 CVE patched last week. Update Chrome, Edge, and Opera immediately.

## Geopolitics

- [CNN](https://www.cnn.com/2026/04/01/world/live-news/iran-war-us-trump-oil) Day 33: Trump said the war could end in two to three weeks without requiring a formal deal; Iran's Foreign Minister Araghchi said Iran is prepared for at least six months and has zero trust in Washington. A missile launched from Iran struck an oil tanker off Qatar's coast. Asian equity markets rallied 4–6% on the ceasefire signals.

- [Al Jazeera](https://www.aljazeera.com/news/2026/4/1/iran-war-what-is-happening-on-day-33-of-us-israel-attacks) U.S.-Israeli strikes hit pharmaceutical and steel facilities in Isfahan and Tehran on April 1. Pope Leo XIV publicly called for an immediate halt to hostilities — a rare direct appeal to national leaders. Argentina formally designated Iran's IRGC a terrorist organization.

## Local

- [Durham Region Health](https://www.durham.ca/Modules/News/en) Lakeridge Health received a $12 million provincial grant to advance a healthcare masterplan for Durham Region covering several facility projects.

- [CBC News](https://www.cbc.ca/news/canada/toronto/whitby-town-hall-incident-security-measures-9.7141804) Whitby Mayor Elizabeth Roy said she will review security at council chambers after Durham police investigated an incident in which a Rebel News employee approached a councillor at Whitby Town Hall after a late evening council meeting. Councillor Victoria Bozinkovski described the interaction as threatening and harassment; the individual denied the allegation.

## Weather

- Whitby: 6°C high, 0°C overnight. Cloudy with NW winds gusting to 40 km/h shifting NE this afternoon. No precipitation expected. No alerts. UV index 4 (moderate).

## Just for You

- [GitHub Blog](https://github.blog/open-source/maintainers/from-mcp-to-multi-agents-the-top-10-open-source-ai-projects-on-github-right-now-and-why-they-matter/) n8n is cited among the top open-source AI projects gaining traction in early 2026 for its self-hosted, fair-code workflow automation with native AI and 400+ integrations. Trending alongside agent frameworks as teams build internal automation pipelines.

---

## Update — 16:30 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-04-01/openai-demand-sinks-on-secondary-market-as-anthropic-runs-hot) OpenAI secondary market shares have stalled — roughly $600 million in sell orders placed with Next Round Capital found no buyers. Competing marketplaces report record demand for Anthropic shares. Epoch AI projects Anthropic will surpass OpenAI in annualized revenue by mid-2026; Claude Code alone is credited with $2.5 billion in annualized revenue and 4% of all public GitHub commits.

- [Investing.com / The Information](https://www.investing.com/news/stock-market-news/anthropic-considers-ipo-as-soon-as-q4-2026-the-information-4584016) Anthropic is targeting an IPO as early as October 2026, with bankers projecting a raise exceeding $60 billion. The company's annualized revenue has roughly doubled since early March to around $20 billion.

## AI Tooling

- [Claude Code Changelog](https://code.claude.com/docs/en/changelog) Claude Code v2.1.88 adds a `defer` decision to PreToolUse hooks so headless sessions can pause at a tool call and resume with `--resume` for re-evaluation. A new `PermissionDenied` hook fires after auto mode classifier denials, allowing `{retry: true}` to signal the model to retry. Named subagents now appear in `@`-mention typeahead suggestions.

- [Anthropic Platform Docs](https://platform.claude.com/docs/en/release-notes/overview) Anthropic API updates: sandboxed code execution is now free when paired with web search or web fetch; max_tokens cap raised to 300k on the Message Batches API for Opus 4.6 and Sonnet 4.6; data residency controls added via an `inference_geo` parameter for US-only inference. Claude Haiku 3 is deprecated with retirement on April 19.

- [Google Blog](https://www.vanguardngr.com/2026/04/google-expands-search-live-globally-introduces-new-ai-voice-model/) Google expanded Search Live to more than 200 countries and territories, powered by Gemini 3.1 Flash Live — a new multilingual voice and audio model. Developers can access Gemini Live API in AI Studio preview; enterprises can use it through Gemini Enterprise for Customer Experience.

## Security

- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) CVE-2026-21385: an Android component vulnerability is under limited, targeted exploitation and has been added to CISA's Known Exploited Vulnerabilities catalog. Apply Google's March 2026 Android Security Bulletin patches.

- [Microsoft Security](https://msrc.microsoft.com/update-guide/) CVE-2026-20963: deserialization of untrusted data in SharePoint Server allows an unauthenticated remote attacker to execute code over a network. Apply vendor patches or discontinue exposure.

## Geopolitics

- [CBC News](https://www.cbc.ca/news/canada/calgary/alberta-ottawa-mou-missed-deadlines-9.7149141) Canada and Alberta missed the April 1 deadline on two of four commitments in their energy MOU — carbon pricing equivalency and the trilateral agreement with Oil Sands Alliance companies. Both Carney and Smith confirmed the miss publicly; Smith said she hopes the carbon price deal is done within days and the Alliance agreement before the end of April.

## Local

- [UrbanToronto](https://urbantoronto.ca/news/2026/04/news-roundup-april-1-2026.60694) Ontario's minimum wage is set to increase to $17.95 per hour on October 1, 2026. An adviser also publicly warned the province to look more closely at Therme's finances before signing a lease for the Ontario Place redevelopment site.

---

## Update — 20:00 UTC

## AI Industry

- [TechCrunch / Bloomberg](https://techcrunch.com/2026/03/31/anthropic-is-having-a-month/) Yann LeCun's new startup Advanced Machine Intelligence (AMI) Labs closed a $1.03 billion seed round at a $3.5 billion valuation — the largest seed round in European history. The Paris-based firm is building "world models" for robotics, healthcare, and manufacturing, backed by NVIDIA, Bezos Expeditions, and Temasek.

## Open Source

- [GitHub](https://github.com/explore) oh-my-opencode, a TypeScript multi-agent orchestration layer for Claude Code, updated April 1 and crossed 29k stars. It adds team-oriented coordination on top of Claude Code sessions, extending the Claude agent harness for multi-user workflows.

## Security

- [TheHackerWire](https://www.thehackerwire.com/vulnerability/CVE-2026-34875/) CVE-2026-34875 (Critical): buffer overflow in Mbed TLS through 3.6.5 and TF-PSA-Crypto 1.0.0 via a flaw in FFDH public key export. Upgrade Mbed TLS to 3.6.6 or TF-PSA-Crypto to 1.1.0.

## Geopolitics

- [CNN](https://www.cnn.com/2026/04/01/world/live-news/iran-war-us-trump-oil) Trump will address the nation tonight at 9 PM ET on the Iran war. Iran denied requesting a ceasefire and its IRGC said the Strait of Hormuz is "fully" under its control, directly contradicting Trump's earlier statement. A drone struck Kuwait International Airport's fuel depot, causing a large blaze with no reported injuries.

- [The Federal](https://thefederal.com/category/international/april-1-news-live-updates-iran-war-and-more-237035) UK Prime Minister Starmer announced Britain will lead diplomatic talks on reopening the Strait of Hormuz. Starmer reaffirmed NATO commitment and pushed back against Trump, who again floated US withdrawal from the alliance.

## Weather

- Whitby: Evening forecast revised sharply — showers with a risk of thunderstorm, 10–15 mm of rain expected, possible hail and damaging winds. SW winds 20 km/h becoming light overnight. Low +5°C. Earlier forecast had shown no precipitation.
