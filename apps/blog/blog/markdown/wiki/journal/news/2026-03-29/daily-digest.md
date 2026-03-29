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

---

## Update — 15:00 UTC

## AI Industry

- [Axios](https://www.axios.com/2026/03/29/claude-mythos-anthropic-cyberattack-ai-agents) US officials and security professionals say new frontier models from Anthropic and OpenAI have crossed a threshold where they can autonomously conduct sophisticated cyberattacks at scale. A Dark Reading survey found 48% of security professionals now rank agentic AI as their top attack vector for 2026, ahead of deepfakes and all other categories.

- [Google Blog](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-deep-think/) Google updated Gemini 3 Deep Think with expanded scientific reasoning — the model now achieves gold-medal-level results on the written sections of the 2025 International Physics and Chemistry Olympiads and identified a logical flaw in a peer-reviewed mathematics paper. The upgraded model is available to Google AI Ultra subscribers and select API researchers.

## AI Tooling

- [GitHub Copilot](https://www.nxcode.io/resources/news/github-copilot-complete-guide-2026-features-pricing-agents) GitHub Copilot agent mode reached general availability on JetBrains in March 2026, extending full agentic coding support to Java, Kotlin, and Python developers for the first time. Agentic code review can now gather full project context and automatically open fix PRs.

## Geopolitics

- [CNN](https://www.cnn.com/2026/03/29/world/live-news/iran-war-us-israel-trump) Yemen's Houthis carried out their first direct missile attack on Israel on March 29, escalating from prior warnings. Separately, Iran launched two intermediate-range ballistic missiles at Diego Garcia, the joint US-UK base in the Indian Ocean; neither struck the installation.

- [Al Jazeera](https://www.aljazeera.com/news/liveblog/2026/3/29/iran-war-live-houthis-attack-israel-anti-war-protesters-rally-in-tel-aviv) Foreign ministers from Pakistan, Turkey, Egypt, and Saudi Arabia met in Islamabad to coordinate de-escalation. US special envoy Steve Witkoff confirmed Pakistan is serving as the official mediator for US-Iran negotiations.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto/whitby-town-hall-incident-security-measures-9.7141804) Whitby Mayor Elizabeth Roy said she will review security at council chambers after Durham Region police opened an investigation into a Rebel News reporter who allegedly approached and harassed a female councillor outside Whitby Town Hall following a late-night council meeting.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939) Whitby: 7°C high (updated from morning), 1°C overnight. Mix of sun and cloud this afternoon, clearing this evening. No alerts.

## Just for You

- [GitHub](https://github.com/argoproj/argo-cd/releases) ArgoCD v3.2.8, v3.3.5, and v3.1.13 all patch grpc-go CVE-2026-33186 across three active release branches simultaneously. All Argo CD container images are signed with cosign and meet SLSA Level 3 supply-chain security requirements.

---

## Update — 22:00 UTC

## AI Industry

- [Ramp](https://ramp.com/velocity/ai-business-adoption-accelerates-led-by-anthropic) The Ramp AI Index for March 2026 shows Anthropic winning 70% of head-to-head matchups against OpenAI among first-time business buyers. One in four businesses on Ramp now pays for Anthropic — up 4.9 percentage points month-over-month to 24.4%. OpenAI's adoption rate fell 1.5%, its largest single-month decline since tracking began.

## Security

- [The Hacker News](https://thehackernews.com/2026/03/trivy-hack-spreads-infostealer-via.html) CVE-2026-33634 (CVSS 9.4): TeamPCP compromised Trivy's GitHub Actions release pipeline on March 19, force-pushing malicious commits to 76 of 77 version tags in `trivy-action` and all 7 tags in `setup-trivy`. The payload ran a credential stealer silently before each legitimate scan, exfiltrating SSH keys, cloud tokens, and Kubernetes secrets. CISA added the CVE to its KEV catalog March 26. Pin all GitHub Actions to full commit SHAs and rotate any credentials that passed through affected pipelines.

- [The Hacker News](https://thehackernews.com/2026/03/teampcp-backdoors-litellm-versions.html) LiteLLM versions 1.82.7 and 1.82.8 on PyPI were backdoored on March 24 as a downstream consequence of the Trivy compromise. TeamPCP used stolen PyPI credentials to inject a three-stage payload that harvests credentials, attempts Kubernetes cluster lateral movement, and installs a persistent systemd backdoor. LiteLLM has over 3.4 million daily downloads; affected packages have been removed from PyPI and BerriAI has paused new releases pending a Mandiant supply-chain review.

- [The Hacker News](https://thehackernews.com/2026/03/critical-langflow-flaw-cve-2026-33017.html) CVE-2026-33017 (CVSS 9.3): unauthenticated remote code execution in Langflow via the public flow build endpoint, which passes attacker-controlled Python to `exec()` with no sandboxing. Attackers built working exploits within 20 hours of disclosure and began scanning honeypots before any public PoC existed. CISA added it to the KEV catalog March 25 with a federal remediation deadline of April 8. Patch to Langflow v1.9.0 or disable public endpoint exposure.

## Local

- [Globe Newswire](https://www.globenewswire.com/news-release/2026/03/26/3262899/0/en/local-news-returns-to-print-metroland-and-torstar-launch-monthly-print-newspapers-across-greater-toronto-area.html) Torstar and Metroland announced the return of *Whitby This Week* as a monthly print publication, part of a broader relaunch of community papers across the GTA including Oshawa, Oakville, and Burlington. The paper will be available at pick-up locations across Whitby; Metroland is also hiring 20 editorial interns across Ontario.
