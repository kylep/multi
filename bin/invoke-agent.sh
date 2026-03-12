#!/usr/bin/env bash
# Invoke a Claude Code agent, bypassing nested session detection.
# Usage: bin/invoke-agent.sh <agent-name> "<prompt>"
set -euo pipefail
LOG="${AGENT_LOG:-agent-events.log}"
echo "[$(date '+%H:%M:%S')] ▶ $1" >> "$LOG"
unset CLAUDECODE 2>/dev/null || true
EXIT=0
claude --agent "$1" -p "$2" --output-format text || EXIT=$?
echo "[$(date '+%H:%M:%S')] ■ $1 (exit $EXIT)" >> "$LOG"
exit $EXIT
