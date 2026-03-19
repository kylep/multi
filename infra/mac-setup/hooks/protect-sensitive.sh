#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

check_path() {
  local filepath="$1"
  case "$filepath" in
    */.env|*/.env.*|*.env)
      echo "BLOCKED by protect-sensitive hook: .env file" >&2
      exit 2 ;;
    */.ssh/id_*)
      echo "BLOCKED by protect-sensitive hook: SSH key" >&2
      exit 2 ;;
    */.aws/credentials*)
      echo "BLOCKED by protect-sensitive hook: AWS creds" >&2
      exit 2 ;;
    */.kube/config*)
      echo "BLOCKED by protect-sensitive hook: kubeconfig" >&2
      exit 2 ;;
  esac
}

if [[ "$TOOL" == "Bash" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
  if echo "$COMMAND" | \
     grep -qE '(cat|less|head|tail|curl -d @|base64|scp)\s+\.env'; then
    echo "BLOCKED by protect-sensitive hook: .env access via bash" >&2
    exit 2
  fi
  if echo "$COMMAND" | \
     grep -qE '(cat|less|head|tail)\s+.*(\.ssh/id_|\.aws/credentials|\.kube/config)'; then
    echo "BLOCKED by protect-sensitive hook: sensitive file access via bash" >&2
    exit 2
  fi
else
  FILEPATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
  if [[ -n "$FILEPATH" ]]; then
    check_path "$FILEPATH"
  fi
fi

exit 0
