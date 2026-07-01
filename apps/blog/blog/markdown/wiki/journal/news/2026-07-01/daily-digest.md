---
title: "Daily Digest: 2026-07-01"
summary: "News digest covering AI, open source, security, geopolitics, and local news."
keywords:
  - daily-digest
  - 2026-07-01
related:
  - wiki/journal
scope: "Multi-topic news digest. No analysis or commentary."
last_verified: 2026-07-01
---

## AI Industry

- [Digital Trends](https://www.digitaltrends.com/computing/youll-be-able-to-use-claude-fable-5-again-starting-july-1/) Anthropic restores Claude Fable 5 globally today after a three-week suspension under a US government directive. A new safety classifier developed with government coordination now blocks the flagged cybersecurity technique in over 99% of cases; blocked requests are automatically rerouted to Opus 4.8. Temporary usage limits apply during the redeployment period.

- [TechTimes](https://www.techtimes.com/articles/319318/20260629/gemini-35-pro-cleared-july-launch-fable-5-nears-return-gpt-56-stays-locked.htm) Google's Gemini 3.5 Pro is cleared for general availability in July after a delay from June. The model has been in limited Vertex AI enterprise preview; Google is targeting GA this month though has not officially confirmed a date. Features a 2M-token context window and a Deep Think reasoning mode.

- [Microsoft Learn](https://learn.microsoft.com/en-us/partner-center/announcements/2026-june) Microsoft 365 Business Standard with Copilot and Business Premium with Copilot become permanent SKUs today, July 1. A global pricing update also takes effect across all purchasing channels; customers who renewed before today retain prior pricing.

## Local

- [City of Toronto](https://www.toronto.ca/news/city-of-toronto-celebrates-canada-day-with-free-festivities-including-fireworks/) Toronto's Canada Day runs all day with FIFA World Cup activations at Nathan Phillips Square, including live broadcasts of Round of 32 matches at 4 p.m. and 8 p.m. Fireworks at 10 p.m. at Ashbridges Bay, Centennial Park, Mel Lastman Square, Harbourfront Centre, and four other locations across the city.

- [Town of Whitby](https://www.whitby.ca/news/posts/canada-day-in-whitby/) Whitby's Canada Day celebration at Victoria Fields runs from 6 p.m. with live music, family activities, and food trucks. No waste collection today; residents should put out bins the following day.

## Weather

- Whitby: 34°C high, 24°C low, 40% chance of showers. Orange heat warning in effect — maximum temperatures 31–34°C with some areas potentially reaching 37°C. Heat warning continues through July 3.

---

## Update — 16:02 UTC

## AI Industry

- [Anthropic](https://www.anthropic.com/news/claude-sonnet-5) Claude Sonnet 5 launched June 30 and became the default model for free and Pro plans today. It delivers agentic performance close to Opus 4.8 — planning, browser and terminal use, autonomous task execution — at the same price as Sonnet 4.6. Introductory pricing is $2/$10 per million tokens through August 31, rising to $3/$15 after.

## Security

- [BleepingComputer](https://www.bleepingcomputer.com/news/security/oracle-mitigates-peoplesoft-zero-day-exploited-in-data-theft-attacks/) Oracle issued emergency mitigations for CVE-2026-35273, a CVSS 9.8 unauthenticated RCE zero-day in PeopleSoft PeopleTools 8.61 and 8.62. ShinyHunters exploited the flaw against over 300 instances across 100+ organizations — 68% of them in higher education. A full patch is forthcoming; organizations should restrict access to vulnerable endpoints and monitor for webshells.

## Geopolitics

- [NPR](https://www.npr.org/2026/06/29/g-s1-130793/up-first-newsletter-iran-war-ceasefire-venezuela-earthquakes-ice-lance-schroyer) Iran's Revolutionary Guard launched drone and missile strikes on Bahrain and Kuwait despite the June 17 US-Iran memorandum of understanding, the most significant escalation since the ceasefire framework was signed. Ongoing negotiations for a lasting end to the conflict are now in jeopardy.

---

## Update — 21:00 UTC

## AI Industry

- [Windows News AI](https://windowsnews.ai/article/meta-plans-ai-cloud-assault-with-gpu-rentals-and-model-hosting-challenging-microsoft-azure-and-aws.432981) Meta announced "Meta AI Infrastructure Services," an AI cloud business targeting late 2026 GA with a private beta in August. Offerings include bare-metal H100 GPU instances at $1.89/hour, LLaMA API endpoints at $0.49 per million tokens, and managed Kubernetes clusters pre-loaded with AI toolchains — pricing roughly half that of Azure and AWS equivalents.

## AI Tooling

- [AI Weekly](https://aiweekly.co/alerts/anthropic-redeploys-fable-5-with-cross-lab-jailbreak-rubric) Alongside the Fable 5 redeployment, Anthropic published a four-axis jailbreak severity rubric co-developed with Amazon, Microsoft, Google, and Glasswing partners. It scores findings on capability gain, breadth of impact, ease of weaponization, and independent discoverability, and commits Anthropic to immediate patch deployment for the highest-severity cases.

## Security

- [The Hacker News](https://thehackernews.com/2026/07/critical-cursor-flaws-could-let-prompt.html) Two critical RCE flaws in Cursor IDE — CVE-2026-50548 and CVE-2026-50549, both CVSS 9.8 — were publicly disclosed today. Named DuneSlide by Cato AI Labs, the vulnerabilities allow zero-click prompt injection to escape the terminal sandbox via symlink bypass or working-directory path manipulation, reaching unsandboxed RCE without user interaction. All Cursor versions before 3.0 are affected; 3.0 (released April 2) contains the fix.

- [The Hacker News](https://thehackernews.com/2026/07/latest-progress-kemp-loadmaster-pre.html) Active exploitation of CVE-2026-8037 — a pre-auth RCE in Progress Kemp LoadMaster rated CVSS 9.8 — began June 29 according to eSentire. The OS command injection flaw in the escape_quotes() function affects GA ≤7.2.63.1 and LTSF ≤7.2.54.17 when the API feature is enabled. Patches are available: GA 7.2.63.2 and LTSF 7.2.54.18.

## Weather

- Whitby: A severe thunderstorm warning is now in effect alongside the existing heat advisory, with wind gusts forecast up to 100 km/h and 20–40 mm of rain possible this evening. The orange heat warning (31–37°C) continues through July 3.
