---
title: "Daily Digest: 2026-06-23"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-06-23
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-06-23
---

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-fable-5-mythos-5) Fable 5 is removed from included subscription limits as of June 23. Pro, Max, Team, and Enterprise seat-based plan users who continue using Fable 5 are now billed at usage-credit rates ($10/M input, $50/M output tokens). Anthropic says it plans to restore Fable 5 to subscription plans once capacity allows, with no restoration date announced.

## Open Source

- [GitHub](https://github.com/calesthio/OpenMontage) calesthio/OpenMontage enters GitHub weekly trending at #3 with 6,089 stars this week (13,735 total) — an open-source agentic video production system with 12 pipelines, 52 tools, and 500+ agent skills that turns an AI coding assistant into a video production studio.

- [GitHub](https://github.com/OpenCut-app/OpenCut) OpenCut-app/OpenCut enters weekly trending at #8 with 3,097 stars this week (59,006 total) — an open-source alternative to CapCut for video editing.

## Security

- [NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-47291) CVE-2026-47291 is a CVSS 9.8 unauthenticated RCE in Windows HTTP.sys triggered by an integer overflow in the HTTP protocol stack. An attacker sends a crafted HTTP request exceeding 65,535 bytes to execute code on the target server. Patched in June 2026 Patch Tuesday; public exploits are now available.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto) A coalition of Toronto community groups is purchasing properties across the city to keep rents below market rate, with organizers citing the upcoming municipal election as a deciding factor in whether they can secure thousands more units in coming years.

## Weather

- Whitby: 26°C high, 13°C low, mainly sunny. No alerts.

---

## Update — 18:00 UTC

## AI Industry

- [NVIDIA Blog](https://blogs.nvidia.com/blog/top500-green500-supercomputers-isc-2026/) NVIDIA technology powers 81% of the TOP500 supercomputers in the June 2026 rankings released at ISC in Hamburg. NVIDIA also announced the Vera Rubin platform, delivering over 7 exaflops of AI compute and capable of matching a full TOP500 system in a single rack.

- [Pulse2](https://pulse2.com/openai-noam-shazeer-to-join-company-after-leaving-google/) Noam Shazeer, Gemini co-lead and co-author of the 2017 "Attention Is All You Need" transformer paper, announced on June 18 he is leaving Google for OpenAI to become Lead for Architecture Research. Google had spent $2.7 billion to bring him back in 2024; Alphabet shares fell roughly 7% on the news.

- [NPR](https://www.npr.org/2026/06/22/nx-s1-5856359/ai-anthropic-congress-spending-openai-midterms-election) Groups affiliated with OpenAI and Anthropic have collectively spent more than $15 million on midterm election messaging, backing candidates and ballot measures tied to AI regulation.

## AI Tooling

- [Windows Central](https://www.windowscentral.com/microsoft/microsoft-cancels-claude-code-licenses-shifting-developers-to-github-copilot-cli-a-move-likely-driven-by-financial-motives) Microsoft is canceling Claude Code licenses for its Experiences + Devices division — Windows, Microsoft 365, Teams, and Surface teams — by June 30, redirecting thousands of engineers to GitHub Copilot CLI. Per-engineer API costs reached $500–$2,000 per month by April, well over original projections.

- [OpenAI](https://openai.com/index/gpt-5-5-with-trusted-access-for-cyber/) OpenAI's Daybreak cybersecurity initiative expands with GPT-5.5-Cyber moving to full release on June 23. The model is available to vetted security defenders for vulnerability detection, malware analysis, binary reverse engineering, and patch generation.

## Security

- [SecurityWeek](https://www.securityweek.com/fortibleed-86000-fortinet-device-credentials-compromised/) FortiBleed: an active campaign has harvested credentials from over 86,000 Fortinet FortiGate firewalls and VPN gateways across 194 countries. Attackers combined previously disclosed CVEs with AI-accelerated brute force against devices lacking MFA; no new zero-day is involved.

- [The Hacker News](https://thehackernews.com/2026/06/29-year-old-squid-proxy-bug-squidbleed.html) Squidbleed (CVE-2026-47729) is a 29-year-old heap overread in Squid Proxy's FTP gateway that leaks other users' HTTP Authorization headers, cookies, and session tokens to any trusted client who can route the proxy to an attacker-controlled FTP server. A patch is due in Squid 7.7; disabling FTP on the proxy eliminates the attack surface entirely.

## Just for You

- [Cloudflare](https://developers.cloudflare.com/workers/platform/changelog/) Cloudflare Durable Objects now stay alive for the duration of active outbound connections (via connect() or WebSocket), closing a gap where objects were evicted after 70–140 seconds of no inbound traffic even with open LLM or agent streams running.

---

## Update — 21:30 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/fable-mythos-access) The US government issued a legally binding export control directive on June 12 suspending all access to Fable 5 and Mythos 5 by any foreign national, including foreign national Anthropic employees, citing a narrow jailbreak that could elicit code vulnerability analysis. Anthropic complied but disputed the order, arguing the same jailbreak works on other publicly available models including GPT-5.5 that face no equivalent restrictions.

## AI Tooling

- [Google](https://sumatosolutions.com/blog-google-ai-updates-2026-gemini-flash-agentic-app-builder/) The Gemini CLI reached end-of-life on June 18 and is replaced by the Agentic 2.0 CLI, which supports automated multi-step workflows including analytics extraction, report generation, and scheduled content distribution without requiring a user to be present.

## Security

- [The Hacker News](https://thehackernews.com/2026/06/arystinger-malware-infects-4300-legacy.html) AryStinger is a new botnet targeting legacy D-Link and QNAP routers built on Realtek RTL819X chips from 2012–2015. At least 4,300 devices are infected and repurposed as a distributed reconnaissance and proxy network — performing DNS mass scanning, service fingerprinting, subdomain enumeration, and traffic tunneling — rather than the typical DDoS use. A Go-based NAS variant also runs internal recon tools including fscan, ksubdomain, and httpx.

## Geopolitics

- [NPR](https://www.npr.org/2026/06/18/nx-s1-5863027/us-iran-trump-memorandum-of-understanding-full-text) The US and Iran signed a 14-point MOU on June 18 extending the ceasefire, reopening the Strait of Hormuz for 60 days, lifting the US naval blockade of Iranian ports, and committing to a $300 billion reconstruction fund. Iran's nuclear program and ballistic missiles are deferred to later talks. As of June 23, Trump and Tehran are publicly at odds over what concessions Iran actually made.

## Local

- [CBC News](https://www.cbc.ca/news/canada/toronto/power-of-attorney-fraud-ontario-95-year-old-9.7245886) A 62-year-old Whitby man has been charged with power of attorney fraud after allegedly transferring nearly $900,000 from a 95-year-old victim without authorization.
