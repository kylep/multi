#!/usr/bin/env bash
# PostToolUse audit hook — writes structured JSON to stdout.
# In K8s, stdout is captured by Vector and shipped to OpenObserve (k8s_logs stream).
# Locally, also appends to logs/claude-audit.jsonl if the directory exists.

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}')

ENTRY=$(jq -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg sid "$SESSION" \
  --arg tool "$TOOL" \
  --argjson input "$TOOL_INPUT" \
  --arg cwd "$CWD" \
  '{timestamp: $ts, session_id: $sid, tool: $tool, input: $input, cwd: $cwd}')

echo "$ENTRY"

LOCAL_LOG="/Users/pai/gh/multi/logs/claude-audit.jsonl"
if [ -d "$(dirname "$LOCAL_LOG")" ]; then
  echo "$ENTRY" >> "$LOCAL_LOG"
  chmod 600 "$LOCAL_LOG" 2>/dev/null || true
fi

exit 0
