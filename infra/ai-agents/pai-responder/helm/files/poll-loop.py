#!/usr/bin/env python3
"""Pai Discord responder — polls for messages, invokes Claude when triggered."""

import json
import logging
import os
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("pai-responder")

BASE_URL = "https://discord.com/api/v10"
STATE_PATH = Path(os.environ.get("STATE_PATH", "/data/state.json"))
MCP_CONFIG_PATH = Path("/tmp/mcp.json")
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL", "30"))
REVIEW_INTERVAL = int(os.environ.get("REVIEW_INTERVAL", "900"))  # 15 min
GUILD_ID = os.environ["DISCORD_GUILD_ID"]
BOT_TOKEN = os.environ["PAI_DISCORD_BOT_TOKEN"]
CLAUDE_TIMEOUT = 300  # 5 minutes
HEADERS = {
    "Authorization": f"Bot {BOT_TOKEN}",
    "Content-Type": "application/json",
}
# Text channel types: 0 = text, 5 = announcement
TEXT_CHANNEL_TYPES = {0, 5}


def load_state():
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {
        "channels": {},
        "pai_threads": [],
        "last_review_time": datetime.now(timezone.utc).isoformat(),
        "unreviewed_messages": [],
    }


def save_state(state):
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2))


def write_mcp_config():
    """Write MCP config so claude --agent pai can use pai-discord tools."""
    config = {
        "mcpServers": {
            "pai-discord": {
                "type": "stdio",
                "command": "python3",
                "args": ["/opt/discord-mcp/server.py"],
                "env": {
                    "DISCORD_BOT_TOKEN": BOT_TOKEN,
                    "DISCORD_GUILD_ID": GUILD_ID,
                },
            }
        }
    }
    MCP_CONFIG_PATH.write_text(json.dumps(config))


def discord_get(client, path, params=None):
    """Make a GET request to Discord API with rate limit handling."""
    resp = client.get(f"{BASE_URL}{path}", headers=HEADERS, params=params, timeout=30)
    if resp.status_code == 429:
        retry_after = resp.json().get("retry_after", 5)
        log.warning("Rate limited, waiting %.1fs", retry_after)
        time.sleep(retry_after)
        return discord_get(client, path, params)
    resp.raise_for_status()
    return resp.json()


def get_bot_user_id(client):
    """Get Pai's own user ID for mention detection."""
    data = discord_get(client, "/users/@me")
    return data["id"]


def get_text_channels(client):
    """Get all text channels in the guild."""
    channels = discord_get(client, f"/guilds/{GUILD_ID}/channels")
    return [c for c in channels if c.get("type") in TEXT_CHANNEL_TYPES]


def get_new_messages(client, channel_id, after=None):
    """Fetch messages newer than after_id."""
    params = {"limit": 50}
    if after:
        params["after"] = after
    return discord_get(client, f"/channels/{channel_id}/messages", params=params)


def is_mention(msg, bot_user_id):
    """Check if the message mentions Pai."""
    # Check mentions array
    for mention in msg.get("mentions", []):
        if mention.get("id") == bot_user_id:
            return True
    # Check content for raw mention
    if f"<@{bot_user_id}>" in (msg.get("content") or ""):
        return True
    # Check for name mention (case-insensitive)
    content_lower = (msg.get("content") or "").lower()
    if "pai" in content_lower.split():
        return True
    return False


def invoke_claude(prompt):
    """Invoke claude --agent pai with the given prompt."""
    log.info("Invoking Claude: %.100s...", prompt)
    cmd = [
        "claude",
        "--agent", "pai",
        "-p", prompt,
        "--allowedTools", "mcp__pai-discord__*",
        "--mcp-config", str(MCP_CONFIG_PATH),
        "--output-format", "text",
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=CLAUDE_TIMEOUT,
        )
        if result.returncode != 0:
            log.error("Claude failed (rc=%d): %s", result.returncode, result.stderr[:500])
        else:
            log.info("Claude completed: %.200s", result.stdout[:200])
    except subprocess.TimeoutExpired:
        log.error("Claude timed out after %ds", CLAUDE_TIMEOUT)


def format_message(msg):
    """Format a Discord message for Claude's prompt."""
    author = msg["author"]["username"]
    content = msg.get("content") or "[embed/attachment]"
    return f"{author}: {content}"


def build_mention_prompt(msg, context_msgs, channel_name):
    """Build prompt for an @mention or thread reply."""
    context = "\n".join(format_message(m) for m in context_msgs)
    author = msg["author"]["username"]
    content = msg.get("content") or "[embed/attachment]"
    channel_id = msg["channel_id"]
    return (
        f"You were mentioned in #{channel_name} (channel ID: {channel_id}). "
        f"Here is the recent conversation context:\n\n{context}\n\n"
        f"The message directed at you is from {author}: {content}\n\n"
        f"Respond in #{channel_name} using the Discord MCP tools."
    )


def build_review_prompt(unreviewed):
    """Build prompt for the periodic review."""
    grouped = {}
    for msg in unreviewed:
        ch = msg["channel_name"]
        grouped.setdefault(ch, []).append(msg)

    sections = []
    for ch_name, msgs in grouped.items():
        lines = [f"  {m['author']}: {m['content']}" for m in msgs]
        channel_id = msgs[0]["channel_id"]
        sections.append(f"#{ch_name} (channel ID: {channel_id}):\n" + "\n".join(lines))

    summary = "\n\n".join(sections)
    return (
        "Here are recent messages across Discord channels that were not directed at you. "
        "Review them and decide if any warrant a response from you. "
        "If none need a response, do nothing — do not send any messages. "
        "Only respond if you have something genuinely useful to add.\n\n"
        f"{summary}"
    )


def main():
    state = load_state()
    write_mcp_config()

    with httpx.Client() as client:
        bot_user_id = get_bot_user_id(client)
        log.info("Pai bot user ID: %s", bot_user_id)

        while True:
            try:
                channels = get_text_channels(client)
                now = datetime.now(timezone.utc)

                for channel in channels:
                    ch_id = channel["id"]
                    ch_name = channel.get("name", ch_id)
                    last_id = state["channels"].get(ch_id, {}).get("last_message_id")

                    messages = get_new_messages(client, ch_id, after=last_id)
                    if not messages:
                        continue

                    # Messages come newest-first, reverse for chronological
                    messages.reverse()

                    # Update last seen
                    state["channels"][ch_id] = {
                        "last_message_id": messages[-1]["id"],
                        "name": ch_name,
                    }

                    for msg in messages:
                        # Skip bot messages
                        if msg["author"].get("bot", False):
                            continue

                        if is_mention(msg, bot_user_id):
                            # Immediate response to @mention
                            context = get_new_messages(client, ch_id)
                            context.reverse()
                            invoke_claude(build_mention_prompt(msg, context[-10:], ch_name))
                            # Track thread if this is a thread
                            if channel.get("type") == 11:  # thread
                                if ch_id not in state["pai_threads"]:
                                    state["pai_threads"].append(ch_id)

                        elif ch_id in state["pai_threads"]:
                            # Reply in a thread Pai is in
                            context = get_new_messages(client, ch_id)
                            context.reverse()
                            invoke_claude(build_mention_prompt(msg, context[-10:], ch_name))

                        else:
                            # Buffer for periodic review
                            state["unreviewed_messages"].append({
                                "channel_id": ch_id,
                                "channel_name": ch_name,
                                "message_id": msg["id"],
                                "author": msg["author"]["username"],
                                "content": msg.get("content") or "[embed/attachment]",
                                "timestamp": msg.get("timestamp", ""),
                            })

                # Also check active threads for replies
                try:
                    threads_data = discord_get(client, f"/guilds/{GUILD_ID}/threads/active")
                    for thread in threads_data.get("threads", []):
                        t_id = thread["id"]
                        if t_id not in state["pai_threads"]:
                            continue
                        t_name = thread.get("name", t_id)
                        last_id = state["channels"].get(t_id, {}).get("last_message_id")
                        messages = get_new_messages(client, t_id, after=last_id)
                        if not messages:
                            continue
                        messages.reverse()
                        state["channels"][t_id] = {
                            "last_message_id": messages[-1]["id"],
                            "name": t_name,
                        }
                        for msg in messages:
                            if msg["author"].get("bot", False):
                                continue
                            context = get_new_messages(client, t_id)
                            context.reverse()
                            invoke_claude(build_mention_prompt(msg, context[-10:], t_name))
                except Exception:
                    log.warning("Failed to check threads", exc_info=True)

                # Periodic review
                last_review = datetime.fromisoformat(state["last_review_time"])
                if (now - last_review).total_seconds() >= REVIEW_INTERVAL:
                    if state["unreviewed_messages"]:
                        log.info(
                            "Periodic review: %d unreviewed messages",
                            len(state["unreviewed_messages"]),
                        )
                        invoke_claude(build_review_prompt(state["unreviewed_messages"]))
                    state["unreviewed_messages"] = []
                    state["last_review_time"] = now.isoformat()

                # Cap pai_threads list to prevent unbounded growth
                state["pai_threads"] = state["pai_threads"][-50:]
                # Cap unreviewed buffer
                state["unreviewed_messages"] = state["unreviewed_messages"][-100:]

                save_state(state)

            except Exception:
                log.error("Poll cycle failed", exc_info=True)

            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
