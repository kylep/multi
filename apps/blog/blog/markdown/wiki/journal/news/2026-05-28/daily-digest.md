---
title: "Daily Digest: 2026-05-28"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-28
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-28
---

## AI Industry

- [TechFundingNews](https://techfundingnews.com/anthropic-opens-a-milan-office-here-is-what-six-european-cities-in-under-a-year-actually-means/) Anthropic opened its first Italian office in Milan today — the company's sixth European city in under a year. EMEA has become its fastest-growing region with run-rate revenue up more than 9x year-on-year.

- [CIO](https://www.cio.com/article/4167787/openai-anthropic-expand-services-push-signaling-new-phase-in-enterprise-ai-race.html) OpenAI launched DeployCo on May 11 — a majority-owned consulting subsidiary backed by more than $4 billion from 19 investment firms and systems integrators. The move responds to OpenAI's enterprise API market share falling from ~50% in 2023 to ~25% by mid-2025 as Anthropic and Google gained ground.

- [BuildFastWithAI](https://www.buildfastwithai.com/blogs/ai-news-today-may-28-2026) KPMG deployed Claude across its entire global workforce of 276,000 employees in 138 countries via the KPMG Digital Gateway Powered by Claude, announced May 19 and rolling out this week.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/gitea-vulnerability-exposes-private.html) CVE-2026-27771 (CVSS 8.2): Gitea's built-in container registry served private image layers and manifests to unauthenticated requests for nearly four years. All versions prior to 1.26.2 are affected across an estimated 30,000+ deployments in over 30 countries. The community fork Forgejo is also independently confirmed vulnerable. Temporary workaround: set `[service].REQUIRE_SIGNIN_VIEW=true`; full fix is upgrading to Gitea 1.26.2.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/05/23/us-iran-war-talks.html) The US and Iran have developed a framework to extend the April 8 ceasefire by 60 days and reopen the Strait of Hormuz. Trump said on May 27 the deal is "largely negotiated" with a formal announcement expected around May 31.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto) An east Toronto apartment building owner was sentenced to jail time and ordered to pay a significant fine after years of non-compliance with fire safety requirements.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby: 19°C high, 9°C low, mainly sunny with increasing cloud in the afternoon. No alerts.

## Just for You

- [GitHub](https://github.com/Lum1104/Understand-Anything) Understand-Anything reached #1 on GitHub weekly trending today (23,401 stars this week, up from #2 yesterday) — an interactive code knowledge graph tool that integrates with Claude Code, Cursor, Copilot, Codex, and Gemini CLI.

---

## Update — 18:00 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-05-12/anthropic-in-talks-to-raise-30-billion-at-900-billion-valuation) Anthropic's $30B+ funding round at a pre-money valuation above $900B is expected to close this week, co-led by Sequoia, Dragoneer, Altimeter, and Greenoaks. If finalized on reported terms, Anthropic's valuation will have grown roughly 15-fold in 14 months, surpassing OpenAI as the most valuable private AI company.

## AI Tooling

- [BleepingComputer](https://www.bleepingcomputer.com/news/artificial-intelligence/anthropics-restricted-claude-mythos-model-may-be-coming-to-claude-code/) Anthropic's Mythos model (claude-mythos-1-preview) briefly appeared in Claude Code and Claude Security interfaces before being pulled. The company confirmed it is preparing Mythos for a controlled release through Claude Code and Claude Security once stronger safeguards are in place — a reversal of its earlier position that Mythos would remain fully restricted.

- [Windows Central](https://www.windowscentral.com/microsoft/microsoft-cancels-claude-code-licenses-shifting-developers-to-github-copilot-cli-a-move-likely-driven-by-financial-motives) Microsoft is canceling most internal Claude Code licenses in its Experiences and Devices division by June 30, redirecting engineers to GitHub Copilot CLI. Per-engineer API costs of $500–$2,000 per month drove the decision; the move signals enterprise AI spending limits even where adoption is high.

## Security

- [TheHackerWire](https://www.thehackerwire.com/argo-cd-cve-2026-42880-read-only-access-exposes-kubernetes-secrets/) CVE-2026-42880 (CVSS 9.6): Argo CD's ServerSideDiff endpoint fails to mask Kubernetes Secret data, allowing an attacker with read-only access to extract plaintext service account tokens, database credentials, and TLS certificates via the Kubernetes API dry-run mechanism. Affects versions 3.2.0–3.2.10 and 3.3.0–3.3.8. Patched in 3.2.11 and 3.3.9.

## Local

- [CTV News](https://www.ctvnews.ca/business/article/cpkc-given-strike-notice-by-union-for-signals-and-communications-workers/) The International Brotherhood of Electrical Workers issued a 72-hour strike notice to CPKC today. About 300 signals and communications workers could walk off the job Sunday at 8 a.m. MT. CPKC says rail operations will continue if a strike proceeds; talks are ongoing through the weekend.
