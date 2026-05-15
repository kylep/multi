---
title: "Daily Digest: 2026-05-15"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-15
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-15
---

## AI Industry

- [Meta / WhatsApp Blog](https://blog.whatsapp.com/introducing-incognito-chat-with-meta-ai-a-completely-private-way-to-chat-with-ai) Meta launched Incognito Chat with Meta AI on WhatsApp and the Meta AI app — conversations run inside a Trusted Execution Environment, are not stored by Meta, and disappear by default. Rollout begins today across WhatsApp and the Meta AI app; image uploads are not supported in incognito mode.

- [SiliconAngle](https://siliconangle.com/2026/05/13/anthropic-launches-claude-small-business-new-automation-workflows/) Anthropic launched Claude for Small Business, a package of pre-built connectors and workflows for QuickBooks, PayPal, HubSpot, Canva, DocuSign, Google Workspace, and Microsoft 365. A road tour kicking off in Chicago offers free half-day training for 100 small business owners per stop.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/cisco-catalyst-sd-wan-controller-auth.html) CVE-2026-20182 is a CVSS 10.0 authentication bypass in Cisco Catalyst SD-WAN Controller and Manager, actively exploited in the wild by threat cluster UAT-8616. No credentials or user interaction required — attackers gain high-privilege access via the vdaemon DTLS service (UDP 12346) and can rewrite network configurations across the SD-WAN fabric. Cisco has released fixed software; no workaround exists.

- [Chrome Releases](https://chromereleases.googleblog.com/2026/05/stable-channel-update-for-desktop.html) Google Chrome 148.0.7778.168 patches 79 security flaws, including four high-severity RCE-capable bugs: CVE-2026-8551 (use-after-free in Downloads), CVE-2026-8577 (integer overflow in font handling), CVE-2026-8575 (use-after-free enabling sandbox escape), and CVE-2026-8567 (ANGLE integer overflow on Windows). Update immediately.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/05/15/trump-xi-summit-the-3-big-takeaways-from-historic-meeting-in-beijing.html) The Trump-Xi Beijing summit concluded today with no formal agreements — trade, Taiwan, and Iran all ended without new commitments. Both sides agreed on another meeting this fall. Xi repeated Taiwan is the most important issue; the US position on Taiwan is unchanged.

## Local

- [Canada SCORES](https://www.canadascores.org/news/whitbymayorsfundgrant) Habitat for Humanity GTA broke ground on a new affordable housing community in Whitby, funded in part by the Whitby Mayor's Community Development Fund.

## Weather

- Whitby: 20°C high, 7°C low, sunny with UV index 7. No alerts. Source: Environment Canada.

## Just for You

- [Android Headlines](https://www.androidheadlines.com/2026/05/google-io-new-gemini-model-launch-gpt-5-5-rival.html) Google I/O on May 19 is expected to include a new Gemini model intended to rival GPT-5.5. The conference will also cover Gemini Intelligence for Android, AI-native Googlebook laptops, and further agentic features.

---

## Update — 18:00 UTC

## Geopolitics

- [Just Security](https://www.justsecurity.org/139062/early-edition-may-15-2026/) Material update from the Trump-Xi Beijing summit: China agreed to purchase 200 Boeing commercial jets — its first US-made commercial jet order in nearly a decade — and both sides established a "Board of Trade" to oversee tariff reductions on approximately $30 billion in goods. Markets had priced in roughly 500 jet orders.

- [WEF / Reuters](https://www.weforum.org/stories/2026/05/blockade-diplomacy-and-other-geopolitical-stories-to-know-this-month/) Iran's blockade and the US military posture are keeping the Strait of Hormuz effectively closed, trapping much of the world's Gulf oil supply. The UAE announced it will accelerate construction of a pipeline to double export capacity through Fujairah by 2027, bypassing the strait.

- [UN / AP](https://www.justsecurity.org/139062/early-edition-may-15-2026/) Over 40% of Sudan's population — roughly 19.5 million people — faces acute food insecurity, with at least 135,000 in Phase 5 (starvation). The figure marks the largest single-country famine caseload since UN tracking began.

## Open Source

- [GitHub](https://github.com/anomalyco/opencode/releases) opencode (150k+ GitHub stars) shipped a new release today adding experimental background subagents — tasks continue running in the background while the user keeps working. The release also fixes sessions stuck on interrupted assistant messages and repeated auto-compaction.

## Security

- [Wiz / SecurityWeek](https://www.wiz.io/blog/github-rce-vulnerability-cve-2026-3854) CVE-2026-3854 (CVSS 8.7): a push-option injection flaw in GitHub Enterprise Server's internal babeld service lets any authenticated user execute arbitrary commands on GitHub's backend with a single git push. Cross-tenant repository exposure is possible on shared storage nodes. Publicly disclosed April 28; 88% of GHES instances were still unpatched at disclosure. Upgrade to GHES 3.19.3+. GitHub.com is already mitigated.
