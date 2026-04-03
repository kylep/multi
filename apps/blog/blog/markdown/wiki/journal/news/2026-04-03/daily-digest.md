---
title: "Daily Digest: 2026-04-03"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-04-03
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-04-03
---

## AI Industry

- [SiliconAngle](https://siliconangle.com/2026/04/03/pitchbook-us-venture-funding-surges-record-267b-openai-anthropic-xai-dominate-ai-deals/) PitchBook's Q1 2026 Venture Monitor records $267.2B in US deal value — more than double the previous quarterly record. AI drove 89% of total deal value; the five largest deals (OpenAI $122B, Anthropic $30B, xAI $20B, Waymo $16B, Databricks $7B) accounted for 73% of all funding. Exit value hit $347B, largely on SpaceX's $250B acquisition of xAI.

## AI Tooling

- [Google AI](https://aitoolly.com/ai-news/article/2026-04-03-google-introduces-new-flex-and-priority-inference-options-to-balance-cost-and-reliability-in-gemini) Google added Flex and Priority inference tiers to the Gemini API. Priority allocates guaranteed resources for low-latency, mission-critical requests; Flex offers a cost-reduced path for workloads that can tolerate variable processing time.

- [Microsoft 365 Blog](https://blogs.imperial.ac.uk/office365/2026/03/20/copilot-chat-changes-april-2026/) Starting April 15, Microsoft Copilot Chat will no longer be available inside Word, Excel, PowerPoint, and OneNote — those apps shift to paid Copilot licenses. Copilot Chat continues in the M365 app and Outlook.

## Security

- [The Hacker News](https://thehackernews.com/2026/03/critical-telnetd-flaw-cve-2026-32746.html) CVE-2026-32746 (CVSS 9.8): critical buffer overflow in GNU InetUtils telnetd allows an unauthenticated remote attacker to execute code as root before any login prompt, by sending a crafted LINEMODE SLC suboption during the initial handshake. Affects all versions through 2.7; a patch was expected by April 1. Disable Telnet exposure or apply available vendor patches immediately.

## Geopolitics

- [NPR / Reuters](https://www.cnbc.com/2026/04/01/iran-demands-guaranteed-ceasefire-to-end-war-permanently-senior-source-says.html) Day 35 of US-Israeli strikes on Iran: Trump extended the pause on energy strikes but threatened bridges and power plants. Iran's Foreign Minister said Tehran is not seeking a ceasefire and "there is no negotiation"; Iran's economy is under severe strain, with the president warning of potential collapse within weeks without an agreement.

- [Marketplace](https://www.marketplace.org/story/2026/04/01/after-tariffs-global-trade-moves-on-without-us) On the one-year anniversary of Trump's "Liberation Day" tariff order, the administration extended auto-import and USMCA-compliant import exemptions indefinitely. Economists estimate the full consumer price impact will peak between April and October 2026 as the 12-18 month lag from original tariff implementation plays out.

## Local

- [CTV News Toronto](https://www.ctvnews.ca/toronto/) Canada Border Services Agency deployed its first dedicated fentanyl-detection canine unit in the Greater Toronto Area, targeting cross-border smuggling at mail and courier facilities.

## Weather

- Whitby: 22°C high, 3°C low. Showers likely throughout the day; Environment Canada issued a Special Weather Statement for heavy rain Saturday into Saturday night — total accumulation 25 to 50 mm with possible thunderstorms and higher localized amounts. No alerts for today.

## Just for You

- [Google AI](https://www.ghacks.net/2026/04/02/google-rolls-out-ai-inbox-in-gmail-for-250-per-month-to-gemini-advanced-ai-ultra-subscribers/) Google began rolling out AI Inbox for Gmail to AI Ultra subscribers ($250/month) in the US. The feature uses Gemini to surface priority emails, flag deadlines, and highlight frequent contacts directly in the inbox view.

---

## Update — 18:00 UTC

## AI Industry

- [Fortune](https://fortune.com/2026/03/27/anthropic-leaked-ai-mythos-cybersecurity-risk/) Anthropic's next model, internally called "Claude Mythos" (codenamed Capybara), was accidentally exposed via an unsecured CMS draft. Described as a "step-change in capabilities," it sits above the Opus line and is currently in early-access trials. Anthropic is privately warning government officials that Mythos can scan and exploit vulnerabilities faster than human defenders at a scale no prior model has reached.

- [Axios](https://www.axios.com/2026/04/03/anthropic-openai-ipo) Anthropic and OpenAI are racing to go public later this year, each projecting trillion-dollar valuations. Anthropic reportedly acquired Coefficient Bio for approximately $400 million; OpenAI separately paid "low hundreds of millions" for talk-show platform TBPN.

## Open Source

- [Google Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/) Google released Gemma 4 on April 2 — four open-weight models (E2B, E4B, 26B MoE, 31B Dense) built on the same research behind Gemini 3, under the Apache 2.0 license. The 31B ranks #3 on the Arena AI text leaderboard. All sizes support multimodal input; the edge sizes add native audio. Available on Ollama, Hugging Face, and Kaggle.

## Security

- [Help Net Security](https://www.helpnetsecurity.com/2026/04/03/cisco-imc-vulnerability-cve-2026-20093/) CVE-2026-20093: critical authentication bypass in Cisco Integrated Management Controller (IMC) lets an unauthenticated attacker send a crafted HTTP request to change any user's password, including Admin accounts. Affects Cisco UCS servers, branch virtualization platforms, APIC servers, and Secure Firewall Management Center appliances. No workarounds — apply the security update and restrict IMC interfaces from public networks immediately.
