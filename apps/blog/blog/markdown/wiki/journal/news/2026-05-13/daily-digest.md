---
title: "Daily Digest: 2026-05-13"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-05-13
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-05-13
---

## AI Industry

- [The Information via Digitimes](https://www.digitimes.com/news/a20260513VL215/anthropic-startup-openai-google-software.html) Anthropic is in advanced talks to acquire Stainless, an SDK-generation startup that currently serves Google and OpenAI, at a valuation above $300 million. Stainless automates the creation of client SDKs for AI APIs.

- [CNBC](https://www.cnbc.com/2026/05/11/openai-eu-cyber-model-anthropic-mythos-gpt.html) The EU Commission confirmed OpenAI has committed to providing GPT-5.5-Cyber access to European cyber defenders for evaluation ahead of the EU AI Office's August 2026 enforcement date. Anthropic has not offered its Mythos cybersecurity model for equivalent EU review.

## AI Tooling

- [GitHub](https://github.com/github/copilot-cli/releases/tag/v1.0.45) GitHub Copilot CLI v1.0.45 (released May 11) adds an /autopilot slash command to toggle between interactive and fully autonomous agent modes. The release also aligns OpenTelemetry output with GenAI semantic conventions and cuts CLI startup time by up to 1.5 seconds.

## Security

- [Palo Alto Networks](https://security.paloaltonetworks.com/CVE-2026-0300) CVE-2026-0300 (CVSS 9.3) patches for PAN-OS shipped today, ending weeks of mitigate-only guidance while the flaw was actively exploited. The unauthenticated RCE in the User-ID Authentication Portal affects PA-Series and VM-Series firewalls; patched versions include 12.1.4-h5 and 11.x series updates.

- [The Hacker News](https://thehackernews.com/2026/05/cisa-adds-actively-exploited-linux-root.html) CVE-2026-31431 "Copy Fail" — a nine-year-old flaw in the Linux kernel's AF_ALG cryptographic subsystem — lets any unprivileged local user gain root without recompilation across Ubuntu, RHEL, Amazon Linux, and SUSE. CISA added it to KEV on May 1; the federal patch deadline is May 15.

## Local

- [Whitby.ca](https://www.whitby.ca/news/posts/mayors-monthly-newsletter-may-2026/) Whitby Farmer's Market opens for the 2026 season today, running every Wednesday from 9am to 3pm at Civic Square.

- [CBC News](https://www.cbc.ca/news/canada/toronto) Ontario's auditor general released a special report finding the province does not effectively monitor commercial truck driver training or licensing, leaving many unqualified drivers operating on provincial roads.

- [CBC News](https://www.cbc.ca/news/canada/toronto) The McLaughlin Planetarium, closed for over 30 years, is being demolished to make way for a new University of Toronto educational hub. Calls for a replacement public science facility continue.

## Weather

- Whitby: 16°C high, 5°C low. Morning showers ending near noon; risk of thunderstorm before 9am. 40% chance of afternoon showers. Wind east 20 km/h gusting to 40 shifting west in the afternoon. No alerts. Source: Environment Canada.

---

## Update — 17:00 UTC

## AI Tooling

- [Anthropic / TechCrunch](https://techcrunch.com/2026/05/12/the-ai-legal-services-industry-is-heating-up-anthropic-is-getting-in-on-the-action/) Anthropic launched Claude for Legal: 20+ MCP connectors linking Claude to DocuSign, iManage, Westlaw, LexisNexis, Everlaw, Box, and others, plus 12 practice-area plugins covering M&A, employment, IP, privacy, regulatory, and litigation work. Every paying Claude customer gets access.

- [AWS](https://aws.amazon.com/about-aws/whats-new/2026/05/claude-platform-aws/) Claude Platform on AWS reached general availability on May 11. AWS customers can now access the full Claude API — including Managed Agents, Files API, MCP connector, prompt caching, and the Claude Console — using existing IAM credentials and AWS billing.

- [OpenAI](https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/) OpenAI released three new Realtime API voice models: GPT-Realtime-2 (GPT-5-class reasoning, 128k context), GPT-Realtime-Translate (live speech translation across 70+ input languages into 13 outputs), and GPT-Realtime-Whisper (streaming speech-to-text). The Realtime API is now generally available.

## Just for You

- [InfoQ](https://www.infoq.com/news/2026/02/argocd-33/) ArgoCD 3.1 reached end of life on May 6 and no longer receives security updates. Users should upgrade to v3.2, v3.3, or v3.4.

---

## Update — 21:00 UTC

## AI Industry

- [TechCrunch](https://techcrunch.com/2026/05/13/anthropic-now-has-more-business-customers-than-openai-according-to-ramp-data/) Anthropic has more paying business customers than OpenAI for the first time, per Ramp's May AI Index: 34.4% of Ramp's business clients pay for Anthropic services versus 32.3% for OpenAI. Anthropic's share stood at 9% a year ago.

## AI Tooling

- [MarkTechPost](https://www.marktechpost.com/2026/05/13/google-deepmind-introduces-an-ai-enabled-mouse-pointer-powered-by-gemini-that-captures-visual-and-semantic-context-around-the-cursor/) Google DeepMind published experimental principles and demos for Magic Pointer — a Gemini-powered cursor that captures visual and semantic context around the pointer position. Two live demos appeared in Google AI Studio today: one for image editing and one for map navigation.

## Security

- [The Hacker News](https://thehackernews.com/2026/05/new-exim-bdat-vulnerability-exposes.html) CVE-2026-45185 "Dead.Letter" is an unauthenticated RCE in Exim mail servers built with GnuTLS, affecting versions 4.97 through 4.99.2. An attacker can corrupt heap memory via a crafted BDAT command followed by a TLS close_notify and cleartext byte. Patch to 4.99.3 immediately; OpenSSL builds are not affected.

## Geopolitics

- [CNN](https://www.cnn.com/2026/05/13/politics/live-news/trump-china-visit-arrival-ceremony-hnk) Trump arrived in Beijing today for a two-day summit with Xi Jinping. Elon Musk and Jensen Huang are part of the U.S. delegation. Agenda covers trade deals, Taiwan, AI governance, and Iran.
- [Al Jazeera](https://www.aljazeera.com/news/2026/5/13/iran-war-live-trump-slams-tehrans-reply-israel-kills-2-medics-in-lebanon) Israeli forces crossed the Litani River in southern Lebanon, breaching a key ceasefire boundary. Lebanon's government described the incursion as a serious escalation.

## Just for You

- [Cloudflare Blog](https://blog.cloudflare.com/artifacts-git-for-agents-beta/) Cloudflare Artifacts reached public beta — a Git-compatible versioned filesystem built for AI agents. Supports the standard Git wire protocol, SHA-1, delta encoding, and tens of millions of repositories per account.
