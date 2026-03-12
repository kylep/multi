#!/usr/bin/env bash
# Append a timestamped event to the agent log.
# Usage: bin/log-event.sh "message"
LOG="${AGENT_LOG:-agent-events.log}"
echo "[$(date '+%H:%M:%S')] $*" >> "$LOG"
