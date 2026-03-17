#!/bin/bash
set -euo pipefail

PROMPT="${1:?Usage: run-publisher.sh '<prompt>'}"
BRANCH="agent/publisher-$(date +%s)"

# Validate required env vars
: "${CLAUDE_CODE_OAUTH_TOKEN:?CLAUDE_CODE_OAUTH_TOKEN is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

# Git identity (if not already set)
git config user.name "publisher-agent" 2>/dev/null || true
git config user.email "publisher-agent@noreply" 2>/dev/null || true

# Create branch
git checkout -b "$BRANCH"

# Prevent auth conflicts — OAuth token must be the only auth mechanism
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN ANTHROPIC_BASE_URL

# Discord notification helper (no-op if DISCORD_WEBHOOK_URL is unset)
notify_discord() {
  local message="$1"
  if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
    return 0
  fi
  curl -s -o /dev/null -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"content\": $(printf '%s' "$message" | jq -Rs .)}" || true
}

# Run publisher pipeline, capturing output for error reporting
CLAUDE_LOG=$(mktemp)
claude --mcp-config /tmp/mcp.json --agent publisher \
  -p "$PROMPT" --output-format text 2>&1 | tee "$CLAUDE_LOG" || true
CLAUDE_EXIT=${PIPESTATUS[0]}

if [ "$CLAUDE_EXIT" -eq 0 ]; then
  git push -u origin "$BRANCH"
  PR_URL=$(gh pr create --base main \
    --title "$(printf '%s' "$PROMPT" | head -c 70)" \
    --body "$(cat <<EOF
Autonomous publisher run.

**Prompt:** $PROMPT
EOF
)")
  notify_discord "Publisher completed: \"$PROMPT\"\nPR: $PR_URL\nBranch: $BRANCH"
else
  ERROR_TAIL=$(tail -20 "$CLAUDE_LOG")
  notify_discord "Publisher FAILED: \"$PROMPT\"\nError:\n$ERROR_TAIL\nBranch: $BRANCH (preserved)"
  rm -f "$CLAUDE_LOG"
  exit 1
fi

rm -f "$CLAUDE_LOG"
