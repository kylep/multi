---
title: "Daily Digest: 2026-03-31"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-03-31
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-03-31
---

## AI Industry

- [Axios](https://www.axios.com/2026/03/31/microsoft-critique-anthropic-openai) Microsoft revamped a Copilot research tool to use both OpenAI and Anthropic models in a layered pipeline: OpenAI generates the initial answer, then Claude reviews it before the response reaches the user. The multi-model approach scored 13.8% higher on the DRACO deep research benchmark.

## Geopolitics

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-03-30/latest-oil-market-news-and-analysis-for-march-31) Iran struck a fully-laden Kuwaiti tanker, the Al-Salmi, in Dubai's anchorage area on March 31 — the latest in a series of Gulf ship attacks since the war began. WTI crude rose nearly 4% before settling near $104/barrel after Trump said the US is willing to end military operations even if the Strait of Hormuz remains closed.
- [Time](https://time.com/article/2026/03/31/gas-prices-us-iran-war/) The US national average retail gas price crossed $4 per gallon on March 31 for the first time since Russia's Ukraine invasion in 2022. California is averaging $5.87/gallon.

## Weather

- Whitby: 14°C high, 5°C low. 60% chance of showers with local amounts of 15–25 mm. No alerts. [(Environment Canada)](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939)

## Just for You

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-03-26/google-gemini-adds-tool-to-make-it-easier-to-switch-from-chatgpt) Google added a chat history import tool to Gemini, letting users upload conversation archives from ChatGPT and Claude to give Gemini context without re-entering it manually. Available for all free and paid Gemini users.

---

## Update — 16:02 UTC

## AI Industry

- [Fortune](https://fortune.com/2026/03/26/anthropic-says-testing-mythos-powerful-new-ai-model-after-data-leak-reveals-its-existence-step-change-in-capabilities/) An unsecured Anthropic content management system exposed approximately 3,000 unpublished assets including draft blog posts that named a new model, Claude Mythos (internally also called Capybara). Anthropic confirmed active testing with early-access customers. Internal materials describe it as the company's most capable model to date, with notable advances in coding, reasoning, and cybersecurity — and flag that it is "far ahead of any other AI model in cyber capabilities."

## Security

- [CISA](https://www.cisa.gov/news-events/directives/ed-26-03) CVE-2026-20127 (CVSS 10.0): authentication bypass in Cisco Catalyst SD-WAN Controller and Manager lets an unauthenticated remote attacker log in as a high-privileged user and alter SD-WAN fabric configuration. CISA issued Emergency Directive 26-03 and SecurityWeek confirmed widespread exploitation from numerous IPs, including webshell deployment. Patch or segment immediately.

- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) CVE-2026-3909: out-of-bounds read in Chromium V8 engine allows a remote attacker to execute arbitrary code inside the browser sandbox via a crafted HTML page. Affects Google Chrome, Microsoft Edge, and Opera. Update browsers to the latest channel release.

## Geopolitics

- [Al Jazeera](https://www.aljazeera.com/news/2026/3/31/iran-war-what-is-happening-on-day-32-of-us-israel-attacks) Day 32: US-Israeli overnight strikes hit Tehran and Isfahan, knocking out power to Tehran before restoration; Iran maintained nine ballistic missile attack waves toward Israel and Saudi Arabia over the past 24 hours. NATO air defense systems intercepted an Iranian ballistic missile that entered Turkish airspace — the fourth such incident since the war began.

- [CNN](https://www.cnn.com/2026/03/31/world/live-news/iran-war-us-trump-oil) Spain's defense minister stated Spain will not permit its military bases or airspace to be used for any activity related to the US-Israel war on Iran, joining Germany and France in publicly opposing the operations.

## Local

- [CTV News Toronto](https://www.ctvnews.ca/toronto/) Ontario Premier Ford and Toronto Mayor Olivia Chow announced federal and provincial co-funding for a $3-billion waterfront transit line that Chow describes as the "missing piece" of Toronto's transit network. Construction timeline and route details to follow.

## Just for You

- [GitHub / Microsoft](https://microsoft.github.io/VibeVoice) Microsoft released VibeVoice as an open-source speech AI project on March 31. The library provides high-fidelity voice synthesis and real-time translation tools targeting accessibility apps, voice interfaces, and interactive entertainment. Trending on GitHub as of today.

---

## Update — 20:00 UTC

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/03/29/why-openai-really-shut-down-sora/) OpenAI shut down the Sora video generation app on March 24 after it burned roughly $1 million per day while active users fell from 3.3 million at launch to under 500,000. The API stays up until September 24. Disney, which had committed $1 billion to a Sora collaboration, learned of the shutdown less than an hour before the announcement; the deal collapsed. Freed compute is being redirected to Codex and core ChatGPT.

- [Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/stock-market-today-march-31-211709577.html) NVIDIA announced a $2 billion equity investment in Marvell Technology on March 31 and an expanded AI infrastructure partnership. Marvell's data center connectivity products will integrate with NVIDIA's NVLink Fusion rack-scale platform.

## AI Tooling

- [The Register](https://www.theregister.com/2026/03/31/anthropic_claude_code_source_code/) Version 2.1.88 of the `@anthropic-ai/claude-code` npm package inadvertently included a 59.8 MB source map file that pointed to a publicly accessible zip archive containing the full ~512,000-line TypeScript codebase for Claude Code. Anthropic confirmed the release was a packaging error and that no customer data was exposed, and is rolling out changes to prevent recurrence. The leaked code was mirrored and forked more than 41,000 times before removal. Anthropic recommends pinning to version 2.1.86 and using the native installer. The leak revealed an unreleased autonomous background-agent mode called KAIROS, 44 hidden feature flags, and internal model codenames including Fennec (Opus 4.6) and Numbat.

## Security

- [VentureBeat](https://venturebeat.com/technology/claude-codes-source-code-appears-to-have-leaked-heres-what-we-know/) Concurrent with the Claude Code source map leak, malicious versions of the axios npm package (1.14.1 and 0.30.4) containing a Remote Access Trojan were briefly available as a Claude Code dependency between 00:21 and 03:29 UTC on March 31. Any machine where Claude Code was installed via npm in that window — identifiable by the presence of axios 1.14.1/0.30.4 or the package `plain-crypto-js` — should be treated as fully compromised: rotate all credentials and reinstall from a clean system.

## Geopolitics

- [CNN](https://www.cnn.com/2026/03/31/world/live-news/iran-war-us-trump-oil) Iranian President Pezeshkian stated Iran is ready to halt fighting if it receives guarantees against further attacks. Trump separately told associates he is prepared to end the war even if the Strait of Hormuz stays largely closed, and Secretary of State Rubio said the conflict will end "within weeks, not months." Brent crude fell roughly 2.7% to $104.50 on the ceasefire signals.

## Local

- [CTV News Toronto](https://www.ctvnews.ca/toronto/article/wb-hwy-401-closed-in-whitby-after-collision-causes-transport-trucks-diesel-tank-to-rupture/) A transport truck collision ruptured a diesel tank on westbound Highway 401 in Whitby on March 31, closing westbound lanes at Brock Street. The right lane has partially reopened; OPP says cleanup will take four to six hours.

- [Durham Region Health](https://www.durham.ca/Modules/News/en) Durham Region Health confirmed a fourth measles case linked to an existing exposure cluster, bringing the local total to four. The department is contacting identifiable contacts of each case.

- [CTV News Toronto](https://www.ctvnews.ca/toronto/) Two people were pronounced dead in hospital after a house fire in North York on March 31, according to Toronto Fire Chief Jim Jessop.
