#!/usr/bin/env bash
set -euo pipefail

# Autonomous Security Improvement Loop
# Spawns Claude Code iteratively to discover and fix security gaps in
# the Mac workstation's safety hooks, with adversarial verification.

# --- Constants ---
LOCKFILE="/tmp/sec-loop.lock"
STATUS_FILE="/tmp/sec-loop-status.json"
VERIFY_FILE="/tmp/sec-loop-verify.json"
SLEEP_INTERVAL=1800
DAILY_BUDGET=150
WORST_CASE_RATE_PER_MTOK=75
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DRY_RUN=false

# --- Lock file ---
acquire_lock() {
  if [ -f "$LOCKFILE" ]; then
    check_lock || return 1
  fi
  # noclobber prevents race between concurrent starts
  if (set -o noclobber; echo "$$:$(date +%s)" > "$LOCKFILE") 2>/dev/null; then
    trap 'release_lock' EXIT INT TERM HUP
    return 0
  else
    echo "ERROR: Failed to acquire lock (race condition)"
    return 1
  fi
}

release_lock() {
  rm -f "$LOCKFILE"
}

check_lock() {
  local content pid start_time now elapsed
  content=$(cat "$LOCKFILE" 2>/dev/null) || { rm -f "$LOCKFILE"; return 0; }
  pid="${content%%:*}"
  start_time="${content##*:}"
  now=$(date +%s)
  elapsed=$(( now - start_time ))

  # Process is dead — stale lock
  if ! kill -0 "$pid" 2>/dev/null; then
    echo "WARN: Stale lock from PID $pid, removing"
    rm -f "$LOCKFILE"
    return 0
  fi

  # Process alive: decide based on age
  if [ "$elapsed" -lt 300 ]; then
    # Under 5 min — wait once and retry
    echo "INFO: Lock held by PID $pid for ${elapsed}s, waiting 60s..."
    sleep 60
    if ! kill -0 "$pid" 2>/dev/null; then
      rm -f "$LOCKFILE"
      return 0
    fi
    echo "ERROR: Lock still held by PID $pid after wait"
    return 1
  elif [ "$elapsed" -lt 3600 ]; then
    # 5-60 min — normal operation, skip
    echo "ERROR: Lock held by PID $pid for ${elapsed}s (normal operation), skipping"
    return 1
  else
    # Over 60 min — likely stuck, kill and take over
    echo "WARN: Lock held by PID $pid for ${elapsed}s (>1h), killing"
    kill "$pid" 2>/dev/null || true
    sleep 2
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$LOCKFILE"
    return 0
  fi
}

# --- Cost gate ---
cost_gate() {
  local today total_tokens cost_cents
  today=$(date -u +%Y-%m-%d)

  # Sum output_tokens and cache_creation_input_tokens from today's JSONL records
  total_tokens=$(find ~/.claude/projects/ -name '*.jsonl' -newer /tmp/sec-loop-cost-anchor -print0 2>/dev/null \
    | xargs -0 grep -h "\"$today" 2>/dev/null \
    | jq -r '
        select(.message.usage)
        | (.message.usage.output_tokens // 0) + (.message.usage.cache_creation_input_tokens // 0)
      ' 2>/dev/null \
    | awk '{s+=$1} END {print s+0}' || echo "0")

  # Cost in dollars: tokens * (rate_per_MTok / 1_000_000)
  # Use integer arithmetic in cents to avoid bc dependency
  cost_cents=$(( total_tokens * WORST_CASE_RATE_PER_MTOK / 10000 ))
  local budget_cents=$(( DAILY_BUDGET * 100 ))

  echo "INFO: Today's estimated cost: \$$(( cost_cents / 100 )).$(printf '%02d' $(( cost_cents % 100 ))) / \$${DAILY_BUDGET} budget (${total_tokens} tokens)"

  if [ "$cost_cents" -ge "$budget_cents" ]; then
    echo "WARN: Daily budget exceeded"
    return 1
  fi
  return 0
}

# --- Discord notifications ---
# Posts to a specific channel. No-op if credentials missing or dry-run.
_discord_send() {
  local channel_id="$1" content="$2"

  if [ -z "${DISCORD_BOT_TOKEN:-}" ] || [ -z "$channel_id" ]; then
    return 0
  fi
  if [ "$DRY_RUN" = true ]; then
    return 0
  fi

  curl -sf -X POST \
    "https://discord.com/api/v10/channels/${channel_id}/messages" \
    -H "Authorization: Bot ${DISCORD_BOT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"content\": \"${content}\"}" \
    > /dev/null 2>&1 || true
}

# Milestones → #status-updates, operational noise → #log
discord_status() { _discord_send "${DISCORD_STATUS_CHANNEL_ID:-}" "$1"; }
discord_log()    { _discord_send "${DISCORD_LOG_CHANNEL_ID:-}" "$1"; }

# --- Argument parsing ---
parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      *)
        echo "Usage: $0 [--dry-run]"
        exit 1
        ;;
    esac
  done
}

# --- Main ---
main() {
  parse_args "$@"

  # Create cost anchor file for find -newer (today start)
  touch -t "$(date -u +%Y%m%d)0000" /tmp/sec-loop-cost-anchor 2>/dev/null || touch /tmp/sec-loop-cost-anchor

  acquire_lock || exit 1

  cd "$REPO_DIR"
  local iteration=0

  echo "=== Security Improvement Loop started (PID $$, dry_run=$DRY_RUN) ==="

  while true; do
    iteration=$(( iteration + 1 ))
    echo ""
    echo "--- Iteration $iteration ---"

    # Cost gate
    if ! cost_gate; then
      discord_status "Security loop stopped: daily budget of \$${DAILY_BUDGET} exceeded"
      echo "Exiting: budget exceeded"
      break
    fi

    export SEC_LOOP_ITERATION="$iteration"

    # Clean status files from previous iteration
    rm -f "$STATUS_FILE" "$VERIFY_FILE"

    # --- Improvement phase ---
    echo "Running improvement agent..."
    claude -p "$(cat "$SCRIPT_DIR/prompt.md")" \
      --model sonnet --output-format json \
      --max-turns 30 --max-budget-usd 5.00 \
      2>&1 | tee "/tmp/sec-loop-iter-${iteration}.log" || true

    # Read status file
    if [ ! -f "$STATUS_FILE" ]; then
      echo "WARN: Status file missing after iteration $iteration (agent may have hit budget)"
      discord_log "Iteration $iteration: status file missing (agent may have hit budget cap), restoring and continuing"
      git restore . 2>/dev/null || true
      sleep "$SLEEP_INTERVAL"
      continue
    fi

    local action
    action=$(jq -r '.action // "unknown"' "$STATUS_FILE" 2>/dev/null || echo "unknown")

    if [ "$action" = "done" ]; then
      local reason
      reason=$(jq -r '.reason // "no reason given"' "$STATUS_FILE" 2>/dev/null)
      echo "Agent reports no more improvements: $reason"
      discord_status "Security loop terminated: $reason"
      break
    elif [ "$action" != "improved" ]; then
      echo "WARN: Unexpected action '$action' in status file"
      discord_log "Iteration $iteration: unexpected status action '$action', restoring and continuing"
      git restore . 2>/dev/null || true
      sleep "$SLEEP_INTERVAL"
      continue
    fi

    local finding
    finding=$(jq -r '.finding // "unknown"' "$STATUS_FILE" 2>/dev/null)
    echo "Finding: $finding"

    # --- Verification phase ---
    echo "Running verification agent..."
    claude -p "$(cat "$SCRIPT_DIR/verify-prompt.md")" \
      --model sonnet --output-format json \
      --max-turns 15 --max-budget-usd 2.00 \
      2>&1 | tee "/tmp/sec-loop-verify-${iteration}.log" || true

    # Read verification result
    local verify_result="unknown"
    if [ -f "$VERIFY_FILE" ]; then
      verify_result=$(jq -r '.result // "unknown"' "$VERIFY_FILE" 2>/dev/null || echo "unknown")
    fi

    if [ "$verify_result" = "pass" ]; then
      echo "Verification passed"
      if [ "$DRY_RUN" = false ]; then
        git add -A
        git commit -m "$(cat <<EOF
sec-loop: fix — $finding

Iteration: $iteration
Automated by: apps/agent-loops/macbook-security-loop/loop.sh

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
EOF
)"
        discord_status "Security loop iteration ${iteration} complete: ${finding}"
      else
        echo "DRY-RUN: Skipping git commit and discord notification"
      fi
    else
      local failure_reason
      failure_reason=$(jq -r '.failure_reason // "unknown"' "$VERIFY_FILE" 2>/dev/null || echo "unknown")
      echo "Verification FAILED: $failure_reason"
      if [ "$DRY_RUN" = false ]; then
        git restore .
        discord_log "Iteration $iteration verification failed: $failure_reason"
      else
        echo "DRY-RUN: Skipping git restore and discord notification"
      fi
    fi

    # Clean up iteration logs
    rm -f "/tmp/sec-loop-iter-${iteration}.log" "/tmp/sec-loop-verify-${iteration}.log"

    # Dry-run: single iteration only
    if [ "$DRY_RUN" = true ]; then
      echo "DRY-RUN: Exiting after one iteration"
      break
    fi

    echo "Sleeping ${SLEEP_INTERVAL}s before next iteration..."
    sleep "$SLEEP_INTERVAL"
  done

  # Cleanup
  rm -f "$STATUS_FILE" "$VERIFY_FILE" /tmp/sec-loop-cost-anchor
  echo "=== Security Improvement Loop finished ==="
}

main "$@"
