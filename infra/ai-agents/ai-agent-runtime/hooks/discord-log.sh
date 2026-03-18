#!/usr/bin/env bash
# PostToolUse hook: post tool call summary to Discord #log and stdout.
# Runs async (fire-and-forget). Always exits 0 to never block the agent.
# Requires: DISCORD_BOT_TOKEN, DISCORD_LOG_CHANNEL_ID env vars.
# Optional: RUN_ID env var for correlation with controller messages.

set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')

# Skip noisy read-only tools
case "$TOOL" in
  Read|Glob|Grep|ToolSearch) exit 0 ;;
esac

# Extract brief summary of input
case "$TOOL" in
  Bash)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.command // ""' | head -c 100) ;;
  Edit|Write)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' | head -c 100) ;;
  Agent)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.description // .tool_input.prompt // ""' | head -c 100) ;;
  mcp__*)
    PARAM=$(echo "$INPUT" | jq -c '.tool_input' 2>/dev/null | head -c 80) ;;
  *)
    PARAM=$(echo "$INPUT" | jq -c '.tool_input' 2>/dev/null | head -c 80) ;;
esac

RID="${RUN_ID:-????}"
SESSION_SHORT=$(echo "$INPUT" | jq -r '.session_id // ""' | cut -c1-8)
MSG=$(printf '🔧 `%s` | **%s** | `%s` | %s' "$RID" "$TOOL" "$SESSION_SHORT" "$PARAM")

# Always log to stdout (→ pod logs via stream-json)
echo "[hook] $TOOL | $SESSION_SHORT | $PARAM"

# Bail if Discord not configured
[ -z "${DISCORD_BOT_TOKEN:-}" ] && exit 0
[ -z "${DISCORD_LOG_CHANNEL_ID:-}" ] && exit 0

# Throttle: skip if last post was <1.2s ago (Discord limit: 5 msg / 5s)
LOCKFILE="/tmp/discord-hook-ts"
NOW=$(date +%s%N 2>/dev/null || date +%s)
if [ -f "$LOCKFILE" ]; then
  LAST=$(cat "$LOCKFILE" 2>/dev/null || echo 0)
  DIFF=$(( (NOW - LAST) / 1000000 ))
  if [ "$DIFF" -lt 1200 ] && [ "$DIFF" -ge 0 ]; then
    exit 0
  fi
fi
echo "$NOW" > "$LOCKFILE"

# Post to Discord (timeout 5s, fire-and-forget)
curl -s -m 5 \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg c "$MSG" '{content: $c, flags: 4}')" \
  "https://discord.com/api/v10/channels/$DISCORD_LOG_CHANNEL_ID/messages" \
  >/dev/null 2>&1 || true

exit 0
