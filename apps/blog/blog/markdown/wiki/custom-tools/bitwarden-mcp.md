---
title: "Bitwarden MCP Server"
summary: "Custom MCP server wrapping the Bitwarden CLI for vault management. List, create, edit, and delete passwords."
keywords:
  - bitwarden
  - mcp
  - mcp-server
  - passwords
  - vault
related:
  - wiki/custom-tools
scope: "Bitwarden MCP server: tools, setup, and vault operations."
last_verified: 2026-03-23
---

A TypeScript MCP server wrapping the [Bitwarden CLI](https://bitwarden.com/help/cli/).
Replaces the official `@bitwarden/mcp-server` package, which failed to connect
via stdio in Claude Code.

Source: `apps/mcp-servers/bitwarden/`

## Prerequisites

- Bitwarden CLI installed (`brew install bitwarden-cli` or `npm install -g @bitwarden/cli`)
- A valid `BW_SESSION` token from `bw unlock --raw`

## Setup

In `~/.claude.json` under the project's `mcpServers`:

```json
"bitwarden": {
  "type": "stdio",
  "command": "node",
  "args": ["/Users/kp/gh/multi/apps/mcp-servers/bitwarden/build/index.js"],
  "env": {
    "BW_SESSION": "<token from bw unlock --raw>"
  }
}
```

The session token is ephemeral. Re-run `bw unlock --raw` and update the
config after the vault locks.

## Tools

### list_items

List vault items with optional filtering.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| search | No | - | Search term to filter items |
| folderId | No | - | Filter by folder ID |
| collectionId | No | - | Filter by collection ID |

### get_item

Get a single vault item by ID or exact name, including its password.

| Parameter | Required | Description |
|-----------|----------|-------------|
| identifier | Yes | Item ID or exact name |

### create_item

Create a new login item.

| Parameter | Required | Description |
|-----------|----------|-------------|
| name | Yes | Item name |
| username | No | Login username |
| password | No | Login password |
| uri | No | Login URL |
| notes | No | Notes |
| folderId | No | Folder ID |

### edit_item

Edit an existing vault item. Fetches the current item, applies changes, saves.

| Parameter | Required | Description |
|-----------|----------|-------------|
| id | Yes | Item ID to edit |
| name | No | New name |
| username | No | New username |
| password | No | New password |
| uri | No | New URL (replaces existing) |
| notes | No | New notes |

### delete_item

Delete a vault item (moves to trash).

| Parameter | Required | Description |
|-----------|----------|-------------|
| id | Yes | Item ID to delete |

### generate_password

Generate a secure password.

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| length | No | 20 | Password length |
| uppercase | No | true | Include uppercase |
| lowercase | No | true | Include lowercase |
| numbers | No | true | Include numbers |
| special | No | true | Include special characters |

### list_folders

List all folders in the vault. No parameters.

### sync

Sync the local vault cache with the Bitwarden server. No parameters.

### status

Check vault status (locked/unlocked, last sync, user email). No parameters.
