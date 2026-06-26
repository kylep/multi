---
title: "Daily Digest: 2026-06-26"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-06-26
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-06-26
---

## Security

- [CISA](https://www.cisa.gov/news-events/alerts/2026/06/23/cisa-adds-four-known-exploited-vulnerabilities-catalog) CVE-2026-34908 (CVSS 10.0) is an improper access control flaw in Ubiquiti UniFi OS allowing unauthenticated network access to modify device configuration. It chains with CVE-2026-34909 (path traversal) and CVE-2026-34910 (command injection) for a full root RCE. CISA added all three to the KEV catalog June 23 under BOD 26-04 with a federal patch deadline of today, June 26. Update UniFi OS to version 5.1.12 or later.

## Local

- [Toronto Police Service](https://www.tps.ca/media-centre/news-releases/66269/) Church Street is fully closed to traffic from Dundas Street East to Hayden Street starting 8 a.m. today for Pride Toronto. The Trans March rally begins at 7 p.m. at Hayden and Church, with the march stepping off at 8 p.m.
- [National News / Penticton Herald](https://www.pentictonherald.ca/news/national_news/article_fa62b6e1-29d7-53c1-82e7-293c80062768.html) Toronto is hosting Senegal vs. Iraq at BMO Field today — the final group stage World Cup match in the city, with both teams needing a result to advance.
- [CTV News](https://www.ctvnews.ca/toronto/politics/queens-park/article/exclusive-ontario-raising-speed-limits-on-more-highways/) Ontario's 110 km/h speed limit takes effect today on 938 km of provincial highways including the 401, 416, QEW, 400, 402, 403, and 417. Nearly 89% of the controlled-access network will carry the higher limit by September 30.

## Weather

- Whitby: 25°C high, 14°C low, mainly cloudy with morning fog patches clearing. No precipitation. UV index 8 (very high). No alerts.

## Just for You

- [Cloudflare Blog](https://releasebot.io/updates/cloudflare) Cloudflare added support for ML-DSA post-quantum certificates on connections between its edge and origin servers, enabling end-to-end post-quantum authentication via X25519MLKEM768.
- [Cloudflare Blog](https://releasebot.io/updates/cloudflare) Cloudflare Tunnels and Mesh now support granular per-instance permissions, allowing administrators to delegate read or write access to specific private networking resources without granting account-wide control.

---

## Update — 16:02 UTC

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-06-26/openai-weighs-ipo-in-2027-after-expected-anthropic-public-debut) OpenAI is tilting toward a 2027 IPO, expecting Anthropic to list first. Anthropic filed a confidential S-1 on June 1 and is targeting an October Nasdaq debut at a $965B valuation; OpenAI had previously been aiming for a fall 2026 listing before CFO Sarah Friar pushed internally for the delay.

## AI Tooling

- [GitHub Changelog](https://github.blog/changelog/2026-06-22-new-features-and-claude-as-agent-provider-preview-in-jetbrains-ides/) GitHub Copilot now supports Claude Code CLI as an agent provider in JetBrains IDEs (public preview). The June 22 update also adds organization-level agents, per-turn AI credit indicators, a `/models` slash command, and Cloud agent general availability.
- [Google Developers Blog](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/) Gemini CLI reached end-of-life on June 18 and is replaced by Antigravity CLI, a closed-source Go binary invoked via `agy`. Enterprise Gemini Code Assist license holders retain access indefinitely; all other users must migrate.

## Security

- [JFrog Security Research](https://research.jfrog.com/post/dissecting-and-exploiting-linux-lpe-variant-dirtyclone-cve-2026-43503/) DirtyClone (CVE-2026-43503, CVSS 8.8) is a Linux kernel local privilege escalation flaw affecting Debian, Ubuntu, and Fedora when unprivileged user namespaces are enabled. JFrog published a working exploit on June 25. The fix is in kernel v7.1-rc5; setting `kernel.unprivileged_userns_clone=0` mitigates unpatched systems. Kubernetes clusters and multi-tenant cloud environments are at highest risk.

---

## Update — 22:02 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/fable-mythos-access) The US government issued an export control directive on June 12 ordering Anthropic to suspend all access to Claude Fable 5 and Mythos 5 for any foreign national, including foreign national Anthropic employees. Anthropic disabled both models globally by midnight to ensure compliance, citing an inability to filter foreign nationals from domestic users in real time. Access to all other Claude models is unaffected. Anthropic publicly disagreed with the directive, stating a narrow jailbreak finding should not justify recalling a commercially deployed model.

## AI Tooling

- [Devin Docs](https://docs.devin.ai/desktop/devin-desktop-faq) Windsurf officially rebranded to Devin Desktop on June 2 via an over-the-air update. The new version ships Devin Local (a Rust-rewritten Cascade successor), Agent Client Protocol (ACP) support for connecting AI agents to code editors, and an agent command center with kanban-style multi-agent management. Cascade, the previous local agent, reaches end-of-life July 1.

## Security

- [The Hacker News](https://thehackernews.com/2026/06/cisa-warns-critical-lantronix-eds5000.html) CVE-2025-67038 (CVSS 9.8) is a code injection flaw in Lantronix EDS5000 Series serial-to-ethernet converters that lets an unauthenticated attacker execute arbitrary OS commands as root via an unsanitized username parameter. CISA added it to the KEV catalog June 23 and set a federal patch deadline of today, June 26. Exploitation can cut control of downstream industrial and OT assets. Upgrade to EDS5000 firmware 2.2.0.0R1.

## Geopolitics

- [CBS News](https://www.cbsnews.com/live-updates/iran-us-war-talks-suspended-trump-mou-israel-lebanon-hezbollah-fighting/) Trump stated today that Iran fired four one-way attack drones at the Strait of Hormuz, with one striking a cargo vessel, which he characterized as a violation of the ceasefire MOU signed June 17. Gulf Cooperation Council foreign ministers simultaneously released a statement declaring any final deal with Tehran must include limits on Iran's missile capabilities.
