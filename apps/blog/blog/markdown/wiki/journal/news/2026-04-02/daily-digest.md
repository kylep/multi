---
title: "Daily Digest: 2026-04-02"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-04-02
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-04-02
---

## AI Industry

- [Axios](https://www.axios.com/2026/04/02/anthropic-usage-limits-openai) Anthropic confirmed it has been tightening Claude usage limits during peak hours (5am–11am PT weekdays), affecting roughly 7% of Pro users. Server capacity is not keeping pace with demand; OpenAI responded by doubling its own limits. SemiAnalysis analyst Dylan Patel warned Anthropic may be forced toward lower-quality compute as OpenAI locks up premium supply.

- [PitchBook via multiple outlets](https://www.implicator.ai/openai-shares-cant-find-buyers-as-2-billion-floods-into-anthropic-instead/) OpenAI's enterprise API market share fell from 50% to 25%, while Anthropic's rose from 12% to 32% over the same period, according to PitchBook. Among first-time enterprise AI buyers, Anthropic's selection rate is triple OpenAI's.

## AI Tooling

- [DevClass / The Register](https://www.devclass.com/ai-ml/2026/04/01/anthropic-admits-claude-code-users-hitting-usage-limits-way-faster-than-expected/5213575) Anthropic confirmed two bugs in Claude Code that break prompt caching and silently inflate token usage by an estimated 10–20x, causing Max plan subscribers to hit limits in under 20 minutes. Fixes were shipped but the investigation is ongoing.

- [Cloudflare Blog](https://blog.cloudflare.com/) Cloudflare announced Dynamic Workers, which execute AI-generated code in secure, lightweight isolates claiming 100x faster startup than traditional containers. The feature targets AI agent sandboxing use cases and is available on Cloudflare Workers.

## Open Source

- [24-7 Press Release / GitHub](https://www.24-7pressrelease.com/press-release/533389/claw-code-launches-open-source-ai-coding-agent-framework-with-72000-github-stars-in-first-days) Claw Code launched publicly on April 2 as an open-source AI coding agent framework built in Python and Rust. Described as a clean-room rewrite with no proprietary code or third-party model weights, it accumulated over 72,000 GitHub stars within days of release.

- [Strimzi / GitHub](https://github.com/strimzi/strimzi-kafka-operator) Strimzi Kafka Operator 0.50 released, updating the Kubernetes operator for running Apache Kafka to use Java 21 as both the runtime and language level.

## Security

- [PyPI / DevOps.com](https://devops.com/claude-code-quota-limits-usage-problems/) Malicious versions of the litellm Python package (1.82.7 and 1.82.8) were published to PyPI on March 24, 2026, containing a credential harvester, a Kubernetes lateral movement toolkit, and a persistent backdoor. Both versions have been removed. Any environment that installed litellm in that window should be treated as compromised.

- [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) CVE-2026-33017: code injection vulnerability in Langflow allows unauthenticated users to build and execute public flows. Added to the CISA Known Exploited Vulnerabilities catalog; patch or isolate Langflow instances immediately.

## Geopolitics

- [CBS News](https://www.cbsnews.com/live-updates/iran-war-trump-israel-tehran-denies-ceasefire-talks-strait-of-hormuz/) Day 34 of the US-Israel war with Iran: Trump extended the pause on striking Iranian energy infrastructure to April 6 and said US envoy Steve Witkoff had presented Iran with a 15-point peace proposal. Iran's Foreign Ministry called Trump's claim that Iran's president requested a ceasefire "false and baseless." The UAE reported intercepting a total of 438 ballistic missiles, 19 cruise missiles, and 2,012 drones since hostilities began. The USS George H.W. Bush carrier strike group and 82nd Airborne units began deploying to the region.

- [Reuters / CBS News](https://www.cbsnews.com/live-updates/iran-war-trump-nato-tehran-threatens-us-tech-companies-strait-of-hormuz/) Secretary of State Rubio departed for G7 Foreign Ministers talks in France, criticizing NATO for not joining efforts to reopen the Strait of Hormuz. UK PM Starmer said 35 countries have signed a statement on restoring maritime security; UK Foreign Secretary Cooper will lead a dedicated conference.

## Local

- [Town of Whitby](https://www.whitby.ca/newsroom/) Whitby Mayor Roy issued a statement on Ontario's 2026 Budget, criticizing the province for not funding Whitby's key infrastructure priorities. The Town also marked Canada's First AI Literacy Day, highlighting how the municipality is using AI to improve local services.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939) Whitby: 8°C high, 6°C low. Cloudy with a 60% chance of showers through the day and overnight. Possible thunderstorm activity in the afternoon with risk of hail and damaging winds. No weather alerts in effect.

## Just for You

- [Cloudflare Blog](https://blog.cloudflare.com/) Cloudflare opened a public beta for its Web and API Vulnerability Scanner (DAST tool) as part of the API Shield platform, allowing users to scan web properties and APIs for vulnerabilities directly from the Cloudflare dashboard.

- [AWS / InfoQ](https://www.infoq.com/news/) Amazon MSK Express clusters created with Kafka v3.9 now automatically use KRaft for metadata management, removing the ZooKeeper dependency. Existing clusters can be upgraded in a future release. Apache Kafka releases 4.2.0, 4.1.2, 4.0.2, and 3.9.2 are currently in progress.
