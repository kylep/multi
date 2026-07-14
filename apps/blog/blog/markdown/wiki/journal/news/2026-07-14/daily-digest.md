---
title: "Daily Digest: 2026-07-14"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-14
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-14
---

## AI Industry

- [Bloomberg](https://www.bloomberg.com/news/articles/2026-07-02/openai-proposes-giving-the-us-government-a-5-stake-ft-says) OpenAI proposed giving the US government a 5% stake worth roughly $42.6 billion, based on the company's $852B valuation. Sam Altman pitched the arrangement directly to President Trump, Commerce Secretary Lutnick, and Treasury Secretary Bessent; discussions are described as early-stage and would require Congressional approval.

- [TechCrunch](https://techcrunch.com/2026/07/02/anthropic-is-discussing-a-new-custom-chip-with-samsung/) Anthropic opened early talks with Samsung to manufacture a custom AI inference chip using Samsung's 2nm process. Conversations are preliminary — Anthropic has not yet defined chip specifications or server integration — as the company prepares for an expected IPO on track toward ~$47B annualized revenue.

- [TechCrunch](https://techcrunch.com/2026/07/02/microsoft-launches-its-own-ai-deployment-company-with-2-5-billion-commitment/) Microsoft launched Microsoft Frontier Company with a $2.5B commitment and 6,000 forward-deployed engineers embedded inside enterprise customers. The unit targets a widely cited stat that 95% of enterprise AI pilots deliver zero measurable P&L impact; initial clients include Unilever, Land O'Lakes, and the London Stock Exchange Group.

- [CNBC](https://www.cnbc.com/2026/06/28/google-limits-metas-use-of-its-gemini-ai-models-ft-reports.html) Google capped Meta's access to Gemini models after Meta requested more compute than Google could supply, disrupting several Meta internal AI projects. Google separately agreed to pay SpaceX $920M/month for roughly 110,000 Nvidia GPUs as a bridge while building out its own capacity against a $460B Cloud backlog.

- [Caixin Global](https://www.caixinglobal.com/2026-07-03/unitree-robotics-wins-approval-for-618-million-star-market-ipo-102460136.html) Unitree Robotics received CSRC approval for a $619M IPO on Shanghai's STAR Market, the fastest review in STAR Market history at 73 days. Humanoid robots accounted for 51.5% of Unitree's 2025 revenue; proceeds are earmarked for AI model research and new manufacturing capacity.

## AI Tooling

- [Releasebot](https://releasebot.io/updates/anthropic) Claude Code v2.1.208 shipped today: opt-in plain-text rendering for screen-reader users via `claude --ax-screen-reader`, vi keybinding support, tool-pool caching delivering up to 7x faster performance at high tool counts, and file-edit cache bounded at 16 MB. Fixes prevent replies to background agents from being silently dropped and resolve HTTP/2 crashes in supervised sessions.

- [Zoombangla/Microsoft](https://inews.zoombangla.com/microsoft-365-copilot-july-2026-updates/) Microsoft 365 Copilot shipped 40+ updates for July: Anthropic's Claude is now available as a model option in Copilot Chat, GPT-5.6 becomes the preferred model across Word, Excel, PowerPoint, and Chat, Copilot Cowork hits GA with multi-model support and Purview integration, and AI content watermarking lands for video and audio.

## Security

- [Microsoft Tech Community](https://techcommunity.microsoft.com/blog/sqlserver/sql-server-2016-extended-security-updates-stay-protected-while-you-modernize/4529478) SQL Server 2016 exited extended support today, July 14, 2026. Organizations still running it now require paid Extended Security Updates: Year 1 costs 75% of the original license price, rising to 300% in Year 3. No new security patches ship without ESU enrollment.

## Geopolitics

- [ABC News](https://abcnews.com/International/wireStory/australia-fiji-seal-new-mutual-defense-pact-push-134508688) Australia and Fiji signed the "Ocean of Peace" mutual defense pact on July 6, binding each country to come to the other's defense — Fiji's first mutual defense treaty and Australia's fourth overall. The signing coincided with a Chinese submarine ballistic-missile test in the South Pacific.

## Local

- [CBC News](https://www.cbc.ca/news/canada/lcbo-american-products-removal-ontario-liquor-9.7264586) Ontario has spent $8M storing its $79M US alcohol stockpile pulled from LCBO shelves in March 2025. About $2.6M worth of product has now expired; the province has not disclosed plans for the remainder while other provinces publicly liquidated their own stockpiles.

## Weather

- Whitby: 35°C high, 24°C low, sunny. Yellow Heat Warning in effect — humidex values 38 to 45, today marks the peak of this heat event. No precipitation. Source: Environment Canada.

## Just for You

- [Cloudflare Changelog](https://developers.cloudflare.com/changelog/) Cloudflare agents connected via `addMcpServer` can now handle MCP elicitation requests, letting servers ask users for input or consent during tool calls using form or URL modes. Shipped July 13.

- [Cloudflare Changelog](https://developers.cloudflare.com/changelog/) Cloudflare R2 Data Catalog now accepts read-only API tokens, allowing query engines and analytics clients to operate without write access. A compaction feature also auto-clusters Iceberg manifest files by partition to reduce metadata overhead.
