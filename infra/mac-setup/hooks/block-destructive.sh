#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

BLOCKED=""

case "$COMMAND" in
  *"rm -rf /"*|*"rm -rf ~"*)
    BLOCKED="recursive delete of root or home" ;;
  *"git push --force"*|*"git push -f "*)
    BLOCKED="force push" ;;
  *"git reset --hard"*)
    BLOCKED="hard reset" ;;
  *"DROP TABLE"*|*"DROP DATABASE"*)
    BLOCKED="database drop" ;;
  *":(){ :|:& };:"*)
    BLOCKED="fork bomb" ;;
  *"curl"*"|"*"sh"*|*"curl"*"|"*"bash"*)
    BLOCKED="piped remote execution" ;;
  *"chmod 777"*)
    BLOCKED="world-writable permissions" ;;
  *"mkfs."*)
    BLOCKED="filesystem format" ;;
esac

if [[ -z "$BLOCKED" ]] && echo "$COMMAND" | \
   grep -qE 'dd\s+if=.*of=/dev/'; then
  BLOCKED="raw device write"
fi

if [[ -n "$BLOCKED" ]]; then
  echo "BLOCKED by block-destructive hook: $BLOCKED" >&2
  exit 2
fi

exit 0
