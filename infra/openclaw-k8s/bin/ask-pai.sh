#!/usr/bin/env bash
set -euo pipefail

# Send a message to Pai (OpenClaw agent) and print the response.
# Usage: ./ask-pai.sh "What skills do you have?"

if [ $# -eq 0 ]; then
  echo "Usage: ask-pai.sh <message>" >&2
  exit 1
fi

MSG="$1"

RESULT=$(kubectl exec -n openclaw openclaw-0 -c openclaw -- \
  openclaw agent --agent main --message "$MSG" --json 2>/dev/null)

echo "$RESULT" | jq -r '.result.payloads[0].text // .error // "No response"'
