---
title: "Wiki RAG Pipeline"
summary: "FAISS-based retrieval pipeline over the bot-wiki. Embeds all wiki pages via OpenRouter, stores a flat index in git, answers questions with grounded LLM responses."
keywords:
  - rag
  - faiss
  - embeddings
  - openrouter
  - vector-search
related:
  - wiki/ai-tools/openrouter
  - wiki/blog-architecture
scope: "Covers the wiki-rag.py script, index build/query workflow, and FAISS index location. Does not cover RAG theory or other vector databases."
last_verified: 2026-03-11
---


The bot-wiki has a FAISS retrieval pipeline that embeds all wiki pages
and answers questions using the retrieved context.

## Components

- **Script**: `apps/blog/bin/wiki-rag.py`
- **Dependencies**: `apps/blog/bin/requirements-rag.txt` (faiss-cpu, openai, pyyaml)
- **Index**: `apps/blog/blog/markdown/wiki/.index/faiss.index`
- **Metadata**: `apps/blog/blog/markdown/wiki/.index/metadata.json`
- **Venv**: `apps/blog/.venv/` (gitignored)

## Setup

```bash
cd apps/blog
python3 -m venv .venv
.venv/bin/pip install -r bin/requirements-rag.txt
```

The venv is gitignored. All wiki-rag commands must use the venv python.

## Building the index

```bash
cd apps/blog
.venv/bin/python bin/wiki-rag.py build
```

Embeds all wiki pages using `text-embedding-3-small` via OpenRouter.
Requires `OPENROUTER_API_KEY` env var. Saves a FAISS `IndexFlatIP`
(cosine similarity via normalized inner product) and a metadata JSON
file. Both are committed to git.

Use `--dry-run` to parse pages without calling the API.

## Querying

```bash
.venv/bin/python bin/wiki-rag.py query "How do I run security scans?"
```

Embeds the question, finds the top-k nearest wiki pages (default 3),
then sends them as context to an LLM (Claude Sonnet via OpenRouter)
for a grounded answer.

Flags:
- `--top-k N`: number of pages to retrieve (default 3)
- `--model MODEL`: chat model for generation (default `anthropic/claude-sonnet-4-6`)

## How it works

Each wiki page becomes one chunk. The embedded text prepends frontmatter
fields (title, summary, keywords, scope) to the markdown body. This
gives the embedding model more signal about what the page covers.

Vectors are L2-normalized before indexing so inner product equals
cosine similarity. At query time the question is embedded with the
same model, FAISS returns the closest pages, and those pages get
stuffed into an LLM prompt.

## Related Blog Posts

- [RAG on the Bot-Wiki](/wiki-rag.html): full writeup with real
  query output and cost breakdown
- [The Bot-Wiki](/bot-wiki.html): why the wiki exists and how
  the structured frontmatter was designed for RAG
