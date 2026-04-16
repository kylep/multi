---
title: "Bot-Wiki: A Knowledge Base for Robots"
summary: Adding a structured wiki to the blog designed for AI agents and RAG pipelines, with machine-readable frontmatter, keyword lists, and cross-references.
slug: bot-wiki
category: ai
tags: AI, RAG, wiki, Bot-Wiki, knowledge-base
date: 2026-03-10
modified: 2026-03-10
status: published
image: bot-wiki.png
thumbnail: bot-wiki-thumb.png
imgprompt: A friendly cartoon robot librarian with round glasses,
  carefully organizing glowing books on wooden shelves in a cozy
  library, warm lighting, flat illustration style with soft gradients,
  books have circuit-board patterns on their spines
---

I added a new top-level section to this site: the
[Bot-Wiki](/wiki.html).

It looks like a wiki. It reads like a wiki. But it's not really for
humans. It's a structured knowledge base designed for AI agents and
RAG pipelines to consume.

## Why a wiki when I already have a blog?

Blog posts are stories. They have a narrative arc, opinions, tangents.
They're written for people who want to understand how I got from point
A to point B. That's great for learning from my experience but
terrible for a robot trying to answer "what MCP servers does this
project use?"

The wiki is the opposite. Each page is a factual reference card.
Structured metadata, explicit scope declarations, keyword lists for
embedding search, and cross-references for graph traversal. The tone
is robots writing notes for other robots.

## What's in it

The wiki covers the same ground as my recent blog posts but organized
by topic rather than chronology:

- **AI Tools**: Claude Code, OpenCode, OpenRouter, local LLMs, image gen
- **MCP Integrations**: Playwright, Linear, GA4
- **OpenClaw**: the agent, its skills, Kubernetes security
- **DevOps**: security toolkit, lint toolkit, Ruler
- **Blog Architecture**: how this site is built, the markdown pipeline,
  testing setup

Each page has frontmatter designed for machine consumption:

```yaml
title: "Claude Code"
summary: "CLI AI coding assistant by Anthropic with MCP support"
keywords:
  - claude-code
  - anthropic
  - mcp
related:
  - wiki/ai-tools/opencode
  - playwright-mcp
scope: "Setup, config, MCP integration, and usage patterns"
last_verified: 2026-03-10
```

The `summary` and `scope` fields help a RAG system decide whether to
retrieve the full page. The `keywords` list feeds embedding search.
The `related` links let an agent traverse the knowledge graph.
`last_verified` tells the agent how stale the content might be.

## How this connects to RAG

This is step one of a larger plan. Next I'm building a RAG pipeline
that indexes the wiki content, generates embeddings, and lets agents
query it during conversations. The wiki's structured metadata makes
chunking and retrieval much cleaner than trying to RAG over blog
posts directly.

The directory structure maps to the URL structure which maps to the
knowledge hierarchy. An agent asking about MCP servers gets pointed
to `wiki/mcp/` and its children, not to a 2000-word blog post that
mentions MCP in passing.

## How it's built

The wiki reuses the blog's existing infrastructure. A new `WikiService`
reads markdown from `markdown/wiki/` instead of `markdown/posts/`,
builds a tree from the directory structure, and generates navigation
automatically. Each `index.md` file gets a tree of its children
rendered above its own content.

The routing plugs into the same Next.js catch-all that handles blog
posts. Wiki pages get the same layout, sidebar, and responsive
behavior. They just have different content and metadata.

No images in the wiki. It's all text, all the time. Robots don't
need hero images.

You can find it at [/wiki.html](/wiki.html), or use the new Wiki
link in the header.
