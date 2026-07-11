---
title: "Daily Digest: 2026-07-11"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-11
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-11
---

## AI Tooling

- [Releasebot / Anthropic](https://releasebot.io/updates/anthropic) Claude Code v2.1.207 ships today: auto mode is now enabled on Bedrock, Vertex AI, and Foundry without the `CLAUDE_CODE_ENABLE_AUTO_MODE` opt-in flag; Bedrock defaults to Claude Opus 4.8. Fixes a terminal freeze triggered by streaming very long lists, tables, or code blocks, and hardens plugin option handling against shell injection.

## Open Source

- [Releasebot / n8n](https://releasebot.io/updates/n8n) n8n v2.30.0 (July 8) adds Kafka mTLS client-certificate auth, Microsoft Entra Service Principal support across Microsoft nodes, public API access for evaluation test runs and project export, and a new RBAC scope for project-only management.

## Security

- [The Hacker News](https://thehackernews.com/2026/07/sharepoint-rce-cve-2026-45659-added-to.html) CVE-2026-45659 (CVSS 8.8) in SharePoint Server 2016/2019/Subscription Edition allows authenticated users with Site Member permissions to execute code remotely via deserialization. CISA added it to KEV on July 1; federal remediation deadline was July 4. Microsoft patched in May 2026.
- [CSO Online](https://www.csoonline.com/article/4192188/argo-cd-flaw-shows-why-gitops-infrastructure-should-be-treated-as-tier-zero.html) Synacktiv disclosed an unpatched unauthenticated RCE in ArgoCD's repo-server (July 1): an attacker with access to the internal gRPC port can abuse Kustomize's Helm build options to run arbitrary commands and extract cluster credentials. No CVE assigned yet; no patch available. Mitigation: enforce Kubernetes network policies to isolate the repo-server and Redis from untrusted pods.

## Local

- [Toronto Police Service](https://www.tps.ca/media-centre/news-releases/66387/) The 54th Annual Chariot Fest (ISKCON) parade runs down Yonge Street today, 11 a.m.–2 p.m., with rolling road closures from Bloor to Queens Quay. City-wide traffic impacts expected through early afternoon.
- [todocanada](https://www.todocanada.ca/things-to-do-in-toronto-this-weekend/) The 24th Festival of South Asia runs July 11–12 at the Gerrard India Bazaar, featuring South Asian dance, a Rising Star Talent Competition, and food vendors.

## Weather

- [Environment Canada](https://weather.gc.ca/en/location/index.html?coords=43.898%2C-78.939) Whitby: 28°C high, 13°C low, sunny throughout the day. No alerts.

## Just for You

- [GitHub](https://github.com/addyosmani/agent-skills) addyosmani/agent-skills enters the weekly top 8 at #2 (7,944 stars this week, 77,078 total) — a curated set of production-grade engineering skills for AI coding agents.
- [GitHub](https://github.com/iOfficeAI/OfficeCLI) iOfficeAI/OfficeCLI enters the weekly top 8 at #5 (5,789 stars this week, 14,783 total) — free open-source single binary that lets AI agents read, edit, and automate Word, Excel, and PowerPoint files without an Office installation.
