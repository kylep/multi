#!/usr/bin/env bash
# Unlock Bitwarden and start the MCP server with the session token
set -e
source ~/gh/multi/apps/blog/exports.sh
BW_SESSION=$(echo "$BITWARDEN_PASSWORD" | bw unlock --raw 2>/dev/null)
export BW_SESSION
exec node /Users/pai/gh/multi/apps/mcp-servers/bitwarden/build/index.js
