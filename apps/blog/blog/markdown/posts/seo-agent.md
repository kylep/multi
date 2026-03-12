---
title: "AI SEO Agent That Audits Your Blog"
summary: The SEO subagent runs a live audit on kyle.pericak.com, pulls
  organic traffic from GA4, finds content gaps via WebSearch, and flags
  internal linking issues in existing posts.
slug: seo-agent
category: ai
tags: AI, Claude-Code, SEO, agents, GA4
date: 2026-03-12
status: published
---

[Post 1](/agent-org-chart.html) described the agent team. This is the SEO
subagent actually running, against real data, on a real blog.

# The agent definition

The SEO agent lives at `.claude/agents/seo.md`. Full definition:

```markdown
---
name: seo
description: SEO subagent — Keyword gaps, internal linking, content analysis
model: sonnet
tools:
  - mcp__analytics-mcp__run_report
  - mcp__analytics-mcp__get_property_details
  - WebSearch
  - Read
  - Glob
  - Grep
  - Write
  - Bash
---
You are the SEO subagent reporting to the CMO. You analyze
kyle.pericak.com for search optimization opportunities.

## What you have access to

- **GA4 Analytics MCP** for search traffic data
- **WebSearch** for keyword research
- **File tools** to read blog posts and check internal linking

## How to work

1. Analyze which posts get organic search traffic (GA4)
2. Read post content to assess keyword targeting and internal linking
3. Use WebSearch to find keyword opportunities in the blog's topic areas
4. Identify gaps: topics with search demand but no blog coverage

## Tasks you can perform

**Content gap analysis:** Find topics related to existing posts that
have search demand but no coverage on the blog.

**Internal linking audit:** Read posts and check for opportunities to
link between related content. Blog internal links must end in `.html`.

**Keyword analysis:** For a given post, check what keywords it could
rank for and whether the content is well-optimized.
```

## What each tool does

**GA4 Analytics MCP** connects Claude Code to the GA4 Data API via OAuth
2.0 with the `analytics.readonly` scope. The agent uses two tools from it:
`mcp__analytics-mcp__run_report` queries traffic data (sessions, pageviews,
engagement) filtered by `source/medium = "google / organic"` and broken down
by landing page. `mcp__analytics-mcp__get_property_details` verifies the
property connection before pulling data.

**WebSearch** is for content gap verification. The agent doesn't just guess
which topics have demand. It searches, checks the SERPs, confirms volume
exists, then cross-references with what's already on the blog.

**File tools** (Read, Glob, Grep) scan post content for forward references
without a corresponding link, and check that internal links use the `.html`
suffix the static export requires.

# Running the audit

```bash
claude --agent seo -p "Run a full SEO audit on kyle.pericak.com. \
  Pull organic traffic from GA4, identify content gaps, \
  and find internal linking opportunities."
```

# What came back

```
# SEO Audit — kyle.pericak.com — March 12, 2026

## 1. Top Posts by Organic Search Traffic (GA4, last 12 months)

| Page | Organic Sessions |
|------|-----------------|
| /rhel-virtio-initrd.html | 4 |
| /nodejs-ansible.html | 1 |
| /openclaw-linear-skill.html | 1 |

Total organic traffic in 12 months: 6 sessions. Site runs almost entirely
on Direct traffic. The RHEL virtio initrd post (2020) is the #1 organic
result for its query. Narrow, specific, procedural posts from 2020 outrank
everything newer. That is the signal. Notable engagement outlier:
/openrouter-ai-tools.html got only 3 sessions but 54 pageviews.
Infrastructure gap: no Google Search Console connected.

## 2. Content Gaps (verified 2026 demand)

1. LLM runtime comparison on Apple Silicon (MLX vs llama.cpp vs Ollama) —
   blog covers models but not runtimes
2. Claude Code subagent definition guide — agent-org-chart.md is narrative,
   not a how-to
3. Building a custom MCP server — three posts use MCP but none explain
   building one

## 3. Internal Linking Fixes Found

- openclaw-k8s.md: 'That is next.' teaser never links to the linear skill
  post (fix: link to /openclaw-linear-skill.html)
- local-llm-m2-air.md: zero internal links, isolated post (fix: add link
  to /openrouter-ai-tools.html in conclusion)
- agent-org-chart.md and playwright-mcp.md: same topic cluster, neither
  links to the other
- agent-org-chart.md: CFO row mentions OpenRouter MCP but never links to it
- openclaw-mvp.md: zero internal links, never links forward to k8s post
```

# Reading the numbers

Six organic sessions in 12 months. That is the whole picture.

The RHEL virtio initrd post from 2020 accounts for four of those six. It is a
narrow, specific, procedural post about a fairly obscure kernel driver issue.
The kind of thing you write once because you spent three hours debugging it and
want to remember the fix. Google found it useful. The newer AI posts have not
produced a single organic session.

That gap is the signal. The 2020 posts rank because they answer a specific
question someone is typing into Google. The newer posts are more narrative,
more "here is what I built," which is fine as writing but does not match
search intent.

The 54 pageviews from 3 organic sessions on `openrouter-ai-tools.html` stands
out. Someone found that post, stayed, and read. The post is not driving
discovery, but it holds attention when it gets a visitor.

No Google Search Console connected is a real infrastructure gap. The agent
caught it. GSC would show impressions, position data, and which queries are
surfacing pages with zero clicks. Flying without it.

# Content gaps

The three gaps the agent flagged come from WebSearch verification, not
guesswork.

**LLM runtime comparison on Apple Silicon** is the one I find most useful.
The blog has posts about running local models, but none that compare MLX,
llama.cpp, and Ollama head-to-head on the same hardware. That comparison
has real search demand and the blog's existing local-LLM content makes it a
natural fit.

**Claude Code subagent definition guide** is interesting because the agent
flagged its own post. The [agent org chart](/agent-org-chart.html) is a
working-engineer narrative. It is not a how-to for someone who wants to
define their own subagent from scratch. There is search demand for the latter
and a gap to fill.

**Building a custom MCP server** is the most concrete gap. Multiple posts on
this blog use MCP (GA4, Linear, OpenRouter), but none explain how to build
one. That is a gap with real demand and existing context to link from.

# Internal linking fixes

The agent found five specific fixes. Here is the most concrete example.

`openclaw-k8s.md` ends with:

```text
That's next. Along with Vault auto-unseal, TLS on
Vault, network policy audit logging (Cilium), and image
scanning in CI.
```

"That's next" refers to a Linear skill. The Linear skill post exists now
([openclaw-linear-skill.html](/openclaw-linear-skill.html)), but the
sentence never got updated with a link. Fix is a one-line edit:

```text
[That's next](/openclaw-linear-skill.html). Along with Vault auto-unseal,
TLS on Vault, network policy audit logging (Cilium), and image scanning in CI.
```

The other fixes follow the same pattern. `openclaw-mvp.md` has zero internal
links and was written before the k8s post, so it never links forward to it.
`local-llm-m2-air.md` is isolated with no internal links at all, and the
obvious connection is the OpenRouter post. The agent-org-chart and
[playwright-mcp](/playwright-mcp.html) posts cover the same topic cluster and
neither links to the other.

These are all fixable in under an hour. The agent found them in one pass
without being told which posts to check.
