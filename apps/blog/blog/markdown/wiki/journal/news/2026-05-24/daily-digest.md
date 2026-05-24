---
title: "Daily Digest: 2026-05-24"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-24
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-24
---

## AI Industry

- [AISI](https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities) The UK AI Security Institute evaluated Anthropic's Claude Mythos Preview and found it is the first AI model to complete the full 32-step "The Last Ones" corporate network attack simulation, succeeding in 3 of 10 attempts and averaging 22 steps. Mythos Preview also succeeds on expert-level Capture the Flag challenges 73% of the time, compared to near-zero for prior models. AISI cautioned that all tests used static, undefended environments and that hardened real-world networks present a different challenge.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/litespeed-cpanel-plugin-cve-2026-48172.html) CVE-2026-48172 (CVSS 10.0) in LiteSpeed's cPanel plugin (versions 2.3–2.4.4) allows any logged-in cPanel user to execute arbitrary scripts as root via the lsws.redisAble API endpoint. Actively exploited in the wild and added to the CISA KEV catalog. Patch to cPanel plugin v2.4.7 or WHM plugin v5.3.1.0.

- [GitHub Changelog](https://github.blog/changelog/2026-05-22-staged-publishing-and-new-install-time-controls-for-npm/) GitHub shipped staged publishing for npm, requiring a human maintainer to pass a 2FA challenge before any package version goes live — including releases from CI/CD pipelines using OIDC trusted publishing. The change prevents token-theft supply chain attacks like those seen in recent PHP ecosystem compromises. npm CLI 11.15.0 or newer required.

## Local

- [CP24](https://www.cp24.com/local/toronto/2026/05/23/a-friend-to-many-people-former-toronto-councillor-and-ttc-chair-howard-moscoe-dead-at-86/) Howard Moscoe, former Toronto city councillor and first chair of the TTC following municipal amalgamation in 1997, died at 86. Mayor Olivia Chow announced his death Saturday. Moscoe served 31 years in municipal politics, including 14 years on the TTC board.

- [CBC News](https://www.cbc.ca/news/canada/toronto/bruno-mars-saturday-concert-rescheduled-9.7210062) Bruno Mars's May 23 opening night at Rogers Stadium was postponed to May 31 due to heavy rain and a special weather statement from Environment Canada forecasting 30–50 mm of precipitation across the GTA. Remaining shows on May 24, 27, 28, and 30 are still scheduled.

## Weather

- Whitby: 18°C high, 13°C low, periods of drizzle ending late morning then cloudy with 40% chance of rain or drizzle in the afternoon. No alerts. (Environment Canada)

---

## Update — 16:00 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/research/glasswing-initial-update) Anthropic launched Project Glasswing with roughly 50 partners — including Cloudflare, Mozilla, Microsoft, Palo Alto Networks, and Oracle — using Claude Mythos Preview to scan the most systemically important open-source software. The effort has uncovered more than 10,000 high- or critical-severity vulnerabilities across 1,000+ projects, including a 27-year-old OpenBSD bug and a 16-year-old FFmpeg flaw that automated tools had missed. Fewer than 100 patches have been deployed so far, highlighting the gap between AI-speed discovery and human-speed remediation. Anthropic is committing $100M in model compute credits to the project and $4M in grants to the Linux Foundation and Apache Software Foundation.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/github-investigating-teampcp-claimed.html) GitHub confirmed that threat actor TeamPCP exfiltrated approximately 3,800–4,000 internal repositories after compromising an employee device via a poisoned Visual Studio Code extension. Source code is being sold for $95,000 in collaboration with LAPSUS$. GitHub rotated critical credentials; customer-facing data outside internal repos was not affected.

- [The Hacker News](https://thehackernews.com/2026/05/china-linked-hackers-target-asian.html) SHADOW-EARTH-053, a China-aligned threat group, ran sustained intrusion campaigns against government and defense sectors across South, Southeast, and East Asia and one NATO member state (Poland). Separate GLITTER CARP and SEQUIN CARP campaigns targeted journalists, activists, and civil society groups including Uyghur, Tibetan, and Taiwanese diaspora organizations and the ICIJ. Attack methods include Exchange and IIS exploitation, Godzilla web shells, and ShadowPad implants.

## Local

- [The Weather Network](https://www.theweathernetwork.com/en/news/weather/severe/thousands-of-outages-reported-as-gusty-winds-buffet-ontario) Gusty winds of 60–72 km/h across Ontario on Saturday knocked down trees and power lines, leaving at least 30,000 Hydro One customers without power heading into Saturday evening. The strongest gusts hit Muskoka Airport (72 km/h) and Sault Ste. Marie (69 km/h); winds are easing through Sunday.
