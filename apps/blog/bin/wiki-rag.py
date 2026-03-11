#!/usr/bin/env python3
"""Build and query a FAISS index over the bot-wiki pages."""

import argparse
import json
import os
import sys
from pathlib import Path

import faiss
import numpy as np
import yaml
from openai import OpenAI

SCRIPT_DIR = Path(__file__).resolve().parent
BLOG_DIR = SCRIPT_DIR.parent / "blog"
WIKI_DIR = BLOG_DIR / "markdown" / "wiki"
INDEX_DIR = WIKI_DIR / ".index"
INDEX_FILE = INDEX_DIR / "faiss.index"
METADATA_FILE = INDEX_DIR / "metadata.json"

EMBEDDING_MODEL = "openai/text-embedding-3-small"
DEFAULT_CHAT_MODEL = "anthropic/claude-sonnet-4-6"


def get_client():
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY environment variable not set.")
        sys.exit(1)
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )


def parse_wiki_page(filepath):
    """Parse a wiki markdown file into frontmatter + body."""
    text = filepath.read_text()
    if not text.strip().startswith("---"):
        return None
    # Split on the second --- to get frontmatter and body
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None
    meta = yaml.safe_load(parts[1])
    body = parts[2].strip()
    return {"meta": meta, "body": body}


def build_chunk_text(meta, body):
    """Build the text to embed: frontmatter fields + body."""
    keywords = ", ".join(meta.get("keywords", []))
    lines = [
        f"Title: {meta.get('title', '')}",
        f"Summary: {meta.get('summary', '')}",
        f"Keywords: {keywords}",
        f"Scope: {meta.get('scope', '')}",
        "",
        body,
    ]
    return "\n".join(lines)


def collect_wiki_pages():
    """Walk the wiki directory and collect all pages."""
    pages = []
    for md_file in sorted(WIKI_DIR.rglob("*.md")):
        # Skip anything in .index/
        if ".index" in md_file.parts:
            continue
        parsed = parse_wiki_page(md_file)
        if not parsed:
            continue
        rel = md_file.relative_to(WIKI_DIR)
        # Build slug: wiki/ai-tools/claude-code from
        # ai-tools/claude-code.md (or ai-tools/index.md -> ai-tools)
        slug_parts = list(rel.parts)
        if slug_parts[-1] == "index.md":
            slug_parts = slug_parts[:-1]
        else:
            slug_parts[-1] = slug_parts[-1].replace(".md", "")
        slug = "wiki/" + "/".join(slug_parts) if slug_parts else "wiki"
        chunk_text = build_chunk_text(parsed["meta"], parsed["body"])
        pages.append({
            "slug": slug,
            "title": parsed["meta"].get("title", ""),
            "summary": parsed["meta"].get("summary", ""),
            "text": chunk_text,
        })
    return pages


def cmd_build(args):
    """Build the FAISS index from wiki pages."""
    pages = collect_wiki_pages()
    if not pages:
        print("No wiki pages found.")
        sys.exit(1)

    if args.dry_run:
        for p in pages:
            print(f"--- {p['slug']} ({p['title']}) ---")
            print(p["text"][:200] + "...")
            print()
        print(f"Total: {len(pages)} pages (dry run, no API calls)")
        return

    client = get_client()
    print(f"Embedding {len(pages)} wiki pages...")
    texts = [p["text"] for p in pages]
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )

    dim = len(response.data[0].embedding)
    vectors = np.array(
        [d.embedding for d in response.data], dtype=np.float32
    )
    # Normalize for cosine similarity via inner product
    faiss.normalize_L2(vectors)
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_FILE))

    metadata = [
        {"slug": p["slug"], "title": p["title"],
         "summary": p["summary"], "text": p["text"]}
        for p in pages
    ]
    METADATA_FILE.write_text(json.dumps(metadata, indent=2))

    index_size = INDEX_FILE.stat().st_size
    meta_size = METADATA_FILE.stat().st_size
    total_tokens = getattr(response, "usage", None)
    token_str = ""
    if total_tokens:
        token_str = f", {total_tokens.total_tokens} tokens"
    print(f"Indexed {len(pages)} pages, {dim} dimensions{token_str}")
    print(f"Index: {index_size:,} bytes, metadata: {meta_size:,} bytes")
    print(f"Saved to {INDEX_DIR}")


def cmd_query(args):
    """Query the FAISS index and generate an answer."""
    if not INDEX_FILE.exists() or not METADATA_FILE.exists():
        print("Index not found. Run 'build' first.")
        sys.exit(1)

    index = faiss.read_index(str(INDEX_FILE))
    metadata = json.loads(METADATA_FILE.read_text())
    question = " ".join(args.question)

    client = get_client()

    # Embed the query
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[question],
    )
    query_vec = np.array(
        [response.data[0].embedding], dtype=np.float32
    )
    faiss.normalize_L2(query_vec)

    # Search
    k = min(args.top_k, index.ntotal)
    scores, indices = index.search(query_vec, k)

    print(f"Question: {question}")
    print(f"\nTop {k} matches:")
    retrieved = []
    for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
        page = metadata[idx]
        print(f"  {i+1}. [{score:.3f}] {page['title']} ({page['slug']})")
        retrieved.append(page)

    # Build context for LLM
    context_parts = []
    for page in retrieved:
        context_parts.append(
            f"[Page: {page['title']}] ({page['slug']})\n"
            f"{page['text']}"
        )
    context = "\n---\n".join(context_parts)

    prompt = (
        "You are answering questions using a knowledge base about "
        "Kyle Pericak's projects and tools. Use only the provided "
        "context to answer. If the context doesn't contain enough "
        "information, say so. Cite the source pages by title.\n\n"
        f"Context:\n---\n{context}\n---\n\n"
        f"Question: {question}"
    )

    print(f"\nGenerating answer with {args.model}...")
    chat = client.chat.completions.create(
        model=args.model,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = chat.choices[0].message.content

    print(f"\nAnswer:\n{answer}")
    print("\nSources:")
    for page in retrieved:
        print(f"  - {page['title']} (/{page['slug']}.html)")


def main():
    parser = argparse.ArgumentParser(
        description="Build and query a FAISS index over bot-wiki pages."
    )
    sub = parser.add_subparsers(dest="command")

    build_p = sub.add_parser("build", help="Build the FAISS index")
    build_p.add_argument(
        "--dry-run", action="store_true",
        help="Parse pages without calling the API",
    )

    query_p = sub.add_parser("query", help="Query the index")
    query_p.add_argument("question", nargs="+", help="Question to ask")
    query_p.add_argument(
        "--top-k", type=int, default=3,
        help="Number of results to retrieve (default: 3)",
    )
    query_p.add_argument(
        "--model", default=DEFAULT_CHAT_MODEL,
        help=f"Chat model for generation (default: {DEFAULT_CHAT_MODEL})",
    )

    args = parser.parse_args()
    if args.command == "build":
        cmd_build(args)
    elif args.command == "query":
        cmd_query(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
