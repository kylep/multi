#!/usr/bin/env bash
# PostToolUse audit hook — writes structured JSON to stdout.
# In K8s, stdout is captured by Vector and shipped to OpenObserve (k8s_logs stream).
# Locally, also appends to logs/claude-audit.jsonl if the directory exists.
#
# Schema (additive — adding fields is safe; renaming would break consumers):
#   timestamp     ISO 8601 UTC
#   session_id    Claude session id (group tool calls within a single agent run)
#   tool          tool name (Bash, Read, Edit, Write, mcp__*, ...)
#   input         tool_input object (command, file_path, etc.)
#   cwd           working dir of the agent process
#   is_error      true if Claude reported the tool call as failed
#   error_excerpt up to 400 chars of stderr/output (only when is_error)
# pai-self-improver queries this stream to detect recurring failures.

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input // {}')
IS_ERROR=$(echo "$INPUT" | jq -r '.tool_response.is_error // false')

# Pull a short error excerpt only when the call actually failed. Keeps the
# happy-path payload small. Bash tool puts stderr/stdout under a few possible
# keys depending on Claude version, so try several.
if [ "$IS_ERROR" = "true" ]; then
  ERROR_EXCERPT=$(echo "$INPUT" | jq -r '
    .tool_response as $r |
    (
      $r.stderr // $r.error // $r.output // $r.content //
      ($r.stdout // "")
    ) // ""
  ' | head -c 400)
else
  ERROR_EXCERPT=""
fi

ENTRY=$(jq -nc \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg sid "$SESSION" \
  --arg tool "$TOOL" \
  --argjson input "$TOOL_INPUT" \
  --arg cwd "$CWD" \
  --argjson is_error "$IS_ERROR" \
  --arg error_excerpt "$ERROR_EXCERPT" \
  '{
     timestamp: $ts,
     session_id: $sid,
     tool: $tool,
     input: $input,
     cwd: $cwd,
     is_error: $is_error,
     error_excerpt: $error_excerpt
   }')

echo "$ENTRY"

LOCAL_LOG="/Users/pai/gh/multi/logs/claude-audit.jsonl"
if [ -d "$(dirname "$LOCAL_LOG")" ]; then
  echo "$ENTRY" >> "$LOCAL_LOG"
  chmod 600 "$LOCAL_LOG" 2>/dev/null || true
fi

exit 0
