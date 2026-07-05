#!/bin/bash
# Start the llm-client dev server in the background and wait for it to be ready.
# Run from apps/llm-client/. Kill with bin/kill-dev.sh.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

PORT="${1:-3100}"

if curl -s -o /dev/null "http://127.0.0.1:$PORT" 2>/dev/null; then
  echo "Dev server already running at http://127.0.0.1:$PORT"
  exit 0
fi

pnpm dev --port "$PORT" &
DEV_PID=$!

for i in $(seq 1 30); do
  if curl -s -o /dev/null "http://127.0.0.1:$PORT" 2>/dev/null; then
    echo "Dev server ready at http://127.0.0.1:$PORT (PID $DEV_PID)"
    exit 0
  fi
  sleep 0.5
done

kill "$DEV_PID" 2>/dev/null || true
echo "Dev server did not start in time" >&2
exit 1
