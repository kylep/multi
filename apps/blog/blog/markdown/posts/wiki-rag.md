---
title: "RAG on the Bot-Wiki"
summary: Building a FAISS retrieval pipeline over the wiki
  using OpenRouter embeddings.
slug: wiki-rag
category: ai
tags: RAG, FAISS, OpenRouter, embeddings, Bot-Wiki, Python
date: 2026-03-10
modified: 2026-03-10
status: published
image: wiki-rag.png
thumbnail: wiki-rag-thumb.png
imgprompt: A cartoon robot sitting at a desk with magnifying
  glass, examining floating documents that connect with
  glowing lines, warm library setting, flat illustration
  style with soft gradients, bookshelves in background
---

The [bot-wiki post](/bot-wiki.html) introduced a structured wiki
designed for machine consumption. The whole point was to build
something a RAG pipeline could actually use. This is that pipeline.

## The stack

The wiki has 21 markdown pages with structured frontmatter:
title, summary, keywords, scope. The RAG pipeline is a single
Python script that:

1. Embeds all 21 pages into vectors using OpenRouter's API
2. Stores them in a FAISS flat index (129 KB, committed to git)
3. At query time, embeds the question, finds the nearest pages,
   and feeds them to an LLM for a grounded answer

Dependencies: `faiss-cpu`, `openai` (for the OpenAI-compatible
API), and `pyyaml`. That's it.

## Why whole-page chunks

The wiki pages are short, 18 to 65 lines each. Splitting them
by section would lose context without gaining anything. The
frontmatter was designed to enrich embeddings, so each chunk
looks like this:

```
Title: Claude Code
Summary: Anthropic's CLI-based AI coding assistant. Runs
  in terminal, edits files directly, supports MCP tool
  integrations and custom hooks.
Keywords: claude-code, anthropic, cli, ai-coding-assistant,
  mcp, hooks
Scope: Covers Claude Code setup, configuration, MCP
  integration, hooks, and usage patterns.

Claude Code is Anthropic's CLI tool for AI-assisted software
engineering. It operates directly in the terminal...
```

Prepending the summary, keywords, and scope to the body gives
the embedding model more signal about what the page covers.
21 chunks, 5,434 tokens total.

## Building the index

```bash
pip install -r bin/requirements-rag.txt
python bin/wiki-rag.py build
```

```
Embedding 21 wiki pages...
Indexed 21 pages, 1536 dimensions, 5434 tokens
Index: 129,069 bytes, metadata: 29,663 bytes
Saved to blog/markdown/wiki/.index
```

The embedding model is `text-embedding-3-small` via OpenRouter.
1536 dimensions per vector. The FAISS index uses `IndexFlatIP`
(inner product on normalized vectors = cosine similarity). No
approximate search needed at this scale.

The index and a `metadata.json` file (slug, title, summary,
full chunk text for each page) get saved to
`blog/markdown/wiki/.index/`. Both files are committed to git.
Any tool that wants to query the wiki can just read the index
directly without needing the embedding API.

The build is a manual step, not part of `npm run build`. Wiki
content doesn't change often, and there's no reason to pay for
embeddings on every deploy.

## Querying

```bash
python bin/wiki-rag.py query "What MCP servers does this
  project use?"
```

```
Question: What MCP servers does this project use?

Top 3 matches:
  1. [0.644] MCP Integrations (wiki/mcp)
  2. [0.563] Linear MCP (wiki/mcp/linear)
  3. [0.524] GA4 MCP (wiki/mcp/ga4)

Answer:
Based on the provided context, this project uses three MCP
servers:

1. Playwright, for browser automation
2. Linear, for project management
3. GA4, for accessing website traffic data and reports

All MCP servers run as subprocesses communicating via JSON-RPC
over stdio, and are configured in ~/.claude.json or a
project-level .claude.json file.
```

The retrieval nailed the right pages. Here's a different query:

```bash
python bin/wiki-rag.py query "How do I run security scans?"
```

```
Question: How do I run security scans?

Top 3 matches:
  1. [0.484] Security Toolkit (wiki/devops/security-toolkit)
  2. [0.439] DevOps & Security (wiki/devops)
  3. [0.343] OpenClaw Kubernetes Security (wiki/openclaw/kubernetes)
```

The answer included the actual docker commands from the security
toolkit wiki page, copy-paste ready. The third result
(Kubernetes security) is a reasonable stretch, the word
"security" overlaps, but the top two are exactly right.

## The script

The interesting parts are small. Embedding is a single API call
since all 21 pages fit in one batch:

```python
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ["OPENROUTER_API_KEY"],
)
response = client.embeddings.create(
    model="openai/text-embedding-3-small",
    input=texts,
)
```

OpenRouter's embedding endpoint is OpenAI-compatible, so the
`openai` Python package works with just a base URL swap.

FAISS search returns similarity scores and indices:

```python
scores, indices = index.search(query_vec, k)
for score, idx in zip(scores[0], indices[0]):
    page = metadata[idx]
    # score is cosine similarity (0 to 1)
```

The retrieved pages get stuffed into a prompt with instructions
to only use the provided context and cite sources. The LLM
(Claude Sonnet via OpenRouter) generates the answer.

## Cost

Indexing 21 pages used 5,434 tokens at
`text-embedding-3-small` rates ($0.02/1M tokens). That's
$0.0001. Each query embeds a short question (maybe 20 tokens)
plus one chat completion. A query costs roughly $0.002 to
$0.01 depending on the response length.

## What's next

The index is committed to git, so any tool can read it. Next
steps would be wiring this into Claude Code as an MCP tool
(so it can search the wiki during a session) or giving OpenClaw
a skill that queries it via Telegram. The wiki keeps growing
as I document more of the ecosystem, and rebuilding the index
is one command.
