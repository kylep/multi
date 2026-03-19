#!/usr/bin/env bash

REPO_DIR="{{ repo_dir }}"
LOG="${REPO_DIR}/logs/claude-audit.jsonl"

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')

case "$TOOL" in
  Bash)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.command // empty') ;;
  Read|Edit|Write)
    PARAM=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty') ;;
  *)
    PARAM="" ;;
esac

jq -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg sid "$SESSION" \
  --arg tool "$TOOL" \
  --arg param "$PARAM" \
  --arg cwd "$CWD" \
  '{timestamp: $ts, session_id: $sid, tool: $tool, param: $param, cwd: $cwd}' \
  >> "$LOG"

exit 0
