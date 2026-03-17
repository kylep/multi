#!/bin/bash
set -euo pipefail

PROMPT="${1:?Usage: run-publisher.sh '<prompt>'}"
BRANCH="agent/publisher-$(date +%s)"
MAX_IDLE=120  # Kill if no output for 2 minutes (likely permission prompt)

# Validate required env vars
: "${CLAUDE_CODE_OAUTH_TOKEN:?CLAUDE_CODE_OAUTH_TOKEN is required}"

# Git identity (if not already set)
git config user.name "publisher-agent" 2>/dev/null || true
git config user.email "publisher-agent@noreply" 2>/dev/null || true

# Create branch
git checkout -b "$BRANCH"

# Prevent auth conflicts — OAuth token must be the only auth mechanism
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL

# Run publisher pipeline with idle timeout watchdog.
# stream-json outputs one JSON line per event. If nothing appears for
# MAX_IDLE seconds, the process is likely hung on a permission prompt.
PIPE=$(mktemp -u)
mkfifo "$PIPE"

claude --mcp-config /tmp/mcp.json --agent publisher \
  -p "$PROMPT" --output-format stream-json > "$PIPE" 2>&1 &
CLAUDE_PID=$!

LAST_OUTPUT=$SECONDS
while IFS= read -r -t 10 line; do
  LAST_OUTPUT=$SECONDS
  echo "$line"
  # Detect permission prompt in stream-json
  if echo "$line" | grep -q '"type":"permission_request"'; then
    echo "ERROR: Claude is requesting a permission prompt — killing"
    kill $CLAUDE_PID 2>/dev/null
    rm -f "$PIPE"
    exit 2
  fi
done < "$PIPE" &
READER_PID=$!

# Watchdog: kill if idle too long
while kill -0 $CLAUDE_PID 2>/dev/null; do
  sleep 10
  IDLE=$((SECONDS - LAST_OUTPUT))
  if [ "$IDLE" -ge "$MAX_IDLE" ]; then
    echo "ERROR: No output for ${IDLE}s — likely hung on permission prompt, killing"
    kill $CLAUDE_PID 2>/dev/null
    kill $READER_PID 2>/dev/null
    rm -f "$PIPE"
    exit 2
  fi
done

wait $CLAUDE_PID 2>/dev/null
CLAUDE_EXIT=$?
wait $READER_PID 2>/dev/null
rm -f "$PIPE"

if [ "$CLAUDE_EXIT" -ne 0 ]; then
  echo "Publisher pipeline failed with exit code $CLAUDE_EXIT"
  exit 1
fi

echo "Publisher completed on branch $BRANCH"
