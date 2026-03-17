#!/bin/bash
set -euo pipefail

PROMPT="${1:?Usage: run-publisher.sh '<prompt>'}"
BRANCH="agent/publisher-$(date +%s)"

# Validate required env vars
: "${CLAUDE_CODE_OAUTH_TOKEN:?CLAUDE_CODE_OAUTH_TOKEN is required}"

# Git identity (if not already set)
git config user.name "publisher-agent" 2>/dev/null || true
git config user.email "publisher-agent@noreply" 2>/dev/null || true

# Create branch
git checkout -b "$BRANCH"

# Prevent auth conflicts — OAuth token must be the only auth mechanism
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL

# Run publisher pipeline.
# stream-json + verbose streams every event (including subagent calls) to
# stdout → pod logs. The 30min activeDeadlineSeconds on the K8s job is
# the hard ceiling. Permission prompts are visible in the stream as
# "type":"permission_request" events.
claude --mcp-config /tmp/mcp.json --agent publisher \
  -p "$PROMPT" --output-format stream-json --verbose --include-partial-messages 2>&1
CLAUDE_EXIT=$?

if [ "$CLAUDE_EXIT" -ne 0 ]; then
  echo "Publisher pipeline failed with exit code $CLAUDE_EXIT"
  exit 1
fi

echo "Publisher completed on branch $BRANCH"
