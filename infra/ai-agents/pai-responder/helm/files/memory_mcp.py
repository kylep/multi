#!/usr/bin/env python3
"""MCP server exposing Pai's persistent memory to Claude."""

import os

from mcp.server.fastmcp import FastMCP
from memory_store import MemoryStore

MEMORY_PATH = os.environ.get("MEMORY_PATH", "/data/memory.json")
store = MemoryStore(MEMORY_PATH)
mcp = FastMCP("pai-memory")


@mcp.tool()
async def memory_save(key: str, content: str, context: str = "") -> str:
    """Save a memory for later recall.

    Args:
        key: Category key (e.g. 'user:pericak', 'preference', 'fact').
        content: The information to remember.
        context: Optional context about when/why this was saved.
    """
    store.add(key, content, context)
    return f"Saved memory under key '{key}'."


@mcp.tool()
async def memory_search(query: str, limit: int = 5) -> str:
    """Search memories by keyword.

    Args:
        query: Keywords to search for.
        limit: Maximum results to return.
    """
    results = store.search(query, limit)
    if not results:
        return "No memories found."
    lines = []
    for r in results:
        lines.append(f"[{r['key']}] {r['content']}")
        if r.get("context"):
            lines.append(f"  context: {r['context']}")
        lines.append(f"  saved: {r['ts']}")
    return "\n".join(lines)


@mcp.tool()
async def memory_delete(key: str) -> str:
    """Delete all memories with the given key.

    Args:
        key: The category key to delete.
    """
    store.delete(key)
    return f"Deleted memories with key '{key}'."


@mcp.tool()
async def memory_list() -> str:
    """List all memory category keys."""
    keys = store.list_keys()
    if not keys:
        return "No memories stored."
    return "Memory keys: " + ", ".join(keys)


if __name__ == "__main__":
    mcp.run(transport="stdio")
