---
title: "Daily Digest: 2026-03-29"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-03-29
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-03-29
---

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/03/24/openais-sora-was-the-creepiest-app-on-your-phone-now-its-shutting-down/) OpenAI is shutting down Sora in two stages: the app closes April 26 and the API follows September 24. The team is being redirected to world simulation research for robotics; Disney ended a planned $1B investment deal following the announcement.

- [Shopify](https://www.shopify.com/news/agentic-commerce-momentum) Shopify Agentic Storefronts went live for all eligible US merchants March 24, making 5.6M stores discoverable and purchasable by default inside ChatGPT, Google AI Mode, Gemini, and Microsoft Copilot. A new Agentic plan extends the feature to brands on non-Shopify platforms.

## Open Source

- [NVIDIA Newsroom](https://nvidianews.nvidia.com/news/nvidia-debuts-nemotron-3-family-of-open-models) NVIDIA released Nemotron 3 Super, a 120B-parameter open-weight hybrid MoE model with a 1M token context window built for agentic workloads. Training datasets and reinforcement learning environments are fully open; the model is available on Hugging Face, OpenRouter, and build.nvidia.com.

- [GitHub](https://github.com/666ghj/MiroFish) MiroFish crossed 28k GitHub stars and reached the top of GitHub Global Trending. A Chinese undergraduate student built the AI swarm prediction engine in ten days; it spawns thousands of agents inside a GraphRAG knowledge graph to simulate and forecast social and market dynamics.

## Security

- [Penligent](https://www.penligent.ai/hackinglabs/cve-2026-the-vulnerabilities-that-matter-most-right-now) CVE-2026-3055 (CVSS 9.3): memory overread in Citrix NetScaler ADC and Gateway when configured as a SAML Identity Provider. Active fingerprinting probes targeting the `/cgi/GetAuthMethods` endpoint have been observed in honeypots. Restrict SAML IDP exposure and monitor for Citrix patches.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939) Whitby: 4°C high, -1°C overnight low. Sunny through the day with cloudy periods after dark. No alerts.

## Just for You

- [Cloudflare Blog](https://blog.cloudflare.com/ai-security-for-apps-ga/) Cloudflare AI Security for Apps reached general availability March 11. The reverse-proxy layer auto-discovers LLM-powered endpoints, detects prompt injection and PII exposure, and integrates with WAF rules. AI endpoint discovery is free for all plan tiers including Free and Pro.

- [AWS EKS Docs](https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions-standard.html) Kubernetes 1.35 is now available on Amazon EKS. The release deprecates cgroup v1 support — the kubelet refuses to start by default on nodes still using cgroup v1. Teams should audit node groups and plan migration before upgrading.
