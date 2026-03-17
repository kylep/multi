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
  -p "$PROMPT" --output-format stream-json --verbose --include-partial-messages 2>&1 \
  || { echo "Publisher pipeline failed"; exit 1; }

echo "Publisher completed on branch $BRANCH"

# Push branch and create PR if GITHUB_TOKEN is available
if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "Pushing branch $BRANCH to origin..."
  git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/kylep/multi.git"
  git push -u origin "$BRANCH"
  git remote set-url origin "https://github.com/kylep/multi.git"

  # Extract a short title from the prompt (first 60 chars)
  PR_TITLE="Publisher: ${PROMPT:0:60}"
  if [ ${#PROMPT} -gt 60 ]; then
    PR_TITLE="${PR_TITLE}..."
  fi

  echo "Creating PR..."
  PR_URL=$(gh pr create --base main --title "$PR_TITLE" --body "Autonomous publisher run.

Prompt: $PROMPT
Branch: $BRANCH")
  echo "PR created: $PR_URL"
else
  echo "GITHUB_TOKEN not set — skipping push and PR creation"
fi
