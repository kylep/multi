---
title: "Discord MCP Server"
summary: "Custom MCP server exposing Discord bot operations as tools for Claude Code agents."
keywords:
  - discord
  - mcp
  - bot
  - mcp-server
related:
  - wiki/custom-tools/index.html
  - wiki/agent-team/journalist.html
scope: "Discord MCP server: architecture, setup, tool reference, and Claude Code integration."
last_verified: 2026-03-15
---

A Python MCP server that exposes Discord bot operations as tools.
Any Claude Code agent with this MCP configured can read and write
Discord messages, manage threads, and react — all through standard
MCP tool calls over stdio.

Source: `apps/mcp-servers/discord/`

## Architecture

```
Claude Code agent
    ↕ stdio (MCP protocol)
discord MCP server (Python, httpx)
    ↕ HTTPS REST
Discord API v10
```

No websocket gateway, no open ports. The server makes outbound REST
calls to Discord's API on each tool invocation.

## Prerequisites

1. A Discord Application with a Bot user (created at
   [discord.com/developers/applications](https://discord.com/developers/applications))
2. Bot token (from Bot tab → Reset Token)
3. **Message Content Intent** enabled (Bot tab → Privileged Gateway Intents)
4. Bot invited to your server via OAuth2 URL (see below)

## Setup

### 1. Create the Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, give it a name
3. Go to **Bot** tab → click **Reset Token** → copy the token
4. Under **Privileged Gateway Intents**, enable **Message Content Intent**

### 2. Generate the OAuth2 invite URL

1. Go to **Installation** (or **OAuth2 → URL Generator**)
2. Under **Scopes**, check: **bot**
3. Under **Bot Permissions**, check these:

**General Permissions:**
- View Channels

**Text Permissions:**
- Send Messages
- Create Public Threads
- Manage Messages
- Read Message History
- Add Reactions
- Embed Links

4. Copy the generated URL at the bottom of the page
5. Open it in a browser and select your Discord server

### 3. Install dependencies

```bash
cd apps/mcp-servers/discord
python3 -m venv .venv
.venv/bin/pip install "mcp[cli]>=1.2.0" "httpx>=0.27.0"
```

### 4. Register in Claude Code

Use `claude mcp add` to register the server at project scope:

```bash
claude mcp add discord \
  -s project \
  -e DISCORD_BOT_TOKEN="your-bot-token" \
  -e DISCORD_GUILD_ID="your-server-id" \
  -- /path/to/apps/mcp-servers/discord/.venv/bin/python \
     /path/to/apps/mcp-servers/discord/server.py
```

This writes the config to `.mcp.json` in the project root.

To find your guild (server) ID: open Discord → right-click your
server name → Copy Server ID. (Requires Developer Mode enabled
in Discord Settings → Advanced.)

### 5. Verify

Restart Claude Code and check for `mcp__discord__*` tools in the
available tools list. Run `list_guilds` to confirm the bot can
see your server.

## Tool reference

| Tool | Description |
|------|-------------|
| `list_guilds` | List servers the bot has joined |
| `list_channels` | List text channels in a guild |
| `get_channel_info` | Get details about a channel |
| `send_message` | Send a message (max 2000 chars) |
| `read_messages` | Read recent messages (1-100) |
| `reply_to_message` | Reply to a specific message |
| `edit_message` | Edit a bot-sent message |
| `delete_message` | Delete a message |
| `add_reaction` | React with an emoji |
| `create_thread` | Start a thread from a message |
| `list_threads` | List active threads in a channel |
| `search_messages` | Search recent messages by text |
| `send_embed` | Send a rich embed with title, description, color |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_GUILD_ID` | No | Default guild ID for `list_channels` |

## Security notes

- The bot token is a secret — store it in the `env` block of the
  MCP config, not in source code or shell profiles.
- The server makes only outbound HTTPS requests. No ports are opened.
- The bot can only act in servers it has been invited to, with the
  permissions granted during the OAuth2 invite flow.
