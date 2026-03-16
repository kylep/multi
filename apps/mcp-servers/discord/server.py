"""Discord MCP Server — exposes Discord bot operations as MCP tools.

Env vars:
  DISCORD_BOT_TOKEN  — required, the bot token from Discord Developer Portal
  DISCORD_GUILD_ID   — optional, default guild to scope channel listings
"""

import os
import sys
import logging
import urllib.parse
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger("discord-mcp")

BASE_URL = "https://discord.com/api/v10"
USER_AGENT = "DiscordBot (https://github.com/kpericak, 1.0)"

mcp = FastMCP("discord")


def _get_token() -> str:
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        raise RuntimeError("DISCORD_BOT_TOKEN environment variable is not set")
    return token


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bot {_get_token()}",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
    }


async def _request(
    method: str, path: str, json: dict | None = None, params: dict | None = None
) -> dict[str, Any] | list[Any] | str:
    """Make a request to the Discord REST API."""
    url = f"{BASE_URL}{path}"
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method, url, headers=_headers(), json=json, params=params, timeout=30.0
        )
        if resp.status_code == 204:
            return "Success (204 No Content)"
        if not resp.is_success:
            raise RuntimeError(f"Discord API error {resp.status_code}: {resp.text}")
        return resp.json()


# ── Guild / Server tools ─────────────────────────────────────────────

@mcp.tool()
async def list_guilds() -> str:
    """List Discord servers (guilds) the bot has joined."""
    data = await _request("GET", "/users/@me/guilds")
    if not data:
        return "Bot has not joined any servers."
    lines = []
    for g in data:
        lines.append(f"- {g['name']}  (id: {g['id']})")
    return "\n".join(lines)


@mcp.tool()
async def list_channels(guild_id: str = "") -> str:
    """List text channels in a guild.

    Args:
        guild_id: The guild/server ID. Falls back to DISCORD_GUILD_ID env var.
    """
    gid = guild_id or os.environ.get("DISCORD_GUILD_ID", "")
    if not gid:
        return "Provide a guild_id or set DISCORD_GUILD_ID."
    data = await _request("GET", f"/guilds/{gid}/channels")
    text_channels = [c for c in data if c.get("type") in (0, 5)]  # text + announcement
    if not text_channels:
        return "No text channels found."
    text_channels.sort(key=lambda c: c.get("position", 0))
    lines = []
    for c in text_channels:
        lines.append(f"- #{c['name']}  (id: {c['id']})")
    return "\n".join(lines)


@mcp.tool()
async def get_channel_info(channel_id: str) -> str:
    """Get details about a specific channel.

    Args:
        channel_id: The channel ID.
    """
    c = await _request("GET", f"/channels/{channel_id}")
    parts = [
        f"Name: #{c.get('name', 'DM')}",
        f"ID: {c['id']}",
        f"Type: {c.get('type')}",
    ]
    if c.get("topic"):
        parts.append(f"Topic: {c['topic']}")
    if c.get("guild_id"):
        parts.append(f"Guild ID: {c['guild_id']}")
    return "\n".join(parts)


# ── Message tools ─────────────────────────────────────────────────────

@mcp.tool()
async def send_message(channel_id: str, content: str) -> str:
    """Send a message to a Discord channel.

    Args:
        channel_id: The channel ID to send to.
        content: The message text (max 2000 chars).
    """
    if len(content) > 2000:
        return "Error: message exceeds 2000 character limit."
    data = await _request("POST", f"/channels/{channel_id}/messages", json={"content": content})
    return f"Sent message {data['id']} in #{channel_id}"


@mcp.tool()
async def read_messages(channel_id: str, limit: int = 10) -> str:
    """Read recent messages from a Discord channel.

    Args:
        channel_id: The channel ID to read from.
        limit: Number of messages to fetch (1-100, default 10).
    """
    limit = max(1, min(100, limit))
    data = await _request("GET", f"/channels/{channel_id}/messages", params={"limit": limit})
    if not data:
        return "No messages found."
    lines = []
    for msg in reversed(data):  # oldest first
        author = msg["author"]["username"]
        content = msg["content"] or "[embed/attachment]"
        msg_id = msg["id"]
        lines.append(f"[{msg_id}] {author}: {content}")
    return "\n".join(lines)


@mcp.tool()
async def reply_to_message(channel_id: str, message_id: str, content: str) -> str:
    """Reply to a specific message in a channel.

    Args:
        channel_id: The channel ID.
        message_id: The message ID to reply to.
        content: The reply text (max 2000 chars).
    """
    if len(content) > 2000:
        return "Error: message exceeds 2000 character limit."
    data = await _request(
        "POST",
        f"/channels/{channel_id}/messages",
        json={
            "content": content,
            "message_reference": {"message_id": message_id},
        },
    )
    return f"Replied with message {data['id']}"


@mcp.tool()
async def edit_message(channel_id: str, message_id: str, content: str) -> str:
    """Edit a message the bot previously sent.

    Args:
        channel_id: The channel ID.
        message_id: The message ID to edit.
        content: The new message text (max 2000 chars).
    """
    if len(content) > 2000:
        return "Error: message exceeds 2000 character limit."
    await _request(
        "PATCH",
        f"/channels/{channel_id}/messages/{message_id}",
        json={"content": content},
    )
    return f"Edited message {message_id}"


@mcp.tool()
async def delete_message(channel_id: str, message_id: str) -> str:
    """Delete a message. The bot can only delete its own messages or messages in channels where it has MANAGE_MESSAGES.

    Args:
        channel_id: The channel ID.
        message_id: The message ID to delete.
    """
    await _request("DELETE", f"/channels/{channel_id}/messages/{message_id}")
    return f"Deleted message {message_id}"


@mcp.tool()
async def add_reaction(channel_id: str, message_id: str, emoji: str) -> str:
    """Add a reaction to a message.

    Args:
        channel_id: The channel ID.
        message_id: The message ID to react to.
        emoji: The emoji to react with (e.g. a unicode emoji or custom format name:id).
    """
    encoded = urllib.parse.quote(emoji)
    await _request("PUT", f"/channels/{channel_id}/messages/{message_id}/reactions/{encoded}/@me")
    return f"Reacted with {emoji}"


# ── Thread tools ──────────────────────────────────────────────────────

@mcp.tool()
async def create_thread(channel_id: str, message_id: str, name: str) -> str:
    """Create a thread from an existing message.

    Args:
        channel_id: The channel ID containing the message.
        message_id: The message ID to start the thread from.
        name: Thread name (1-100 chars).
    """
    data = await _request(
        "POST",
        f"/channels/{channel_id}/messages/{message_id}/threads",
        json={"name": name[:100]},
    )
    return f"Created thread '{data['name']}' (id: {data['id']})"


@mcp.tool()
async def list_threads(channel_id: str) -> str:
    """List active threads in a channel.

    Args:
        channel_id: The channel ID.
    """
    # Get guild ID from channel first
    channel = await _request("GET", f"/channels/{channel_id}")
    guild_id = channel.get("guild_id")
    if not guild_id:
        return "Cannot list threads for this channel type."
    data = await _request("GET", f"/guilds/{guild_id}/threads/active")
    threads = [t for t in data.get("threads", []) if t.get("parent_id") == channel_id]
    if not threads:
        return "No active threads."
    lines = []
    for t in threads:
        lines.append(f"- {t['name']}  (id: {t['id']})")
    return "\n".join(lines)


# ── Search tool ───────────────────────────────────────────────────────

@mcp.tool()
async def search_messages(
    channel_id: str, query: str, limit: int = 25
) -> str:
    """Search messages in a channel by content. Fetches recent messages and filters locally.

    Args:
        channel_id: The channel ID to search.
        query: Text to search for (case-insensitive).
        limit: How many recent messages to scan (max 100, default 25).
    """
    limit = max(1, min(100, limit))
    data = await _request("GET", f"/channels/{channel_id}/messages", params={"limit": limit})
    query_lower = query.lower()
    matches = [
        msg for msg in data
        if query_lower in (msg.get("content") or "").lower()
    ]
    if not matches:
        return f"No messages matching '{query}' in last {limit} messages."
    lines = []
    for msg in reversed(matches):
        author = msg["author"]["username"]
        content = msg["content"]
        lines.append(f"[{msg['id']}] {author}: {content}")
    return "\n".join(lines)


# ── Send embed tool ──────────────────────────────────────────────────

@mcp.tool()
async def send_embed(
    channel_id: str,
    title: str,
    description: str,
    color: int = 0x5865F2,
    url: str = "",
) -> str:
    """Send a rich embed message to a channel.

    Args:
        channel_id: The channel ID to send to.
        title: Embed title.
        description: Embed description/body text.
        color: Embed sidebar color as integer (default: Discord blurple 0x5865F2).
        url: Optional URL to link the title to.
    """
    embed: dict[str, Any] = {
        "title": title,
        "description": description,
        "color": color,
    }
    if url:
        embed["url"] = url
    data = await _request(
        "POST",
        f"/channels/{channel_id}/messages",
        json={"embeds": [embed]},
    )
    return f"Sent embed message {data['id']}"


if __name__ == "__main__":
    mcp.run()
