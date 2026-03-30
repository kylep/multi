---
title: "Daily Digest: 2026-03-30"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-03-30
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-03-30
---

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-03-27/claude-ai-maker-anthropic-said-to-weigh-ipo-as-soon-as-october) Anthropic is in early discussions with Goldman Sachs, JPMorgan, and Morgan Stanley about an IPO targeting Q4 2026. The offering would aim for a valuation above $60 billion; no final decision has been made.

- [The Information](https://www.investing.com/news/stock-market-news/anthropic-considers-ipo-as-soon-as-q4-2026-the-information-4584016) OpenAI finished pretraining its next model, internally codenamed Spud, as of March 25. Altman wrote in an internal memo that development is moving faster than many expected.

## AI Tooling

- [Anthropic Platform Release Notes](https://platform.claude.com/docs/en/release-notes/overview) Claude Sonnet 4.6 launched with a 1M token context window in beta, improved agentic search performance, and reduced token consumption. Structured outputs are now generally available on the Claude API with no beta header required.

- [Claude Code Changelog](https://code.claude.com/docs/en/changelog) Claude Code Analytics API gives organizations programmatic access to daily usage metrics including productivity data and cost breakdowns. Conditional hooks now support permission rule syntax to reduce process spawning; an opt-in PowerShell tool for Windows is in preview. Claude Haiku 3 is deprecated with retirement set for April 19.

- [GitHub Blog](https://github.blog/news-insights/product-news/github-copilot-agent-mode-activated/) GitHub Copilot Agent Mode with Model Context Protocol support is rolling out to all VS Code users in the March 2026 release (v1.112). The update adds sandboxed MCP servers, image support in agent conversations, and an MCP Bridge that connects VS Code-registered servers to Copilot CLI and Claude agents.

- [Microsoft 365 Blog](https://www.microsoft.com/en-us/microsoft-365/blog/2026/03/09/copilot-cowork-a-new-way-of-getting-work-done/) Copilot Cowork entered Frontier preview in late March, letting users delegate tasks by describing an outcome; Copilot then builds a plan grounded in emails, meetings, and files and executes it in the background with checkpoints.

- [Google Blog](https://blog.google/innovation-and-ai/products/gemini-app/gemini-drop-updates-march-2026/) Gemini added Import Memory, a tool that lets users transfer chat histories and personal preferences from ChatGPT and other AI services directly into Gemini. Launched March 26 alongside the rest of the March Gemini Drop.

## Security

- [OpenClawAI Blog](https://openclawai.io/blog/openclaw-cve-flood-nine-vulnerabilities-four-days-march-2026) Nine CVEs were disclosed for OpenClaw in four days between March 18 and 21. The most severe, CVE-2026-32922 (CVSS 9.9), lets an attacker with pairing-scope tokens mint tokens with full elevated privileges. CVE-2026-32973 (CVSS 9.8) bypasses the exec allowlist via pattern normalization flaws. Upgrade to version 2026.3.11 or 2026.3.12 depending on the CVE; 128 additional advisories are still pending CVE assignment.

## Geopolitics

- [CNBC](https://www.cnbc.com/2026/03/30/trump-iran-oil-middle-east-war-israel-us-kuwait-attack-.html) Trump said on March 30 that the US could "take the oil in Iran" and specifically mentioned seizing Kharg Island, which handles 90% of Iranian oil exports. Brent crude rose above $116/barrel.

- [Al Jazeera](https://www.aljazeera.com/news/2026/3/29/pentagon-readies-for-weeks-of-us-ground-operations-in-iran-report) The Pentagon is preparing for weeks of limited ground operations in Iran, potentially including raids on Kharg Island and coastal Hormuz sites, per the Washington Post. The White House said no final presidential decision has been made.

## Local

- [Prime Minister of Canada](https://www.pm.gc.ca/en/news/media-advisories/2026/03/29/monday-march-30-2026) Prime Minister Carney and Ontario Premier Ford are jointly announcing new measures to accelerate homebuilding in Toronto on March 30. No details have been released ahead of the 11:00 a.m. announcement.

## Weather

- Whitby: 15°C high, 7°C overnight. Sunny this morning, increasing clouds early afternoon, southwest winds gusting to 40 km/h. 40% chance of showers this evening with a risk of thunderstorms overnight; 10–15 mm of rainfall expected. No alerts. [(Environment Canada)](https://weather.gc.ca/en/location/index.html?coords=43.898,-78.939)

## Just for You

- [VS Code Release Notes](https://releasebot.io/updates/microsoft/visual-studio-code) VS Code 1.112 MCP Bridge now forwards MCP servers registered in VS Code to both Copilot CLI and Claude Code agents, meaning tool definitions in `mcp.json` are automatically available across all three surfaces without separate configuration.
