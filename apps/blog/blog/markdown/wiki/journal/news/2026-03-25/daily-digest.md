---
title: "Daily Digest: 2026-03-25"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-03-25
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-03-25
---

## AI Industry

- [NPR](https://www.npr.org/2026/03/24/nx-s1-5759276/anthropic-pentagon-claude-preliminary-injunction-hearing) Judge Rita Lin held a preliminary injunction hearing on Anthropic's Pentagon lawsuit and is expected to rule within days on whether to temporarily block the government's 180-day phase-out order. She said the designation "looks like an attempt to cripple Anthropic" and expressed skepticism that the blacklisting was driven by legitimate security concerns rather than retaliation.

- [CNBC](https://www.cnbc.com/2026/03/24/openai-shutters-short-form-video-app-sora-as-company-reels-in-costs.html) OpenAI shut down Sora on March 24 after six months of operation and $2.1M in lifetime revenue. Disney withdrew a planned $1 billion investment before the deal closed, and video generation has been removed from ChatGPT entirely; compute is being redirected to text and coding workloads.

- [CNBC](https://www.cnbc.com/2026/03/24/gap-google-gemini-checkout-ai-platform.html) Gap became the first major fashion retailer to enable direct checkout inside Google's Gemini. Product details are fed by Gap directly rather than crawled, and purchases complete through Google Pay with Gap handling fulfillment.

## AI Tooling

- [Google Cloud Blog](https://cloud.google.com/blog/products/identity-security/bringing-dark-web-intelligence-into-the-ai-era) Google launched dark web monitoring via Gemini agents in public preview inside Google Threat Intelligence at RSAC 2026. The system processes up to 10 million dark web posts per day, builds an organizational profile automatically, and surfaces data leaks, initial access broker listings, and insider threat signals relevant to each customer.

## Open Source

- [GitHub](https://github.com/bytedance/deer-flow) ByteDance released DeerFlow 2.0 under MIT license, a superagent harness built on LangGraph that spawns sandboxed sub-agents for long-running tasks spanning research, code execution, and document generation. It supports any OpenAI-compatible API and MCP servers and reached 39,000 GitHub stars within days of release.

## Security

- [The Hacker News](https://thehackernews.com/2026/03/trivy-hack-spreads-infostealer-via.html) TeamPCP — the same actor behind the Trivy CVE-2026-33634 supply chain attack — pushed malicious litellm versions 1.82.7 and 1.82.8 to PyPI on March 24. The packages contained a credential harvester, a Kubernetes lateral movement toolkit, and a persistent backdoor. Both versions have been removed; anyone who pulled litellm between March 19 and 24 should rotate all CI/CD and cloud credentials.

## Geopolitics

- [CNN](https://www.cnn.com/world/live-news/iran-war-us-israel-trump-03-24-26) Iran denied Trump's claim of productive negotiations and called the postponed US ultimatum a retreat. A senior Iranian official told CBS that US proposals relayed via mediators are under review. The Strait of Hormuz remains closed entering its fourth week; the IEA said the closure has hit global energy markets more severely than the 1970s oil shocks.

## Local

- [CP24](https://www.cp24.com) Toronto police are deploying officers in tactical gear with patrol rifles at places of worship, tourist hubs, and community centres, citing an elevated threat environment following recent incidents at diplomatic and religious sites.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939) Whitby: 5°C high, mix of sun and cloud. 40% chance of showers overnight, low near 2°C. No alerts.

## Just for You

- [GitHub](https://github.com/bytedance/deer-flow) DeerFlow 2.0 natively supports MCP servers as tool endpoints for sub-agents, making it directly relevant to MCP server development and Claude ecosystem integrations.

- [The Hacker News](https://thehackernews.com/2026/03/trivy-hack-spreads-infostealer-via.html) The litellm supply chain attack embedded a Kubernetes lateral movement toolkit in the malicious packages — relevant to anyone running Trivy or litellm in k8s-based CI/CD pipelines.
